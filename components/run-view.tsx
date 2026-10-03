"use client";

import { CheckCircle2, Circle, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StageEvent, type Claim, type Draft, type Hook, type Outcome, type Signal, type StageId } from "@/lib/types";

// The stages the rep sees, in order. "run" is the end-of-run signal and is not shown.
const STEPS: { id: StageId; label: string }[] = [
  { id: "identity", label: "Find the company's website" },
  { id: "news", label: "Check recent news" },
  { id: "jobs", label: "Check open roles" },
  { id: "company_site", label: "Read the company website" },
  { id: "hooks", label: "Rank possible hooks" },
  { id: "draft", label: "Write the draft" },
  { id: "verify", label: "Check claims against sources" },
];

type StepState = {
  status: "pending" | "running" | "done" | "failed";
  message?: string;
  durationMs?: number;
};

function deriveSteps(events: StageEvent[]): Record<string, StepState> {
  const steps: Record<string, StepState> = {};
  for (const event of events) {
    if (event.stage === "run") continue;
    const status = event.status === "started" ? "running" : event.status;
    steps[event.stage] = { status, message: event.message, durationMs: event.durationMs };
  }
  return steps;
}

// Collects everything the stages found, in the order they arrived.
function collect(events: StageEvent[]) {
  const signals: Signal[] = [];
  let hooks: Hook[] = [];
  let draft: Draft | undefined;
  let domain: string | undefined;
  for (const event of events) {
    if (event.payload?.signals) signals.push(...event.payload.signals);
    if (event.payload?.hooks) hooks = event.payload.hooks;
    if (event.payload?.draft) draft = event.payload.draft;
    if (event.payload?.domain) domain = event.payload.domain;
  }
  return { signals, hooks, draft, domain };
}

