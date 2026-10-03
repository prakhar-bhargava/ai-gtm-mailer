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
       FROM run_events WHERE stage IN ('news', 'jobs', 'company_site') GROUP BY stage`,
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
