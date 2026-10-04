"use client";

import type { ReactNode } from "react";
import { Donut, Funnel, HBars, Legend, ScoreHistogram, Sparkline, StackedBars, type Series } from "@/components/charts";
import type { Analytics, ChartData } from "@/lib/analytics";

// Outcomes use the status colours (always shown with their label); other charts use the categorical
// palette, validated for colour-blind separation: blue, teal, pink, gold.
const OUTCOMES: Series[] = [
  { key: "draft", label: "Ready to review", color: "var(--verified)" },
  { key: "flagged", label: "Check before sending", color: "var(--series-4)" },
  { key: "abstained", label: "No good reason", color: "#a3a3a3" },
  { key: "stopped", label: "Stopped", color: "var(--destructive)" },
  { key: "open", label: "Running or interrupted", color: "var(--lavender)" },
];

const STAGE_LABEL: Record<string, string> = {
  identity: "Confirm website",
  company_site: "Read website",
  discover: "Follow links",
  news: "News",
  jobs: "Open roles",
  hooks: "Pick angle",
  draft: "Write",
  verify: "Check claims",
};

const SIGNAL_LABEL: Record<string, string> = { news: "News headlines", job: "Open roles", company_site: "Company website" };

const dayLabel = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const seconds = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);
const percent = (value: number) => `${Math.round(value * 100)}%`;

function Tile({ label, value, note, children }: { label: string; value: string; note?: string; children?: ReactNode }) {
  return (
    <div className="grid content-between gap-3 rounded-2xl border border-line bg-card p-4">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[28px] leading-none font-light tracking-tight tabular-nums">{value}</span>
        {children}
      </div>
      {note && <span className="font-mono text-[10.5px] text-foreground/50">{note}</span>}
    </div>
  );
}

function ChartCard({ title, note, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`grid content-start gap-4 rounded-2xl border border-line bg-card p-5 ${className}`}>
      <div className="grid gap-0.5">
        <h2 className="text-[14px] font-medium">{title}</h2>
        {note && <p className="text-[12px] text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function DashboardCharts({ analytics, charts }: { analytics: Analytics; charts: ChartData }) {
  const outcomeTotals = OUTCOMES.map((series) => ({
    ...series,
    value: charts.perDayByOutcome.reduce((sum, day) => sum + Number(day[series.key as keyof (typeof charts.perDayByOutcome)[number]] ?? 0), 0),
  }));
  const claimTotal = charts.claims.backed + charts.claims.notBacked;
  const reliability = analytics.sourceFailures.map((item) => ({
    label: STAGE_LABEL[item.stage] ?? item.stage,
    value: item.total ? (item.total - item.failed) / item.total : 0,
    color: item.failed / Math.max(1, item.total) > 0.2 ? "var(--series-4)" : "var(--verified)",
  }));

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Runs" value={String(analytics.total)} note="last 14 days">
          <Sparkline values={analytics.perDay.map((day) => day.count)} />
        </Tile>
        <Tile label="Produced a draft" value={percent(analytics.readyRate)} note="of finished runs" />
        <Tile label="Abstained" value={percent(analytics.abstainRate)} note="no angle above 50" />
        <Tile label="Claims backed" value={claimTotal ? percent(charts.claims.backed / claimTotal) : "No data"} note={`${charts.claims.backed} of ${claimTotal} checked`} />
        <Tile label="Median run" value={analytics.medianSeconds === null ? "No data" : `${Math.round(analytics.medianSeconds)} s`} note="start to finish" />
        <Tile label="Pages crawled" value={String(charts.pages.total)} note={`${charts.pages.browser} in a browser, 0 tokens`} />
        <Tile
          label="Gemini calls per run"
          value={charts.usage.runs ? (charts.usage.modelCalls / charts.usage.runs).toFixed(1) : "No data"}
          note={charts.usage.runs ? `over ${charts.usage.runs} measured runs` : "measured from the next run"}
        />
        <Tile
          label="Tokens per run"
          value={charts.usage.runs ? Math.round(charts.usage.tokens / charts.usage.runs).toLocaleString("en-GB") : "No data"}
          note={charts.usage.runs ? `free requests per run: ${Math.round(charts.usage.freeRequests / charts.usage.runs)}` : "in, out and thinking"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ChartCard title="Runs per day, by result" note="Last 14 days. Hover a day for the breakdown.">
          <Legend series={OUTCOMES} />
          <StackedBars data={charts.perDayByOutcome} xKey="day" series={OUTCOMES} xLabel={dayLabel} />
        </ChartCard>
        <ChartCard title="Results" note="Every run in the last 14 days.">
          <Donut segments={outcomeTotals} centerLabel="runs" />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <ChartCard title="From prospect to approved email" note="How many runs reached each step. Big drops are marked in amber.">
          <Funnel steps={charts.funnel} />
        </ChartCard>
        <ChartCard title="Best angle score per run" note="Below 50 the app abstains; 50 and above can be ready to review if every check passes.">
          <ScoreHistogram
            bins={charts.hookScores}
            thresholds={[
              { at: 50, label: "Draft from 50" },
            ]}
          />
          <Legend
            series={[
              { key: "low", label: "Abstain", color: "#9a9a9a" },
              { key: "high", label: "Writes a draft", color: "var(--verified)" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Where facts come from" note="Signals found, by source.">
          <HBars
            items={charts.signalsByType.map((item, index) => ({
              label: SIGNAL_LABEL[item.type] ?? item.type,
              value: item.count,
              color: ["var(--series-1)", "var(--series-2)", "var(--series-3)"][index],
            }))}
          />
        </ChartCard>
        <ChartCard title="Time per step" note="Median across runs. Cached steps finish in milliseconds.">
          <HBars items={charts.stageMedians.map((item) => ({ label: STAGE_LABEL[item.stage] ?? item.stage, value: item.ms }))} format={seconds} />
        </ChartCard>
        <ChartCard title="Source reliability" note="Share of calls that worked. Amber means more than 1 in 5 failed.">
          {reliability.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No source calls yet.</p>
          ) : (
            <HBars items={reliability} format={percent} />
          )}
          {analytics.failedSteps.length > 0 && (
            <p className="border-t border-line pt-3 text-[12px] text-muted-foreground">
              Steps that failed: {analytics.failedSteps.map((item) => `${STAGE_LABEL[item.stage] ?? item.stage} (${item.count})`).join(", ")}
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
