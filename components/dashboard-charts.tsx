"use client";

import type { ReactNode } from "react";
import { Donut, Funnel, HBars, Legend, Sparkline, StackedBars, type Series } from "@/components/charts";
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

const SIGNAL_LABEL: Record<string, string> = { news: "News headlines", job: "Open roles", company_site: "Company website" };

const dayLabel = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
        <ChartCard title="Where facts come from" note="Facts found in each search, by where they came from.">
          <HBars
            items={charts.signalsByType.map((item, index) => ({
              label: SIGNAL_LABEL[item.type] ?? item.type,
              value: item.count,
              color: ["var(--series-1)", "var(--series-2)", "var(--series-3)"][index],
            }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}
