"use client";

import { CheckCircle2, ChevronDown, Circle, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DraftEditor } from "@/components/send-panel";
import { TemplateChooser } from "@/components/template-chooser";
import { StatusPill } from "@/components/status-pill";
import { formatDate, hostOf } from "@/lib/format";
import { StageEvent, type Hook, type ProspectInput, type Signal, type StageId } from "@/lib/types";

// The stages the rep sees, in order. "run" is the end-of-run signal and is not shown.
const STEPS: { id: StageId; label: string }[] = [
  { id: "identity", label: "Find the company's website" },
  { id: "news", label: "Check recent news" },
  { id: "jobs", label: "Check open roles" },
  { id: "company_site", label: "Read the company website" },
  { id: "discover", label: "Follow links on the website" },
  { id: "hooks", label: "Pick the best reason to write" },
  { id: "draft", label: "Write the email" },
  { id: "verify", label: "Check every claim against its source" },
];

type StepStatus = "pending" | "running" | "done" | "failed";
type StepState = { status: StepStatus; message?: string; durationMs?: number; startedAt?: string; latest?: string };

function deriveSteps(events: StageEvent[]): Record<string, StepState> {
  const steps: Record<string, StepState> = {};
  for (const event of events) {
    if (event.stage === "run") continue;
    const current: StepState = steps[event.stage] ?? { status: "pending" };
    if (event.status === "progress") steps[event.stage] = { ...current, latest: event.message };
    else if (event.status === "started")
      steps[event.stage] = { ...current, status: "running", startedAt: event.at, latest: event.message };
    else steps[event.stage] = { ...current, status: event.status, message: event.message, durationMs: event.durationMs };
  }
  return steps;
}

// Everything the stages found, in the order it arrived. Signals are de-duplicated by source URL.
function collect(events: StageEvent[]) {
  const signals = new Map<string, Signal>();
  let hooks: Hook[] = [];
  let draft;
  for (const event of events) {
    for (const signal of event.payload?.signals ?? []) signals.set(`${signal.id}|${signal.sourceUrl}`, signal);
    if (event.payload?.hooks) hooks = event.payload.hooks;
    if (event.payload?.draft) draft = event.payload.draft;
  }
  return { signals: [...signals.values()], hooks, draft };
}

export function RunView({
  runId,
  prospect,
  signature,
  streamUrl,
  initialEvents,
}: {
  runId: string;
  prospect: ProspectInput;
  signature: string[];
  streamUrl: string | null; // set for a run that hasn't started; saved runs pass null and show their events
  initialEvents: StageEvent[];
}) {
  const [events, setEvents] = useState<StageEvent[]>(initialEvents);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    if (!streamUrl) return;
    const source = new EventSource(streamUrl);
    source.onmessage = (message) => {
      const event = StageEvent.parse(JSON.parse(message.data));
      // A reconnect or a second tab can resend events; keep each one once.
      setEvents((previous) =>
        previous.some(
          (seen) => seen.stage === event.stage && seen.status === event.status && seen.at === event.at && seen.message === event.message,
        )
          ? previous
          : [...previous, event],
      );
      if (event.stage === "run") source.close();
    };
    // Close on error so the browser does not reconnect and replay the run.
    source.onerror = () => {
      setConnectionLost(true);
      source.close();
    };
    return () => source.close();
  }, [streamUrl]);

  const runEnd = [...events].reverse().find((event) => event.stage === "run") ?? null;
  const steps = deriveSteps(events);
  const { signals, hooks, draft } = collect(events);
  const outcome = runEnd?.payload?.outcome;
  const finished = runEnd !== null;

  const subtitle = [prospect.role, prospect.company].filter(Boolean).join(", ");

  return (
    <main className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{prospect.name}</h1>
          <p className="text-[15px] text-muted-foreground">{subtitle}</p>
        </div>
        {!finished && !streamUrl ? (
          <StatusPill status="running" interrupted />
        ) : (
          <StatusPill status={finished ? "finished" : "running"} outcome={outcome ?? null} />
        )}
      </header>

      {connectionLost && !finished && (
        <p role="alert" className="rounded-lg bg-caution-soft px-4 py-3 text-sm text-caution">
          Lost the connection to this run. Refresh the page to see what was saved.
        </p>
      )}

      {!finished && !streamUrl && !connectionLost && (
        <p className="rounded-lg bg-caution-soft px-4 py-3 text-sm text-caution">
          This run was interrupted before it finished. The steps below are what was saved. Start a new run to try again.
        </p>
      )}

      {!finished ? (
        <InProgress steps={steps} signalCount={signals.length} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4">
            {draft && (outcome === "draft" || outcome === "flagged") ? (
              <DraftEditor runId={runId} prospect={prospect} draft={draft} signature={signature} />
            ) : outcome === "abstained" ? (
              <>
                <AbstainPanel hooks={hooks} signalCount={signals.length} />
                <TemplateChooser runId={runId} prospect={prospect} signature={signature} />
              </>
            ) : (
              <StoppedPanel message={runEnd.message} steps={steps} />
            )}
          </div>
          <aside className="grid gap-4" aria-label="How this draft was made">
            {hooks.length > 0 && <WhyThisHook hooks={hooks} outcome={outcome} />}
            <SourcesPanel signals={signals} />
            <StepsSummary steps={steps} stopped={outcome !== "draft" && outcome !== "flagged" && outcome !== "abstained"} />
          </aside>
        </div>
      )}
    </main>
  );
}

