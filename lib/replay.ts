import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { appendEvent, createRun, setRunStatus } from "@/lib/runs";
import { Outcome, ProspectInput, StageEvent } from "@/lib/types";

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

// Saves a copy of a recorded search as a new search and returns its ID, or null if the name is unknown.
export function createReplayRun(name: string): string | null {
  const replay = listReplays().find((item) => item.name === name);
  if (!replay) return null;

  const id = createRun({
    ...replay.prospect,
    notes: `Replay of a recorded search (${replay.label}). No model or source calls were made.`,
  });
  for (const event of replay.events) appendEvent(id, event);
  setRunStatus(id, "finished", replay.outcome);
  return id;
}
