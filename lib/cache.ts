import pipeline from "@/config/pipeline.json";
import { getDb } from "@/lib/db";

// Source responses are cached in the local database. Entries older than cacheHours are ignored.
export function cacheGet(key: string): string | null {
  const row = getDb().prepare("SELECT body, stored_at FROM cache WHERE key = ?").get(key) as
    | { body: string; stored_at: string }
    | undefined;
  if (!row) return null;
  const ageMs = Date.now() - Date.parse(row.stored_at);
  return ageMs < pipeline.cacheHours * 60 * 60 * 1000 ? row.body : null;
}

export function cacheSet(key: string, body: string) {
  getDb()
    .prepare("INSERT OR REPLACE INTO cache (key, body, stored_at) VALUES (?, ?, ?)")
    .run(key, body, new Date().toISOString());
}
