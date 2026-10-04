import { getDb } from "@/lib/db";

// Numbers for the dashboard, computed from the saved runs and their events.
export type Analytics = {
  total: number;
  finished: number;
  readyRate: number; // share of finished runs that produced a draft (draft or flagged)
  abstainRate: number; // share of finished runs that abstained
  stoppedRate: number; // share of finished runs that stopped
  medianSeconds: number | null;
  perDay: { day: string; count: number }[]; // last 14 days
  outcomes: { label: string; count: number }[];
  failedSteps: { stage: string; count: number }[];
  topCompanies: { company: string; count: number }[];
  sourceFailures: { stage: string; failed: number; total: number }[];
};

export function getAnalytics(): Analytics {
  const db = getDb();

  const totals = db
    .prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS finished FROM runs",
    )
    .get() as { total: number; finished: number | null };
  const finished = totals.finished ?? 0;

  const outcomeRows = db
    .prepare("SELECT outcome, COUNT(*) AS n FROM runs WHERE status = 'finished' GROUP BY outcome")
    .all() as { outcome: string | null; n: number }[];
  const outcomeCount = (name: string) => outcomeRows.find((row) => row.outcome === name)?.n ?? 0;
  const ready = outcomeCount("draft") + outcomeCount("flagged");
  const abstained = outcomeCount("abstained");
  const stopped = outcomeCount("stopped");

  const durations = (
    db
      .prepare(
        "SELECT (julianday(finished_at) - julianday(created_at)) * 86400 AS seconds FROM runs WHERE status = 'finished' AND finished_at IS NOT NULL ORDER BY seconds",
      )
      .all() as { seconds: number }[]
  ).map((row) => row.seconds);
  const medianSeconds =
    durations.length === 0
      ? null
      : durations.length % 2
        ? durations[(durations.length - 1) / 2]
        : (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2;

  const perDay = db
    .prepare(
      "SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count FROM runs WHERE created_at >= date('now', '-13 days') GROUP BY day ORDER BY day",
    )
    .all() as { day: string; count: number }[];

  // Build a continuous 14-day series so days with no searches still show.
  const series: { day: string; count: number }[] = [];
  for (let offset = 13; offset >= 0; offset--) {
    const date = new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
    series.push({ day: date, count: perDay.find((row) => row.day === date)?.count ?? 0 });
  }

  const failedSteps = db
    .prepare(
      "SELECT stage, COUNT(*) AS count FROM run_events WHERE status = 'failed' AND stage <> 'run' GROUP BY stage ORDER BY count DESC",
    )
    .all() as { stage: string; count: number }[];

  const sourceFailures = db
    .prepare(
      `SELECT stage,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
              SUM(CASE WHEN status IN ('done', 'failed') THEN 1 ELSE 0 END) AS total
       FROM run_events WHERE stage IN ('news', 'jobs', 'company_site', 'discover', 'identity') GROUP BY stage`,
    )
    .all() as { stage: string; failed: number; total: number }[];

  const topCompanies = db
    .prepare(
      `SELECT json_extract(prospect_json, '$.company') AS company, COUNT(*) AS count
       FROM runs GROUP BY company ORDER BY count DESC LIMIT 5`,
    )
    .all() as { company: string; count: number }[];

  const share = (value: number) => (finished ? value / finished : 0);
  return {
    total: totals.total,
    finished,
    readyRate: share(ready),
    abstainRate: share(abstained),
    stoppedRate: share(stopped),
    medianSeconds,
    perDay: series,
    outcomes: [
      { label: "Ready for review", count: outcomeCount("draft") },
      { label: "Check flagged points", count: outcomeCount("flagged") },
      { label: "Abstained", count: abstained },
      { label: "Stopped", count: stopped },
    ],
    failedSteps,
    topCompanies,
    sourceFailures,
  };
}

// ---------------------------------------------------------------------------------------------
// Chart data for the dashboard. One pass over every saved event; the data set is small and local.

export type ChartData = {
  perDayByOutcome: { day: string; draft: number; flagged: number; abstained: number; stopped: number; open: number }[];
  funnel: { label: string; count: number }[];
  hookScores: { bin: number; count: number }[]; // best usable angle per run, in bins of 10
  signalsByType: { type: string; count: number }[];
  stageMedians: { stage: string; ms: number }[];
  claims: { backed: number; notBacked: number };
  pages: { total: number; browser: number; html: number };
  outboxCount: number;
  // From runs that recorded usage (runs made after the one-model-call change).
  usage: { runs: number; modelCalls: number; tokens: number; freeRequests: number; pages: number };
};

type EventRow = { run_id: string; stage: string; status: string; duration_ms: number | null; payload_json: string | null };