function InProgress({ steps, signalCount }: { steps: Record<string, StepState>; signalCount: number }) {
  // Starts at 0 and is set after mount, so the server and browser render the same first frame.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  const done = STEPS.filter((step) => steps[step.id]?.status === "done" || steps[step.id]?.status === "failed").length;

  return (
    <section className="mx-auto grid w-full max-w-2xl gap-4 rounded-lg border border-border bg-card p-5 sm:p-6" aria-live="polite">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Researching</h2>
          <span className="text-sm text-muted-foreground">
            {done} of {STEPS.length} steps{signalCount > 0 ? `, ${signalCount} sources found` : ""}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(done / STEPS.length) * 100}%` }} />
        </div>
      </div>
      <ol className="grid">
        {STEPS.map((step) => {
          const state = steps[step.id] ?? { status: "pending" as const };
          const note =
            state.status === "running"
              ? state.latest
              : state.status === "done" || state.status === "failed"
                ? state.message
                : undefined;
          return (
            <li key={step.id} className="grid grid-cols-[20px_1fr_auto] gap-x-3 py-2.5">
              <StepIcon status={state.status} />
              <span className={state.status === "pending" ? "text-muted-foreground" : "font-medium"}>{step.label}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {state.status === "running" && state.startedAt && now > 0
                  ? `${Math.max(0, Math.round((now - Date.parse(state.startedAt)) / 1000))} s`
                  : state.durationMs !== undefined
                    ? `${(state.durationMs / 1000).toFixed(1)} s`
                    : ""}
              </span>
              {note && (
                <p className={`col-start-2 col-end-4 mt-0.5 text-sm ${state.status === "failed" ? "text-caution" : "text-muted-foreground"}`}>
                  {note}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function WhyThisHook({ hooks, outcome }: { hooks: Hook[]; outcome?: string }) {
  const used = outcome === "draft" || outcome === "flagged";
  const usable = hooks.filter((hook) => !hook.blockedReason);
  const winner = usable[0];
  const others = hooks.filter((hook) => hook !== winner);
  return (
    <Panel title={used ? "Why this angle" : outcome === "abstained" ? "Best angle found, not strong enough to use" : "Best angle found"}>
      {winner ? (
        <div className="grid gap-3">
          <p className="text-sm leading-6">{winner.text}</p>
          <ScoreBar total={winner.scores.total} />
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Likely pain</dt>
              <dd>{winner.pain}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Why now</dt>
              <dd>{winner.whyNow}</dd>
            </div>
          </dl>
          <Disclosure label="Score breakdown">
            <ScoreBreakdown hook={winner} />
          </Disclosure>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No angle passed the checks.</p>
      )}
      {others.length > 0 && (
        <Disclosure label={`${others.length} other ${others.length === 1 ? "angle" : "angles"} considered`}>
          <ul className="grid gap-3">
            {others.map((hook) => (
              <li key={hook.id} className="grid gap-1.5 text-sm">
                <p className={hook.blockedReason ? "text-muted-foreground" : ""}>{hook.text}</p>
                {hook.blockedReason ? (
                  <p className="text-caution">Not used: {hook.blockedReason}</p>
                ) : (
                  <ScoreBar total={hook.scores.total} muted />
                )}
              </li>
            ))}
          </ul>
        </Disclosure>
      )}
    </Panel>
  );
}

function ScoreBreakdown({ hook }: { hook: Hook }) {
  const rows: [string, number, number][] = [
    ["Fits what we sell", hook.scores.relevance, 35],
    ["How recent", hook.scores.recency, 20],
    ["Specific to them", hook.scores.specificity, 15],
    ["Right for their seniority", hook.scores.seniority, 10],
    ["Source can be checked", hook.scores.verifiability, 10],
    ["Kind of source", hook.scores.authorship, 10],
  ];
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
      {rows.map(([label, value, max]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right tabular-nums">
            {value} / {max}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ScoreBar({ total, muted = false }: { total: number; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3" role="img" aria-label={`Score ${total} out of 100`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${muted ? "bg-chart-2" : "bg-primary"}`} style={{ width: `${total}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-medium tabular-nums">{total}</span>
    </div>
  );
}

function SourcesPanel({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) return null;
  const visible = signals.slice(0, 4);
  const rest = signals.slice(4);
  const item = (signal: Signal) => (
    <li key={`${signal.id}-${signal.sourceUrl}`} className="grid gap-0.5 text-sm">
      <p className="leading-5">{signal.claim}</p>
      <p className="text-muted-foreground">
        <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-2 hover:text-foreground">
          {signal.sourceName || hostOf(signal.sourceUrl)}
        </a>
        , {formatDate(signal.publishedAt)}
      </p>
    </li>
  );
  return (
    <Panel title={`Sources (${signals.length})`}>
      <ul className="grid gap-3">{visible.map(item)}</ul>
      {rest.length > 0 && (
        <Disclosure label={`Show ${rest.length} more`}>
          <ul className="grid gap-3">{rest.map(item)}</ul>
        </Disclosure>
      )}
    </Panel>
  );
}

function StepsSummary({ steps, stopped }: { steps: Record<string, StepState>; stopped: boolean }) {
  const ran = STEPS.filter((step) => steps[step.id]);
  const failed = ran.filter((step) => steps[step.id].status === "failed");
  const total = ran.reduce((sum, step) => sum + (steps[step.id].durationMs ?? 0), 0);
  return (
    <Panel title="Steps">
      <p className="text-sm text-muted-foreground">
        {ran.length} steps in {(total / 1000).toFixed(1)} s.{" "}
        {failed.length === 0
          ? "All finished."
          : stopped
            ? `${failed.length} could not finish.`
            : `${failed.length} could not finish; the run continued without ${failed.length === 1 ? "it" : "them"}.`}
      </p>
      <Disclosure label="Show each step">
        <ol className="grid gap-2">
          {STEPS.map((step) => {
            const state = steps[step.id];
            if (!state) return null;
            return (
              <li key={step.id} className="grid grid-cols-[18px_1fr] gap-x-2 text-sm">
                <StepIcon status={state.status} small />
                <span>{step.label}</span>
                {state.message && (
                  <span className={`col-start-2 ${state.status === "failed" ? "text-caution" : "text-muted-foreground"}`}>{state.message}</span>
                )}
              </li>
            );
          })}
        </ol>
      </Disclosure>
    </Panel>
  );
}

function AbstainPanel({ hooks, signalCount }: { hooks: Hook[]; signalCount: number }) {
  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold">No email written</h2>
      <p className="max-w-prose leading-7 text-muted-foreground">
        {signalCount > 0
          ? `The app found ${signalCount} public ${signalCount === 1 ? "source" : "sources"}, but none gave a specific, recent reason to write${hooks.length ? ` (the best angle scored ${Math.max(...hooks.map((hook) => hook.scores.total))} out of 100)` : ""}.`
          : "The app found no public sources about this company that it could use."}{" "}
        A made-up reason would do more harm than a plain email, so it stopped here.
      </p>
      <div className="grid gap-2 text-sm">
        <p className="font-medium">What you can do</p>
        <ul className="grid gap-1.5 text-muted-foreground">
          <li>Send a short, plain email about what Zamp does for finance teams, without pretending to know them.</li>
          <li>Put this prospect aside and run it again when they post a job or appear in the news.</li>
          <li>Add their website or notes on the New run page if you know something the app could not find.</li>
        </ul>
      </div>
    </section>
  );
}

function StoppedPanel({ message, steps }: { message: string; steps: Record<string, StepState> }) {
  const failed = STEPS.find((step) => steps[step.id]?.status === "failed" && ["identity", "hooks", "draft", "verify"].includes(step.id))
    ?? STEPS.find((step) => steps[step.id]?.status === "failed");
  return (
    <section className="grid gap-3 rounded-lg border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold">The run stopped</h2>
      {failed ? (
        <p className="max-w-prose leading-7 text-muted-foreground">
          It stopped at <span className="font-medium text-foreground">{failed.label.toLowerCase()}</span>
          {steps[failed.id]?.message ? `: ${steps[failed.id]?.message}` : "."}
        </p>
      ) : (
        <p className="max-w-prose leading-7 text-muted-foreground">{message}</p>
      )}
      <p className="text-sm text-muted-foreground">
        What it found before stopping is on the right. Try again in a minute; if it stops at the same step, check the API key
        for that step in .env.local.
      </p>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 rounded-lg border border-border bg-card p-5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-sm text-primary hover:underline [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function StepIcon({ status, small = false }: { status: StepStatus; small?: boolean }) {
  const size = small ? "size-4 mt-0.5" : "size-5";
  if (status === "running") return <Loader2 className={`${size} animate-spin text-primary`} aria-label="Running" />;
  if (status === "done") return <CheckCircle2 className={`${size} text-verified`} aria-label="Done" />;
  if (status === "failed") return <TriangleAlert className={`${size} text-caution`} aria-label="Could not finish" />;
  return <Circle className={`${size} text-border`} aria-label="Waiting" />;
}
