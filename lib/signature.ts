import { getDb } from "@/lib/db";
import { DEFAULT_SENDER, Sender } from "@/lib/sender";

// The rep's signature, stored in the local database so it applies to every draft and the Outbox.
// Falls back to config/sender.json when nothing has been saved.

function ensureTable() {
  getDb().exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");
}

export function getSender(): Sender {
  ensureTable();
  const row = getDb().prepare("SELECT value FROM settings WHERE key = 'sender'").get() as { value: string } | undefined;
  if (!row) return DEFAULT_SENDER;
  const parsed = Sender.safeParse({ ...DEFAULT_SENDER, ...JSON.parse(row.value) });
  return parsed.success ? parsed.data : DEFAULT_SENDER;
}

export function saveSender(sender: Sender): Sender {
  ensureTable();
  getDb()
    .prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('sender', ?, ?)")
    .run(JSON.stringify(sender), new Date().toISOString());
  return sender;
}

export function resetSender(): Sender {
  ensureTable();
  getDb().prepare("DELETE FROM settings WHERE key = 'sender'").run();
  return DEFAULT_SENDER;
}
