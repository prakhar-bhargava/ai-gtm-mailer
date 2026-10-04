import { getDb } from "@/lib/db";
import { categorise } from "@/lib/pipeline/hook-candidates";
import type { Signal } from "@/lib/types";

// Data for the dashboard's "Patterns" section: when people research, what makes a strong angle, which
// sources lead to which results, and how much each draft costs. One pass over runs and their events.

export type FunData = {
  heat: number[][]; // [weekday 0 = Monday][hour 0..23] run counts, in the server's local time
  radar: { key: string; label: string; max: number; drafted: number | null; abstained: number | null }[];
  waffle: { runId: string; company: string; outcome: string }[]; // newest first, up to 100
  flow: { source: string; category: string; outcome: string; count: number }[];
  subjectWords: { word: string; count: number }[];
  tokens: { perDraft: number | null; drafts: number; baseline: number };
  leaderboard: { company: string; runs: number; best: number }[];
  streak: number; // days in a row, up to today, with at least one run
  bestHour: number | null;
};

const PARTS = [
  { key: "relevance", label: "Relevance", max: 35 },
  { key: "recency", label: "Recency", max: 20 },
  { key: "specificity", label: "Specificity", max: 15 },
  { key: "seniority", label: "Seniority", max: 10 },
  { key: "verifiability", label: "Verifiable", max: 10 },
  { key: "authorship", label: "Authorship", max: 10 },
] as const;

const STOP = new Set(
  "a an the and or of to in on at for with by from is are was be your you our we it its this that their they an ai employee zamp live four days in".split(" "),
);

// The four-call pipeline used about 3,200 tokens in and 430 out per draft (measured 2026-10-04).
const BASELINE_TOKENS = 3_630;

type Payload = {
  signals?: { id: string; type: string }[];
  hooks?: { blockedReason: string | null; category?: string; text: string; signalIds: string[]; scores: Record<string, number> }[];
  draft?: { subject?: string };
  usage?: { inputTokens: number; outputTokens: number; thinkingTokens: number; modelCalls: number };
};

