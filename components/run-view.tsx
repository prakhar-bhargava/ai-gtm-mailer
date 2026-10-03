"use client";

import { CheckCircle2, Circle, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StageEvent, type Draft, type StageId } from "@/lib/types";

// The stages the rep sees, in order. "run" is the end-of-run signal and is not shown.
const STEPS: { id: StageId; label: string }[] = [
  { id: "identity", label: "Identify the prospect" },
  { id: "news", label: "Check recent news" },
  { id: "jobs", label: "Check open roles" },
  { id: "company_site", label: "Read the company website" },
  { id: "hooks", label: "Rank possible hooks" },
  { id: "draft", label: "Write the draft" },
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

export function RunView({ streamUrl }: { streamUrl: string }) {
  const [events, setEvents] = useState<StageEvent[]>([]);
  const [runEnd, setRunEnd] = useState<StageEvent | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    const source = new EventSource(streamUrl);
    source.onmessage = (message) => {
      const event = StageEvent.parse(JSON.parse(message.data));
      if (event.stage === "run") {
        setRunEnd(event);
        source.close();
      } else {
        setEvents((previous) => [...previous, event]);
      }
    };
    // Close on error so the browser does not reconnect and replay the run.
    source.onerror = () => {
      setConnectionLost(true);
      source.close();
    };
    return () => source.close();
  }, [streamUrl]);

  const steps = deriveSteps(events);
  const draft = [...events].reverse().find((event) => event.draft)?.draft;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <ol className="grid gap-1">
        {STEPS.map((step) => {
          const state = steps[step.id] ?? { status: "pending" as const };
          return (
            <li key={step.id} className="rounded-lg border bg-white p-3">
              <div className="flex items-center gap-3">
                <StepIcon status={state.status} />
                <span className="font-medium text-zinc-900">{step.label}</span>
                {state.durationMs !== undefined && (
                  <span className="ml-auto text-xs text-zinc-500">
                    {(state.durationMs / 1000).toFixed(1)} s
                  </span>
                )}
              </div>
              {state.message && state.status !== "pending" && (
                <p
                  className={`mt-1 pl-7 text-sm ${
                    state.status === "failed" ? "text-amber-700" : "text-zinc-600"
                  }`}
                >
                  {state.message}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid content-start gap-4">
        {connectionLost && (
          <p className="text-sm text-amber-700">
            Lost the connection to this run. Refresh the page to try again.
          </p>
        )}
        {runEnd && (
          <div className="grid gap-2">
            <Badge variant={runEnd.status === "done" ? "default" : "destructive"} className="w-fit">
              {runEnd.status === "done" ? "Ready for review" : "Stopped"}
            </Badge>
            <p className="text-zinc-700">{runEnd.message}</p>
          </div>
        )}
        {draft ? (
          <DraftPanel draft={draft} />
        ) : (
          !runEnd && (
            <div className="rounded-lg border bg-white p-6 text-zinc-500">
              Results will appear here as each step finishes.
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DraftPanel({ draft }: { draft: Draft }) {
  return (
    <section className="grid gap-5 rounded-lg border bg-white p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-zinc-950">Draft</h2>
        <Badge variant="secondary">Sample data</Badge>
      </div>
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
            <li key={claim.text} className="rounded-md bg-zinc-50 p-3 text-sm">
              <p className="text-zinc-900">{claim.text}</p>
              <a
                href={claim.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-zinc-600 underline underline-offset-2"
              >
                {claim.sourceName}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StepIcon({ status }: { status: StepState["status"] }) {
  if (status === "running") return <Loader2 className="size-5 animate-spin text-zinc-500" aria-label="Running" />;
  if (status === "done") return <CheckCircle2 className="size-5 text-emerald-600" aria-label="Done" />;
  if (status === "failed") return <TriangleAlert className="size-5 text-amber-600" aria-label="Failed" />;
  return <Circle className="size-5 text-zinc-300" aria-label="Waiting" />;
}
