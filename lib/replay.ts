import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { appendEvent, createRun, setRunStatus } from "@/lib/runs";
import { Outcome, ProspectInput, StageEvent } from "@/lib/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Plays a recorded search's events at a steady, watchable pace (about half a minute in all), whatever the
// original timing was: recorded runs often came from cache and finished in a second. Each event gets a fresh
// timestamp, and each step's duration is the time it took in this replay.
const PACE_MS = { started: 650, progress: 420, done: 750, failed: 750 } as const;

export async function playReplay(name: string, emit: (event: ReplayFile["events"][number]) => void) {
  const replay = getReplay(name);
  if (!replay) throw new Error("No recorded search with that name");
  const startedAt = new Map<string, number>();
  for (const event of replay.events) {
    await sleep(event.stage === "run" ? 600 : PACE_MS[event.status]);
    const now = Date.now();
    if (event.status === "started") startedAt.set(event.stage, now);
    const durationMs =
      (event.status === "done" || event.status === "failed") && startedAt.has(event.stage)
        ? now - (startedAt.get(event.stage) ?? now)
        : event.durationMs;
    emit({ ...event, durationMs, at: new Date(now).toISOString() });
  }
  return replay.outcome;
}

// Recorded searches for testing without Gemini or any outside source.
// Each file is a real search from this app's history. Replaying one saves it as a new search,
// so Send, the Outbox and the findings panel all work on it.
const ReplayFile = z.object({
  name: z.string(),
  label: z.string(),
  why: z.string(),
  outcome: Outcome,
  prospect: ProspectInput,
  recordedAt: z.string(),
  note: z.string(),
  events: z.array(StageEvent),
});
export type ReplayFile = z.infer<typeof ReplayFile>;

const DIR = path.join(process.cwd(), "fixtures", "replays");

export function listReplays(): ReplayFile[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ReplayFile.parse(JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))));
}

export function getReplay(name: string): ReplayFile | null {
  return listReplays().find((item) => item.name === name) ?? null;
}

// Saves a copy of a recorded search as a new search and returns its ID, or null if the name is unknown.
// live: the run starts "new" and its stream plays the recorded steps back at their recorded pace,
// so the run page shows the steps, the findings feed and the writing animation as in a real run.
export function createReplayRun(name: string, options: { live?: boolean } = {}): string | null {
  const replay = getReplay(name);
  if (!replay) return null;

  if (options.live) {
    return createRun(
      { ...replay.prospect, notes: `Replay of a recorded search (${replay.label}). No model or source calls are made.` },
      { replayOf: replay.name },
    );
  }

  const id = createRun({
    ...replay.prospect,
    notes: `Replay of a recorded search (${replay.label}). No model or source calls were made.`,
  });
  for (const event of replay.events) appendEvent(id, event);
  setRunStatus(id, "finished", replay.outcome);
  return id;
}