export function getFunData(): FunData {
  const db = getDb();
  const runs = db.prepare("SELECT id, prospect_json, status, outcome, created_at FROM runs ORDER BY created_at DESC").all() as {
    id: string;
    prospect_json: string;
    status: string;
    outcome: string | null;
    created_at: string;
  }[];
  const events = db.prepare("SELECT run_id, payload_json FROM run_events WHERE payload_json IS NOT NULL ORDER BY id").all() as {
    run_id: string;
    payload_json: string;
  }[];

  type RunFacts = { signalTypes: Map<string, string>; hooks: Payload["hooks"]; subject: string | null; tokens: number | null };
  const facts = new Map<string, RunFacts>();
  for (const event of events) {
    let payload: Payload;
    try {
      payload = JSON.parse(event.payload_json);
    } catch {
      continue;
    }
    const item = facts.get(event.run_id) ?? { signalTypes: new Map(), hooks: undefined, subject: null, tokens: null };
    for (const signal of payload.signals ?? []) item.signalTypes.set(signal.id, signal.type);
    if (payload.hooks?.length) item.hooks = payload.hooks;
    if (payload.draft?.subject) item.subject = payload.draft.subject;
    if (payload.usage && payload.usage.modelCalls > 0) {
      item.tokens = payload.usage.inputTokens + payload.usage.outputTokens + payload.usage.thinkingTokens;
    }
    facts.set(event.run_id, item);
  }

  const outcomeOf = (run: (typeof runs)[number]) => (run.status !== "finished" ? "open" : run.outcome ?? "stopped");

  // When runs happen.
  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const run of runs) {
    const at = new Date(run.created_at);
    heat[(at.getDay() + 6) % 7][at.getHours()]++;
  }
  const byHour = Array.from({ length: 24 }, (_, hour) => heat.reduce((sum, row) => sum + row[hour], 0));
  const bestHour = runs.length ? byHour.indexOf(Math.max(...byHour)) : null;

  // The anatomy of the winning angle: each rubric part as a share of its maximum.
  const sums = { drafted: PARTS.map(() => 0), abstained: PARTS.map(() => 0) };
  const counts = { drafted: 0, abstained: 0 };
  for (const run of runs) {
    const winner = facts.get(run.id)?.hooks?.find((hook) => !hook.blockedReason);
    if (!winner) continue;
    const group = run.outcome === "draft" || run.outcome === "flagged" ? "drafted" : run.outcome === "abstained" ? "abstained" : null;
    if (!group) continue;
    counts[group]++;
    PARTS.forEach((part, index) => (sums[group][index] += (winner.scores[part.key] ?? 0) / part.max));
  }
  const radar = PARTS.map((part, index) => ({
    key: part.key,
    label: part.label,
    max: part.max,
    drafted: counts.drafted ? sums.drafted[index] / counts.drafted : null,
    abstained: counts.abstained ? sums.abstained[index] / counts.abstained : null,
  }));

  // Last 100 runs as squares.
  const waffle = runs.slice(0, 100).map((run) => ({
    runId: run.id,
    company: (JSON.parse(run.prospect_json) as { company: string }).company,
    outcome: outcomeOf(run),
  }));

  // Source of the winning angle -> its type -> the result.
  const flowMap = new Map<string, number>();
  for (const run of runs) {
    if (run.status !== "finished") continue;
    const item = facts.get(run.id);
    const winner = item?.hooks?.find((hook) => !hook.blockedReason);
    if (!item || !winner) continue;
    const source = item.signalTypes.get(winner.signalIds[0]) ?? "unknown";
    // Runs from before angle types were recorded get theirs from the same lexicon, by the angle's text.
    const category =
      winner.category ??
      categorise({ id: "x", type: source as Signal["type"], claim: winner.text, snippet: "", sourceName: "", sourceUrl: "", publishedAt: null, fetchedAt: "" }).id;
    const key = `${source}|${category}|${run.outcome ?? "stopped"}`;
    flowMap.set(key, (flowMap.get(key) ?? 0) + 1);
  }
  const flow = [...flowMap].map(([key, count]) => {
    const [source, category, outcome] = key.split("|");
    return { source, category, outcome, count };
  });

  // Words that show up in subject lines.
  const wordCounts = new Map<string, number>();
  for (const item of facts.values()) {
    if (!item.subject) continue;
    for (const raw of item.subject.toLowerCase().match(/[a-z][a-z0-9&'-]+/g) ?? []) {
      if (STOP.has(raw) || raw.length < 3) continue;
      wordCounts.set(raw, (wordCounts.get(raw) ?? 0) + 1);
    }
  }
  const subjectWords = [...wordCounts]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, 28);

  // Tokens per draft on the one-call pipeline.
  const measured = [...facts.values()].map((item) => item.tokens).filter((value): value is number => value !== null);
  const tokens = {
    perDraft: measured.length ? Math.round(measured.reduce((sum, value) => sum + value, 0) / measured.length) : null,
    drafts: measured.length,
    baseline: BASELINE_TOKENS,
  };

  // Companies researched most, with their best angle.
  const board = new Map<string, { company: string; runs: number; best: number }>();
  for (const run of runs) {
    const company = (JSON.parse(run.prospect_json) as { company: string }).company;
    const key = company.toLowerCase();
    const entry = board.get(key) ?? { company, runs: 0, best: 0 };
    entry.runs++;
    const winner = facts.get(run.id)?.hooks?.find((hook) => !hook.blockedReason);
    if (winner) entry.best = Math.max(entry.best, winner.scores.total ?? 0);
    board.set(key, entry);
  }
  const leaderboard = [...board.values()].sort((a, b) => b.runs - a.runs || b.best - a.best).slice(0, 6);

  // Days in a row with runs, counting back from today.
  const days = new Set(runs.map((run) => new Date(run.created_at).toDateString()));
  let streak = 0;
  for (let offset = 0; offset < 365; offset++) {
    if (!days.has(new Date(Date.now() - offset * 86_400_000).toDateString())) break;
    streak++;
  }

  return { heat, radar, waffle, flow, subjectWords, tokens, leaderboard, streak, bestHour };
}
