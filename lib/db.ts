import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// One local SQLite file, created on first use. It lives in data/, which git ignores.
const DB_PATH = path.join(process.cwd(), "data", "app.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  prospect_json TEXT NOT NULL,
  status TEXT NOT NULL,
  outcome TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE TABLE IF NOT EXISTS run_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES runs(id),
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  duration_ms INTEGER,
  draft_json TEXT,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS run_events_by_run ON run_events(run_id, id);
`;

// Kept on globalThis so Next's hot reload in development doesn't open a second connection.
const globalForDb = globalThis as typeof globalThis & { appDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.appDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(SCHEMA);
    globalForDb.appDb = db;
  }
  return globalForDb.appDb;
}
