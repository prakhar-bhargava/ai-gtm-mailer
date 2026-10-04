import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";

// The Outbox holds emails a rep chose to send. Nothing is delivered by email from here:
// it's a record in this app, and a real send needs a connected mail account (not built).
export type OutboxItem = {
  id: string;
  runId: string;
  toName: string;
  toCompany: string;
  toEmail: string | null;
  subject: string;
  body: string;
  sentAt: string;
};

type OutboxRow = {
  id: string;
  run_id: string;
  to_name: string;
  to_company: string;
  to_email: string | null;
  subject: string;
  body: string;
  sent_at: string;
};

const toItem = (row: OutboxRow): OutboxItem => ({
  id: row.id,
  runId: row.run_id,
  toName: row.to_name,
  toCompany: row.to_company,
  toEmail: row.to_email,
  subject: row.subject,
  body: row.body,
  sentAt: row.sent_at,
});

export function addToOutbox(item: Omit<OutboxItem, "id" | "sentAt">): string {
  const id = randomUUID();
  getDb()
    .prepare(
      "INSERT INTO outbox (id, run_id, to_name, to_company, to_email, subject, body, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, item.runId, item.toName, item.toCompany, item.toEmail, item.subject, item.body, new Date().toISOString());
  return id;
}

export function listOutbox(): OutboxItem[] {
  const rows = getDb().prepare("SELECT * FROM outbox ORDER BY sent_at DESC").all() as OutboxRow[];
  return rows.map(toItem);
}

export function getOutboxItem(id: string): OutboxItem | null {
  const row = getDb().prepare("SELECT * FROM outbox WHERE id = ?").get(id) as OutboxRow | undefined;
  return row ? toItem(row) : null;
}
