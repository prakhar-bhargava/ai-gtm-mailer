"use client";

import { Donut, Funnel, HBars, Legend, Sparkline, StackedBars, type Series } from "@/components/charts";
import { Card, SectionLabel, Tile } from "@/components/dash-ui";
import { ActivityHeatmap, AngleFlow, Leaderboard, OutcomeWaffle, ScoreRadar, SubjectWords } from "@/components/fun-charts";
import type { Analytics, ChartData } from "@/lib/analytics";
import type { FunData } from "@/lib/fun-analytics";

// The dashboard on a 12-column grid. Each row's cards share one height, every card uses the same Card
// shell, and nothing is wider than its content needs. Overview first (tiles, runs, results, funnel),
// then patterns (where angles come from, what they're made of, when people research).

// Outcomes use the status colours (always shown with their label); other charts use the categorical
// palette, validated for colour-blind separation: blue, teal, pink, gold.
const OUTCOMES: Series[] = [
  { key: "draft", label: "Ready to review", color: "var(--verified)" },
  { key: "flagged", label: "Check before sending", color: "var(--series-4)" },
  { key: "abstained", label: "No good reason", color: "#a3a3a3" },
  { key: "stopped", label: "Stopped", color: "var(--destructive)" },
  { key: "open", label: "Running or interrupted", color: "var(--lavender)" },
];

const SIGNAL_LABEL: Record<string, string> = {
  news: "News headlines",
  job: "Open roles",
  company_site: "Company website",
  profile: "LinkedIn (pasted)",
};
const SIGNAL_COLOR: Record<string, string> = {
  news: "var(--series-1)",
  job: "var(--series-2)",
  company_site: "var(--series-3)",
  profile: "var(--series-4)",
};

const dayLabel = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const percent = (value: number) => `${Math.round(value * 100)}%`;
const thousands = (value: number) => value.toLocaleString("en-GB");

export function DashboardCharts({ analytics, charts, fun }: { analytics: Analytics; charts: ChartData; fun: FunData }) {
  const outcomeTotals = OUTCOMES.map((series) => ({
    ...series,
    value: charts.perDayByOutcome.reduce((sum, day) => sum + Number(day[series.key as keyof (typeof charts.perDayByOutcome)[number]] ?? 0), 0),
  }));
  const claimTotal = charts.claims.backed + charts.claims.notBacked;
  const saved = fun.tokens.perDraft === null ? null : Math.round((1 - fun.tokens.perDraft / fun.tokens.baseline) * 100);
  const ready = fun.waffle.filter((item) => item.outcome === "draft").length;
  const hour = fun.bestHour === null ? null : `${String(fun.bestHour).padStart(2, "0")}:00`;

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Tile label="Runs" value={String(analytics.total)} note="last 14 days">
          <Sparkline values={analytics.perDay.map((day) => day.count)} />
        </Tile>
        <Tile label="Produced a draft" value={percent(analytics.readyRate)} note="of finished runs" />
        <Tile label="Abstained" value={percent(analytics.abstainRate)} note="no angle reached 50" />
        <Tile label="Claims backed" value={claimTotal ? percent(charts.claims.backed / claimTotal) : "–"} note={`${charts.claims.backed} of ${claimTotal} checked`} />
        <Tile label="Median run" value={analytics.medianSeconds === null ? "–" : `${Math.round(analytics.medianSeconds)} s`} note="start to finish" />
        <Tile
          label="Tokens per draft"
          value={fun.tokens.perDraft === null ? "–" : thousands(fun.tokens.perDraft)}
          note={saved === null ? "one Gemini call" : `${saved}% fewer than v1`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-8" title="Runs per day, by result" note="Last 14 days. Hover a day for the breakdown.">
          <div className="grid gap-3">
            <Legend series={OUTCOMES} />
            <StackedBars data={charts.perDayByOutcome} xKey="day" series={OUTCOMES} xLabel={dayLabel} height={148} />
          </div>
        </Card>
        <Card className="lg:col-span-4" title="Results" note="Every run in the last 14 days." center>
          <Donut segments={outcomeTotals} centerLabel="runs" />
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-5" title="From prospect to approved email" note="Runs reaching each step. Big drops in amber." center>
          <Funnel steps={charts.funnel} />
        </Card>
        <div className="grid gap-3 lg:col-span-7">
          <Card title="How runs end" note="One square per run, newest first. Click to open." aside={`${ready} of ${fun.waffle.length} ready`}>
            <OutcomeWaffle waffle={fun.waffle} />
          </Card>
          <Card title="Where facts come from" note="Facts found across all runs, by source.">
            <HBars
              items={charts.signalsByType.map((item) => ({
                label: SIGNAL_LABEL[item.type] ?? item.type,
                value: item.count,
                color: SIGNAL_COLOR[item.type] ?? "#9a9a9a",
              }))}
            />
          </Card>
        </div>
      </div>

      <SectionLabel>Patterns</SectionLabel>

      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-8" title="From source to result" note="Where the winning angle came from, its kind, and how the run ended. Hover a band.">
          <AngleFlow flow={fun.flow} />
        </Card>
        <Card className="lg:col-span-4" title="Most researched" note="Runs per company, with the best angle score.">
          <Leaderboard rows={fun.leaderboard} />
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-3" title="What a winning angle is made of" note="Each score part as a share of its maximum.">
          <ScoreRadar radar={fun.radar} />
        </Card>
        <Card
          className="lg:col-span-6"
          title="When you research"
          note="Runs by weekday and hour, local time."
          aside={hour ? `${fun.streak}-day streak · busiest ${hour}` : undefined}
        >
          <ActivityHeatmap heat={fun.heat} />
        </Card>
        <Card className="lg:col-span-3" title="Subject line words" note="Bigger means used more.">
          <SubjectWords words={fun.subjectWords} />
        </Card>
      </div>
    </div>
  );
}
