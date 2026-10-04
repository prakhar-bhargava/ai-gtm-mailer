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
  payload_json TEXT,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS run_events_by_run ON run_events(run_id, id);
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  to_name TEXT NOT NULL,
  to_company TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  job_board TEXT,
  social_json TEXT NOT NULL DEFAULT '[]',
  company_linkedin_url TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  company_id TEXT NOT NULL REFERENCES companies(id),
  linkedin_url TEXT,
  updated_at TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS account_index USING fts5(company_id UNINDEXED, text);
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  stored_at TEXT NOT NULL
);
`;

// Older local databases had draft_json instead of payload_json. Add the new column if it's missing.
function migrate(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(run_events)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "payload_json")) {
    db.exec("ALTER TABLE run_events ADD COLUMN payload_json TEXT");
  }
  // Recipient email, added after the first release.
  const people = (db.prepare("PRAGMA table_info(people)").all() as { name: string }[]).map((column) => column.name);
  if (!people.includes("email")) db.exec("ALTER TABLE people ADD COLUMN email TEXT");
  const outbox = (db.prepare("PRAGMA table_info(outbox)").all() as { name: string }[]).map((column) => column.name);
  if (!outbox.includes("to_email")) db.exec("ALTER TABLE outbox ADD COLUMN to_email TEXT");
}

// Kept on globalThis so Next's hot reload in development doesn't open a second connection.
const globalForDb = globalThis as typeof globalThis & { appDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.appDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(SCHEMA);
    migrate(db);
    globalForDb.appDb = db;
  }
  return globalForDb.appDb;
}
