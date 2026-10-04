"use client";

import { CheckCircle2, ChevronDown, Circle, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LiveFeed, latestLines } from "@/components/run/live-feed";
import { StepGraph } from "@/components/run/step-graph";
import { STEPS, deriveSteps, type StepState, type StepStatus } from "@/components/run/steps";
import { WritingPreview } from "@/components/run/writing-preview";
import { DraftEditor } from "@/components/send-panel";
import { StatusPill } from "@/components/status-pill";
import { TemplateChooser } from "@/components/template-chooser";
import { formatDate, hostOf } from "@/lib/format";
import type { Sender } from "@/lib/sender";
import { StageEvent, type CrawlPage, type Draft, type Hook, type ProspectInput, type Signal, type Usage } from "@/lib/types";

// Everything the stages found, in the order it arrived. Signals are de-duplicated by source URL.
function collect(events: StageEvent[]) {
  const signals = new Map<string, Signal>();
  const pages: CrawlPage[] = [];
  let hooks: Hook[] = [];
  let draft: Draft | null = null;
  for (const event of events) {
    for (const signal of event.payload?.signals ?? []) signals.set(`${signal.id}|${signal.sourceUrl}`, signal);
    if (event.payload?.crawl) pages.push(event.payload.crawl);
    if (event.payload?.hooks) hooks = event.payload.hooks;
    if (event.payload?.draft) draft = event.payload.draft;
  }
  return { signals: [...signals.values()], pages, hooks, draft };
}

export function RunView({
  runId,
  prospect,
  sender,
  approved,
  streamUrl,
  initialEvents,
  replay = false,
}: {
  runId: string;
  prospect: ProspectInput;
  sender: Sender;
  approved: string[];
  streamUrl: string | null; // set for a run that hasn't started; saved runs pass null and show their events
  initialEvents: StageEvent[];
  replay?: boolean;
}) {
  const [events, setEvents] = useState<StageEvent[]>(initialEvents);
  const [connectionLost, setConnectionLost] = useState(false);
  // A live run keeps the writing preview on screen until the final draft has finished typing.
  const [revealed, setRevealed] = useState(streamUrl === null);
  const reveal = useCallback(() => setRevealed(true), []);

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
  const { signals, pages, hooks, draft } = collect(events);
  const outcome = runEnd?.payload?.outcome;
  const finished = runEnd !== null;
  const wrote = outcome === "draft" || outcome === "flagged";
  // Without a draft to finish typing there's nothing to wait for.
  const showResult = finished && (revealed || !wrote || !draft);

  return (
    <main className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="font-mono text-[11px] text-foreground/55">{replay ? "Recorded run, replayed step by step" : "Run"}</p>
          <h1 className="text-[32px] leading-tight font-normal tracking-tight sm:text-[38px]">{prospect.name}</h1>
          <p className="flex flex-wrap items-center gap-x-2 text-[14px] text-muted-foreground">
            <span>{[prospect.role, prospect.company].filter(Boolean).join(", ")}</span>
            {prospect.domain && <span className="font-mono text-[12px]">{prospect.domain}</span>}
            {prospect.email && <span className="font-mono text-[12px]">{prospect.email}</span>}
          </p>
        </div>
        {!finished && !streamUrl ? (
          <StatusPill status="running" interrupted />
        ) : (
          <StatusPill status={finished ? "finished" : "running"} outcome={outcome ?? null} />
        )}
      </header>

      {connectionLost && !finished && (
        <p role="alert" className="rounded-xl bg-caution-soft px-4 py-3 text-[13px] text-caution">
          Lost the connection to this run. Refresh the page to see what was saved.
        </p>
      )}
      {!finished && !streamUrl && !connectionLost && (
        <p className="rounded-xl bg-caution-soft px-4 py-3 text-[13px] text-caution">
          This run was interrupted before it finished. Below is what was saved. Start a new run to try again.
        </p>
      )}

      <StepGraph steps={steps} finished={finished} latest={finished ? [] : latestLines(events)} />

      {!showResult ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] [&>*]:min-w-0">
          <LiveFeed events={events} />
          <div className="grid gap-3 lg:sticky lg:top-24">
            <WritingPreview prospect={prospect} pages={pages} signals={signals} hooks={hooks} draft={draft} finished={finished} onSettled={reveal} />
            <p className="px-1 text-[12px] text-muted-foreground">
              A live preview. The checked email, with every fact linked to its source, replaces it when the run finishes.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
          <div className="grid gap-4">
            {wrote && draft ? (
              <DraftEditor runId={runId} prospect={prospect} draft={draft} sender={sender} approved={approved} />
            ) : outcome === "abstained" ? (
              <>
                <AbstainPanel hooks={hooks} signalCount={signals.length} />
                <TemplateChooser runId={runId} prospect={prospect} sender={sender} approved={approved} />
              </>
            ) : (
              <StoppedPanel message={runEnd?.message ?? ""} steps={steps} />
            )}
            <Disclosure label={`Research log: ${pages.length} pages read, ${signals.length} sources`} panel>
              <LiveFeed events={events} compact />
            </Disclosure>
          </div>
          <aside className="grid gap-4" aria-label="How this draft was made">
            {hooks.length > 0 && <WhyThisHook hooks={hooks} outcome={outcome} reason={draft?.reason} />}
            {runEnd?.payload?.usage && <UsagePanel usage={runEnd.payload.usage} />}
            <SourcesPanel signals={signals} />
            {pages.length > 0 && <PagesPanel pages={pages} />}
            <StepsSummary steps={steps} stopped={!wrote && outcome !== "abstained"} />
          </aside>
        </div>
      )}
    </main>
  );
}

