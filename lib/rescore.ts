import rubric from "@/config/rubric.json";
import { getDb } from "@/lib/db";
import { runPipeline } from "@/lib/pipeline";
import { appendEvent, createRun, setRunStatus } from "@/lib/runs";
import type { Draft, Hook, Outcome, ProspectInput, StagePayload } from "@/lib/types";

// Two ways to bring saved runs up to today's rules, used by the dashboard's "Bring runs up to date" card
// and by scripts/rescore-runs.ts.
//
// recheckFlaggedRuns: re-applies the current "ready to review" rule. A flagged run becomes ready only when,
// under today's rule, its chosen angle clears thresholds.personalised, every cited claim was backed by
// its source, and the check found no issues. The email, sources and checks stay as they were.
//
// rerunFlaggedProspects: starts a fresh run, with the current pipeline, for each prospect whose latest
// run was flagged or stopped. The old run stays in the history; the new one is a real run.

type EventRow = { id: number; stage: string; status: string; message: string; payload_json: string | null };
export type RecheckLine = { runId: string; company: string; score: number; ready: boolean; reason: string };

export function recheckFlaggedRuns(apply: boolean): { checked: number; changed: number; lines: RecheckLine[] } {
  const db = getDb();
  const runs = db.prepare("SELECT id, prospect_json FROM runs WHERE status = 'finished' AND outcome = 'flagged'").all() as {
    id: string;
    prospect_json: string;
  }[];
  const lines: RecheckLine[] = [];
  for (const run of runs) {
    const events = db.prepare("SELECT id, stage, status, message, payload_json FROM run_events WHERE run_id = ? ORDER BY id").all(run.id) as EventRow[];
    const payloads = events.map((event) => ({ event, payload: event.payload_json ? (JSON.parse(event.payload_json) as StagePayload) : null }));
    const draft = [...payloads].reverse().find((item) => item.payload?.draft)?.payload?.draft as Draft | undefined;
    const hooks = [...payloads].reverse().find((item) => item.payload?.hooks)?.payload?.hooks as Hook[] | undefined;
    const chosen = hooks?.find((hook) => !hook.blockedReason);
    if (!draft || !chosen) continue;
    const company = (JSON.parse(run.prospect_json) as ProspectInput).company;
    const strong = chosen.scores.total >= rubric.thresholds.personalised;
    const backed = draft.claims.length > 0 && draft.claims.every((claim) => claim.supported);
    const clean = (draft.lintIssues ?? []).length === 0;
    const ready = strong && backed && clean;
    const reason = ready
      ? "every claim backed, no issues"
      : [strong ? "" : `scored ${chosen.scores.total}`, backed ? "" : "a claim isn't backed", clean ? "" : `${draft.lintIssues.length} issue${draft.lintIssues.length === 1 ? "" : "s"}`]
          .filter(Boolean)
          .join(", ");
    lines.push({ runId: run.id, company, score: chosen.scores.total, ready, reason });
    if (!ready || !apply) continue;

    db.prepare("UPDATE runs SET outcome = 'draft' WHERE id = ?").run(run.id);
    for (const { event, payload } of payloads) {
      if (!payload?.outcome) continue;
      const message =
        event.stage === "run" ? "Draft ready for review" : event.stage === "verify" ? "All claims supported and every guardrail passes" : event.message;
      db.prepare("UPDATE run_events SET payload_json = ?, message = ? WHERE id = ?").run(JSON.stringify({ ...payload, outcome: "draft" }), message, event.id);
    }
  }
  return { checked: lines.length, changed: lines.filter((line) => line.ready).length, lines };
}

const globalForRerun = globalThis as typeof globalThis & { rerunQueue?: Promise<void> };

// Runs one saved run to the end without a browser attached. Events are saved as they happen, so opening
// the run page follows it live.
async function execute(id: string, prospect: ProspectInput) {
  setRunStatus(id, "running");
  let outcome: Outcome = "stopped";
  try {
    outcome = await runPipeline(prospect, (event) => appendEvent(id, event));
  } finally {
    setRunStatus(id, "finished", outcome);
  }
}

export function rerunFlaggedProspects(limit = 8): { started: { runId: string; company: string }[] } {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, prospect_json, outcome, created_at FROM runs WHERE status = 'finished' AND replay_of IS NULL ORDER BY created_at DESC")
    .all() as { id: string; prospect_json: string; outcome: string | null }[];
  const latest = new Map<string, { prospect: ProspectInput; outcome: string | null }>();
  for (const row of rows) {
    const prospect = JSON.parse(row.prospect_json) as ProspectInput;
    const key = `${prospect.name.toLowerCase()}|${prospect.company.toLowerCase()}`;
    if (!latest.has(key)) latest.set(key, { prospect, outcome: row.outcome });
  }
  const targets = [...latest.values()].filter((item) => item.outcome === "flagged" || item.outcome === "stopped").slice(0, limit);
  const started = targets.map(({ prospect }) => ({ runId: createRun(prospect), company: prospect.company, prospect }));
  // One after another, so the model's rate limit and the sites being read aren't hit all at once.
  globalForRerun.rerunQueue = started.reduce(
    (queue, item) => queue.then(() => execute(item.runId, item.prospect).catch(() => undefined)),
    globalForRerun.rerunQueue ?? Promise.resolve(),
  );
  return { started: started.map(({ runId, company }) => ({ runId, company })) };
}
