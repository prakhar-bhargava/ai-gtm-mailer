import { getDb } from "@/lib/db";

// Free local search over the accounts list. It uses SQLite's built-in full-text index (FTS5), which
// splits text into words, matches word prefixes and ranks results by relevance. It stands in for
// Elasticsearch, which needs a hosted cluster. Data is small, so each company is re-indexed on change.

// Words from a company's own record: name, website, job board, social profile names, and the people saved there.
export function indexCompany(companyId: string): void {
  const db = getDb();
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId) as
    | { name: string; domain: string | null; job_board: string | null; social_json: string }
    | undefined;
  if (!company) return;

  const people = db
    .prepare("SELECT name, role FROM people WHERE company_id = ?")
    .all(companyId) as { name: string; role: string | null }[];
  const social = (JSON.parse(company.social_json) as string[]).map((url) => url.replace(/^https?:\/\/(www\.)?/, ""));

  const text = [
    company.name,
    company.domain ?? "",
    company.job_board ?? "",
    ...social,
    ...people.map((person) => `${person.name} ${person.role ?? ""}`),
  ].join(" ");

  db.prepare("DELETE FROM account_index WHERE company_id = ?").run(companyId);
  db.prepare("INSERT INTO account_index (company_id, text) VALUES (?, ?)").run(companyId, text);
}

// Turns a typed query into a safe full-text query: each word must match, and a word matches its prefixes.
// "fin cfo" finds "Finance" and "CFO". Punctuation is dropped so it can't break the query syntax.
function toMatchQuery(q: string): string | null {
  const words = q.toLowerCase().match(/[a-z0-9]+/g);
  if (!words || words.length === 0) return null;
  return words.map((word) => `"${word}"*`).join(" AND ");
}

// Company IDs that match the query, best match first.
export function searchAccountIds(q: string): string[] {
  const match = toMatchQuery(q);
  if (!match) return [];
  const rows = getDb()
    .prepare("SELECT company_id FROM account_index WHERE account_index MATCH ? ORDER BY rank LIMIT 200")
    .all(match) as { company_id: string }[];
  return rows.map((row) => row.company_id);
}

// Indexes every company. Run after the schema changes, so existing data is searchable.
export function reindexAll(): void {
  const db = getDb();
  const ids = db.prepare("SELECT id FROM companies").all() as { id: string }[];
  db.exec("DELETE FROM account_index");
  for (const { id } of ids) indexCompany(id);
}