export function getChartData(): ChartData {
  const db = getDb();
  const runs = db.prepare("SELECT id, status, outcome, created_at FROM runs").all() as {
    id: string;
    status: string;
    outcome: string | null;
    created_at: string;
  }[];
  const events = db.prepare("SELECT run_id, stage, status, duration_ms, payload_json FROM run_events ORDER BY id").all() as EventRow[];

  // Runs per day, split by result.
  const perDayByOutcome: ChartData["perDayByOutcome"] = [];
  for (let offset = 13; offset >= 0; offset--) {
    const day = new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
    const row = { day, draft: 0, flagged: 0, abstained: 0, stopped: 0, open: 0 };
    for (const run of runs) {
      if (run.created_at.slice(0, 10) !== day) continue;
      if (run.status !== "finished") row.open++;
      else if (run.outcome === "draft" || run.outcome === "flagged" || run.outcome === "abstained") row[run.outcome]++;
      else row.stopped++;
    }
    perDayByOutcome.push(row);
  }

  // Per-run facts from the events.
  const facts = new Map<string, { site: boolean; signals: number; best: number | null; draft: boolean; claims: { supported: boolean }[] | null }>();
  const fact = (id: string) => {
    let value = facts.get(id);
    if (!value) {
      value = { site: false, signals: 0, best: null, draft: false, claims: null };
      facts.set(id, value);
    }
    return value;
  };
  const signalTypes = new Map<string, number>();
  const durations = new Map<string, number[]>();
  const pages = { total: 0, browser: 0, html: 0 };
  const usage = { runs: 0, modelCalls: 0, tokens: 0, freeRequests: 0, pages: 0 };

  for (const event of events) {
    const runFact = fact(event.run_id);
    if (event.stage === "identity" && event.status === "done") runFact.site = true;
    if (event.status === "done" && event.duration_ms !== null && event.stage !== "run") {
      const list = durations.get(event.stage) ?? [];
      list.push(event.duration_ms);
      durations.set(event.stage, list);
    }
    if (!event.payload_json) continue;
    let payload: {
      signals?: { type: string }[];
      hooks?: { blockedReason: string | null; scores: { total: number } }[];
      draft?: { claims?: { supported?: boolean }[] };
      crawl?: { via: string };
      usage?: { modelCalls: number; inputTokens: number; outputTokens: number; thinkingTokens: number; freeRequests: number; freeRequestsFromCache: number; pagesRead: number; pagesFromCache: number };
    };
    try {
      payload = JSON.parse(event.payload_json);
    } catch {
      continue;
    }
    for (const signal of payload.signals ?? []) {
      runFact.signals++;
      signalTypes.set(signal.type, (signalTypes.get(signal.type) ?? 0) + 1);
    }
    if (payload.hooks?.length) {
      const usable = payload.hooks.filter((hook) => !hook.blockedReason).map((hook) => hook.scores.total);
      runFact.best = usable.length ? Math.max(...usable) : 0;
    }
    if (payload.draft) {
      runFact.draft = true;
      runFact.claims = (payload.draft.claims ?? []).map((claim) => ({ supported: Boolean(claim.supported) }));
    }
    if (payload.usage) {
      const used = payload.usage;
      usage.runs++;
      usage.modelCalls += used.modelCalls;
      usage.tokens += used.inputTokens + used.outputTokens + used.thinkingTokens;
      usage.freeRequests += used.freeRequests + used.freeRequestsFromCache;
      usage.pages += used.pagesRead + used.pagesFromCache;
    }
    if (payload.crawl) {
      pages.total++;
      if (payload.crawl.via === "browser") pages.browser++;
      else pages.html++;
    }
  }

  const all = [...facts.values()];
  const outboxRuns = (db.prepare("SELECT COUNT(DISTINCT run_id) AS n FROM outbox").get() as { n: number }).n;
  const outboxCount = (db.prepare("SELECT COUNT(*) AS n FROM outbox").get() as { n: number }).n;
  const backedRuns = runs.filter((run) => run.outcome === "draft").length;

  const funnel = [
    { label: "Runs started", count: runs.length },
    { label: "Website confirmed", count: all.filter((item) => item.site).length },
    { label: "Sources found", count: all.filter((item) => item.signals > 0).length },
    { label: "Angle scored 50+", count: all.filter((item) => (item.best ?? 0) >= 50).length },
    { label: "Draft written", count: all.filter((item) => item.draft).length },
    { label: "Every claim backed", count: backedRuns },
    { label: "Approved by a rep", count: outboxRuns },
  ];

  const hookScores = Array.from({ length: 10 }, (_, index) => ({ bin: index * 10, count: 0 }));
  for (const item of all) if (item.best !== null) hookScores[Math.min(9, Math.floor(item.best / 10))].count++;

  const claims = { backed: 0, notBacked: 0 };
  for (const item of all) {
    for (const claim of item.claims ?? []) {
      if (claim.supported) claims.backed++;
      else claims.notBacked++;
    }
  }

  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const order = ["identity", "company_site", "discover", "news", "jobs", "hooks", "draft", "verify"];
  const stageMedians = order.filter((stage) => durations.get(stage)?.length).map((stage) => ({ stage, ms: median(durations.get(stage) ?? []) }));

  const typeOrder = ["news", "job", "company_site"];
  const signalsByType = typeOrder.map((type) => ({ type, count: signalTypes.get(type) ?? 0 }));

  return { perDayByOutcome, funnel, hookScores, signalsByType, stageMedians, claims, pages, outboxCount, usage };
}
