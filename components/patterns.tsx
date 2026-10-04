"use client";

import type { ReactNode } from "react";
import { ActivityHeatmap, AngleFlow, Leaderboard, OutcomeWaffle, ScoreRadar, SubjectWords, TokenGauge } from "@/components/fun-charts";
import type { FunData } from "@/lib/fun-analytics";

function Card({ title, note, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`grid min-w-0 content-start gap-4 rounded-2xl border border-line bg-card p-5 ${className}`}>
      <div className="grid gap-0.5">
        <h3 className="text-[14px] font-medium">{title}</h3>
        {note && <p className="text-[12px] text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-line bg-card p-4">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[28px] leading-none font-light tracking-tight tabular-nums">{value}</span>
      <span className="font-mono text-[10.5px] text-foreground/50">{note}</span>
    </div>
  );
}

// The dashboard's second half: patterns across runs, in charts people tend to enjoy reading.
export function Patterns({ data }: { data: FunData }) {
  const hour = data.bestHour === null ? "No data" : `${String(data.bestHour).padStart(2, "0")}:00`;
  return (
    <section aria-labelledby="patterns-heading" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="patterns-heading" className="text-[20px] tracking-tight">
          Patterns
        </h2>
        <p className="text-[13px] text-muted-foreground">When you research, what wins, and what it costs.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Fact label="Research streak" value={`${data.streak} day${data.streak === 1 ? "" : "s"}`} note="in a row, up to today" />
        <Fact label="Busiest hour" value={hour} note="when most runs start" />
        <Fact
          label="Tokens saved per draft"
          value={data.tokens.perDraft === null ? "No data" : (data.tokens.baseline - data.tokens.perDraft).toLocaleString("en-GB")}
          note="against the four-call pipeline"
        />
        <Fact label="Companies researched" value={String(data.leaderboard.length ? new Set(data.waffle.map((item) => item.company)).size : 0)} note="in the last 100 runs" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Card title="How runs end, one square each" note="The last 100 runs. Click a square to open that run.">
          <OutcomeWaffle waffle={data.waffle} />
        </Card>
        <Card title="Cost of a draft" note="Tokens in, out and thinking, for the run's one Gemini call.">
          <TokenGauge tokens={data.tokens} />
        </Card>
      </div>

      <Card title="From source to result" note="Where each run's winning angle came from, what kind of angle it was, and how the run ended. Hover a band.">
        <AngleFlow flow={data.flow} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="What a winning angle is made of" note="Each part of the score as a share of its maximum, averaged over runs.">
          <ScoreRadar radar={data.radar} />
        </Card>
        <Card title="When you research" note="Runs by weekday and hour, in this computer's time zone.">
          <ActivityHeatmap heat={data.heat} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Words the subject lines lean on" note="Bigger means more subjects use it. Hover a word for the count.">
          <SubjectWords words={data.subjectWords} />
        </Card>
        <Card title="Most researched" note="Runs per company, with the best angle score each one reached.">
          <Leaderboard rows={data.leaderboard} />
        </Card>
      </div>
    </section>
  );
}
