import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { Draft, ProspectInput, StageEvent } from "@/lib/types";

// new: created, not yet executed. running: pipeline in progress. finished: outcome is set.
export type RunStatus = "new" | "running" | "finished";
export type RunOutcome = "draft" | "stopped";

export type RunRecord = {
  id: string;
  prospect: ProspectInput;
  status: RunStatus;
  outcome: RunOutcome | null;
  createdAt: string;
  finishedAt: string | null;
};

type RunRow = {
  id: string;
  prospect_json: string;
  status: RunStatus;
  outcome: RunOutcome | null;
  created_at: string;
  finished_at: string | null;
};

function toRecord(row: RunRow): RunRecord {
  return {
    id: row.id,
    prospect: ProspectInput.parse(JSON.parse(row.prospect_json)),
    status: row.status,
    outcome: row.outcome,
    createdAt: row.created_at,
    finishedAt: row.finished_at,
  };
}

export function createRun(prospect: ProspectInput): string {
  const id = randomUUID();
  getDb()
    .prepare("INSERT INTO runs (id, prospect_json, status, created_at) VALUES (?, ?, 'new', ?)")
    .run(id, JSON.stringify(prospect), new Date().toISOString());
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

export function setRunStatus(id: string, status: RunStatus, outcome: RunOutcome | null = null) {
  const finishedAt = status === "finished" ? new Date().toISOString() : null;
  getDb()
    .prepare("UPDATE runs SET status = ?, outcome = ?, finished_at = ? WHERE id = ?")
    .run(status, outcome, finishedAt, id);
}

export function appendEvent(runId: string, event: StageEvent) {
  getDb()
    .prepare(
      "INSERT INTO run_events (run_id, stage, status, message, duration_ms, draft_json, at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      runId,
      event.stage,
      event.status,
      event.message,
      event.durationMs ?? null,
      event.draft ? JSON.stringify(event.draft) : null,
      event.at,
    );
}

type EventRow = {
  stage: string;
  status: string;
  message: string;
  duration_ms: number | null;
  draft_json: string | null;
  at: string;
};

export function getEvents(runId: string): StageEvent[] {
  const rows = getDb()
    .prepare("SELECT stage, status, message, duration_ms, draft_json, at FROM run_events WHERE run_id = ? ORDER BY id")
    .all(runId) as EventRow[];
  return rows.map((row) =>
    StageEvent.parse({
      stage: row.stage,
      status: row.status,
      message: row.message,
      durationMs: row.duration_ms ?? undefined,
      draft: row.draft_json ? Draft.parse(JSON.parse(row.draft_json)) : undefined,
      at: row.at,
    }),
  );
}