function PagesPanel({ pages }: { pages: CrawlPage[] }) {
  const unique = pages.filter((page, index) => pages.findIndex((other) => other.url === page.url) === index);
  const browser = unique.filter((page) => page.via === "browser").length;
  return (
    <Panel title={`Website pages read (${unique.length})`}>
      <p className="text-[12px] text-muted-foreground">
        {browser === unique.length ? "All read in a headless browser." : `${browser} in a headless browser, ${unique.length - browser} as plain HTML.`} No model
        tokens used.
      </p>
      <ul className="grid gap-1.5">
        {unique.map((page) => (
          <li key={page.url} className="flex items-center justify-between gap-2 text-[12.5px]">
            <a href={page.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
              {new URL(page.url).pathname === "/" ? hostOf(page.url) : new URL(page.url).pathname}
            </a>
            <span className="shrink-0 font-mono text-[10.5px] text-foreground/50">{(page.ms / 1000).toFixed(1)} s</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// What the run used. Only the model call costs quota; pages, news and job boards are free.
function UsagePanel({ usage }: { usage: Usage }) {
  const tokens = usage.inputTokens + usage.outputTokens + usage.thinkingTokens;
  const pages = usage.pagesRead + usage.pagesFromCache;
  const free = usage.freeRequests + usage.freeRequestsFromCache;
  const rows: [string, string, string][] = [
    [
      "Gemini calls",
      String(usage.modelCalls),
      usage.modelCallsSaved ? `${usage.modelCallsSaved} answer reused from an earlier run` : "writing the email",
    ],
    [
      "Tokens",
      tokens.toLocaleString("en-GB"),
      `${usage.inputTokens.toLocaleString("en-GB")} in, ${usage.outputTokens.toLocaleString("en-GB")} out${usage.thinkingTokens ? `, ${usage.thinkingTokens.toLocaleString("en-GB")} thinking` : ""}`,
    ],
    ["Pages read", String(pages), usage.pagesFromCache ? `${usage.pagesFromCache} from the local copy` : "headless browser, free"],
    ["Free requests", String(free), Object.keys(usage.hosts).length ? Object.keys(usage.hosts).join(", ") : "all from the local copy"],
  ];
  return (
    <Panel title="What this run used">
      <dl className="grid gap-2.5">
        {rows.map(([label, value, note]) => (
          <div key={label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
            <dt className="text-[13px] text-muted-foreground">{label}</dt>
            <dd className="text-right text-[18px] tabular-nums tracking-tight">{value}</dd>
            <dd className="col-span-2 font-mono text-[10.5px] text-foreground/50">{note}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function WhyThisHook({ hooks, outcome, reason }: { hooks: Hook[]; outcome?: string; reason?: string }) {
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
            {used && reason && (
              <div>
                <dt className="text-muted-foreground">Why the writer chose it</dt>
                <dd>{reason}</dd>
              </div>
            )}
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
        <div className={`h-full rounded-full ${muted ? "bg-chart-2" : "bg-electric"}`} style={{ width: `${total}%` }} />
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
        <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-foreground">
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
    <section className="grid gap-4 rounded-2xl border border-line bg-card p-6 sm:p-8">
      <h2 className="text-[24px] font-normal tracking-tight">No email written</h2>
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
    <section className="grid gap-3 rounded-2xl border border-line bg-card p-6 sm:p-8">
      <h2 className="text-[24px] font-normal tracking-tight">The run stopped</h2>
      {failed ? (
        <p className="max-w-prose leading-7 text-muted-foreground">
          It stopped at <span className="font-medium text-foreground">{failed.label.toLowerCase()}</span>
          {steps[failed.id]?.message ? `: ${steps[failed.id]?.message}` : "."}
        </p>
      ) : (
        <p className="max-w-prose leading-7 text-muted-foreground">{message}</p>
      )}
      <p className="text-sm text-muted-foreground">
        {failed?.id === "identity"
          ? "Check the website address on the New run page. Some sites refuse automated readers; a run with the right address continues with news and job boards."
          : "What it found before stopping is on the right. Try again in a minute; if it stops at the same step, check the model key in .env.local."}
      </p>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-line bg-card p-5">
      <h2 className="text-[14px] font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Disclosure({ label, children, panel = false }: { label: string; children: ReactNode; panel?: boolean }) {
  return (
    <details className={`group ${panel ? "rounded-2xl border border-line bg-card p-4" : ""}`}>
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[13px] text-electric hover:underline [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function StepIcon({ status, small = false }: { status: StepStatus; small?: boolean }) {
  const size = small ? "size-4 mt-0.5" : "size-5";
  if (status === "running") return <Loader2 className={`${size} animate-spin text-electric`} aria-label="Running" />;
  if (status === "done") return <CheckCircle2 className={`${size} text-verified`} aria-label="Done" />;
  if (status === "failed") return <TriangleAlert className={`${size} text-caution`} aria-label="Could not finish" />;
  return <Circle className={`${size} text-border`} aria-label="Waiting" />;
}
