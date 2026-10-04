import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ProspectInput, StagePayload, StageEvent, type Outcome } from "@/lib/types";

// new: created, not yet executed. running: pipeline in progress. finished: outcome is set.
export type RunStatus = "new" | "running" | "finished";
export type RunOutcome = Outcome;

export type RunRecord = {
  id: string;
  prospect: ProspectInput;
  status: RunStatus;
  outcome: RunOutcome | null;
  createdAt: string;
  finishedAt: string | null;
  replayOf: string | null; // set when the run replays a recorded search
};

type RunRow = {
  id: string;
  prospect_json: string;
  status: RunStatus;
  outcome: RunOutcome | null;
  created_at: string;
  finished_at: string | null;
  replay_of?: string | null;
};

function toRecord(row: RunRow): RunRecord {
  return {
    id: row.id,
    prospect: ProspectInput.parse(JSON.parse(row.prospect_json)),
    status: row.status,
    outcome: row.outcome,
    createdAt: row.created_at,
    finishedAt: row.finished_at,
    replayOf: row.replay_of ?? null,
  };
}

export function createRun(prospect: ProspectInput, options: { replayOf?: string } = {}): string {
  const id = randomUUID();
  getDb()
    .prepare("INSERT INTO runs (id, prospect_json, status, created_at, replay_of) VALUES (?, ?, 'new', ?, ?)")
    .run(id, JSON.stringify(prospect), new Date().toISOString(), options.replayOf ?? null);
  return id;
}

export function getRun(id: string): RunRecord | null {
  const row = getDb().prepare("SELECT * FROM runs WHERE id = ?").get(id) as RunRow | undefined;
  return row ? toRecord(row) : null;
}

export function listRuns(limit = 100): RunRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM runs ORDER BY created_at DESC LIMIT ?")
    .all(limit) as RunRow[];
  return rows.map(toRecord);
}

// Searches saved runs by name or company, optionally filtered by outcome.
export function searchRuns(options: { q?: string; outcome?: RunOutcome | "all" | "open"; limit?: number }): RunRecord[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (options.q) {
    clauses.push("prospect_json LIKE ? ESCAPE '\\'");
    params.push(`%${options.q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`);
  }
  if (options.outcome === "open") {
    clauses.push("status <> 'finished'");
  } else if (options.outcome && options.outcome !== "all") {
    clauses.push("outcome = ?");
    params.push(options.outcome);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  params.push(options.limit ?? 200);
  const rows = getDb()
    .prepare(`SELECT * FROM runs ${where} ORDER BY created_at DESC LIMIT ?`)
    .all(...params) as RunRow[];
  return rows.map(toRecord);
}

export function countRuns(): { total: number; byOutcome: Record<string, number> } {
  const rows = getDb()
    .prepare("SELECT status, outcome, COUNT(*) AS n FROM runs GROUP BY status, outcome")
    .all() as { status: string; outcome: string | null; n: number }[];
  const byOutcome: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    total += row.n;
    const key = row.status === "finished" && row.outcome ? row.outcome : row.status;
    byOutcome[key] = (byOutcome[key] ?? 0) + row.n;
  }
  return { total, byOutcome };
}

export function setRunStatus(id: string, status: RunStatus, outcome: RunOutcome | null = null) {
  const finishedAt = status === "finished" ? new Date().toISOString() : null;
  getDb()
    .prepare("UPDATE runs SET status = ?, outcome = ?, finished_at = ? WHERE id = ?")
    .run(status, outcome, finishedAt, id);
}

export function appendEvent(runId: string, event: StageEvent) {
  getDb()
    .prepare(
      "INSERT INTO run_events (run_id, stage, status, message, duration_ms, payload_json, at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      runId,
      event.stage,
      event.status,
      event.message,
      event.durationMs ?? null,
      event.payload ? JSON.stringify(event.payload) : null,
      event.at,
    );
}

type EventRow = {
  stage: string;
  status: string;
  message: string;
  duration_ms: number | null;
  payload_json: string | null;
  at: string;
};

export function getEvents(runId: string): StageEvent[] {
  const rows = getDb()
    .prepare("SELECT stage, status, message, duration_ms, payload_json, at FROM run_events WHERE run_id = ? ORDER BY id")
    .all(runId) as EventRow[];
  // An old event that no longer matches the current format keeps its message, without its extra data,
  // so the search still opens instead of failing as a whole.
  return rows.flatMap((row) => {
    const payload = row.payload_json ? StagePayload.safeParse(JSON.parse(row.payload_json)) : null;
    const event = StageEvent.safeParse({
      stage: row.stage,
      status: row.status,
      message: row.message,
      durationMs: row.duration_ms ?? undefined,
      payload: payload?.success ? payload.data : undefined,
      at: row.at,
    });
    return event.success ? [event.data] : [];
  });
}