// streamUrl is set for a run that hasn't started; saved runs pass null and show their saved events.
export function RunView({ streamUrl, initialEvents }: { streamUrl: string | null; initialEvents: StageEvent[] }) {
  const [events, setEvents] = useState<StageEvent[]>(initialEvents);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    if (!streamUrl) return;
    const source = new EventSource(streamUrl);
    source.onmessage = (message) => {
      const event = StageEvent.parse(JSON.parse(message.data));
      setEvents((previous) => [...previous, event]);
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
  const { signals, hooks, draft, domain } = collect(events);
  const outcome = runEnd?.payload?.outcome;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <ol className="grid content-start gap-1">
        {STEPS.map((step) => {
          const state = steps[step.id] ?? { status: "pending" as const };
          return (
            <li key={step.id} className="rounded-lg border bg-white p-3">
              <div className="flex items-center gap-3">
                <StepIcon status={state.status} />
                <span className="font-medium text-zinc-900">{step.label}</span>
                {state.durationMs !== undefined && (
                  <span className="ml-auto text-xs text-zinc-500">{(state.durationMs / 1000).toFixed(1)} s</span>
                )}
              </div>
              {state.message && state.status !== "pending" && (
                <p className={`mt-1 pl-7 text-sm ${state.status === "failed" ? "text-amber-700" : "text-zinc-600"}`}>
                  {state.message}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid content-start gap-5">
        {connectionLost && (
          <p className="text-sm text-amber-700">Lost the connection to this run. Refresh the page to see what was saved.</p>
        )}
        {runEnd && <OutcomeBanner outcome={outcome} message={runEnd.message} />}

        {domain && signals.length > 0 && <SignalList signals={signals} />}
        {hooks.length > 0 && <HookList hooks={hooks} />}
        {outcome === "abstained" && <AbstainPanel />}
        {draft && <DraftPanel draft={draft} />}

        {!runEnd && signals.length === 0 && (
          <div className="rounded-lg border bg-white p-6 text-zinc-500">Results will appear here as each step finishes.</div>
        )}
      </div>
    </div>
  );
}

function OutcomeBanner({ outcome, message }: { outcome?: Outcome; message: string }) {
  const label: Record<Outcome, string> = {
    draft: "Ready for review",
    flagged: "Ready, with points to check",
    abstained: "Abstained",
    stopped: "Stopped",
  };
  const variant = outcome === "draft" ? "default" : outcome === "stopped" ? "destructive" : "secondary";
  return (
    <div className="grid gap-2">
      <Badge variant={variant} className="w-fit">
        {outcome ? label[outcome] : "Finished"}
      </Badge>
      <p className="text-zinc-700">{message}</p>
    </div>
  );
}

function SignalList({ signals }: { signals: Signal[] }) {
  return (
    <section className="grid gap-3 rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-950">What we found</h2>
      <ul className="grid gap-2">
        {signals.map((signal) => (
          <li key={signal.id} className="grid gap-1 rounded-md bg-zinc-50 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{signal.id}</Badge>
              <Badge variant="secondary">{signal.type.replace("_", " ")}</Badge>
              <span className="text-xs text-zinc-500">
                {signal.publishedAt ? new Date(signal.publishedAt).toLocaleDateString() : "undated"}
              </span>
            </div>
            <p className="text-zinc-900">{signal.claim}</p>
            <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline underline-offset-2">
              {signal.sourceName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HookList({ hooks }: { hooks: Hook[] }) {
  const winner = hooks.find((hook) => !hook.blockedReason);
  const runnerUp = hooks.filter((hook) => !hook.blockedReason)[1];
  return (
    <section className="grid gap-3 rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-950">Possible hooks</h2>
      {winner && runnerUp && (
        <p className="text-sm text-zinc-600">
          The top hook scored {winner.scores.total} against {runnerUp.scores.total} for the next one.
        </p>
      )}
      <ul className="grid gap-3">
        {hooks.map((hook) => (
          <li
            key={hook.id}
            className={`grid gap-2 rounded-md border p-3 ${hook.blockedReason ? "opacity-50" : ""} ${hook === winner ? "border-zinc-900" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900">{hook.text}</span>
              {hook === winner && <Badge>Top hook</Badge>}
            </div>
            {hook.blockedReason ? (
              <p className="text-sm text-amber-700">Blocked: {hook.blockedReason}</p>
            ) : (
              <>
                <ScoreBar total={hook.scores.total} />
                <p className="text-xs text-zinc-500">
                  Relevance {hook.scores.relevance}/35 · Recency {hook.scores.recency}/20 · Specificity {hook.scores.specificity}/15 ·
                  Seniority {hook.scores.seniority}/10 · Verifiability {hook.scores.verifiability}/10 · Source {hook.scores.authorship}/10
                </p>
                <p className="text-sm text-zinc-600">
                  Pain: {hook.pain}. Why now: {hook.whyNow}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScoreBar({ total }: { total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full rounded-full bg-zinc-900" style={{ width: `${total}%` }} />
      </div>
      <span className="w-14 text-right text-sm font-medium text-zinc-800">{total} / 100</span>
    </div>
  );
}

function AbstainPanel() {
  return (
    <section className="grid gap-3 rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-950">No personalised draft</h2>
      <p className="text-zinc-700">
        The public signals don&apos;t give a specific, recent reason to write. A made-up hook would be worse than none, so the
        app stopped here. Choose one:
      </p>
      <ul className="grid gap-2 text-sm text-zinc-700">
        <li>1. Write a value-led generic email about what Zamp does for finance teams.</li>
        <li>2. Deprioritise this prospect and revisit when there is news or a job posting.</li>
      </ul>
    </section>
  );
}

function DraftPanel({ draft }: { draft: Draft }) {
  return (
    <section className="grid gap-5 rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-950">Draft</h2>
      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Subject</span>
        <p className="font-medium text-zinc-900">{draft.subject}</p>
      </div>
      <div className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Body</span>
        <p className="whitespace-pre-line leading-7 text-zinc-800">{draft.body}</p>
      </div>
      <div className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Claims and sources</span>
        <ul className="grid gap-2">
          {draft.claims.map((claim) => (
            <ClaimRow key={claim.text} claim={claim} />
          ))}
        </ul>
      </div>
      {draft.lintIssues.length > 0 && (
        <div className="grid gap-1 text-sm text-amber-700">
          <span className="text-xs font-medium uppercase tracking-wide">Style checks</span>
          {draft.lintIssues.map((issue) => (
            <p key={issue}>· {issue}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <li className={`rounded-md p-3 text-sm ${claim.supported ? "bg-zinc-50" : "bg-amber-50 ring-1 ring-amber-300"}`}>
      <p className="text-zinc-900">
        {claim.text}{" "}
        {!claim.supported && <span className="font-medium text-amber-700">(not supported by its source)</span>}
      </p>
      <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-zinc-600 underline underline-offset-2">
        {claim.sourceName}
        {claim.publishedAt ? `, ${new Date(claim.publishedAt).toLocaleDateString()}` : ", undated"}
      </a>
    </li>
  );
}

function StepIcon({ status }: { status: StepState["status"] }) {
  if (status === "running") return <Loader2 className="size-5 animate-spin text-zinc-500" aria-label="Running" />;
  if (status === "done") return <CheckCircle2 className="size-5 text-emerald-600" aria-label="Done" />;
  if (status === "failed") return <TriangleAlert className="size-5 text-amber-600" aria-label="Failed" />;
  return <Circle className="size-5 text-zinc-300" aria-label="Waiting" />;
}
