"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { STEPS, type StepState } from "@/components/run/steps";

// The pipeline as a row of nodes. Done steps are black with a tick, the running step pulses blue,
// a step that couldn't finish turns amber. The running step's latest note sits underneath.
export function StepGraph({
  steps,
  finished,
  latest = [],
}: {
  steps: Record<string, StepState>;
  finished: boolean;
  latest?: { key: string; at: string; text: string }[];
}) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (finished) return;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [finished]);

  const done = STEPS.filter((step) => ["done", "failed"].includes(steps[step.id]?.status ?? "")).length;
  const running = STEPS.filter((step) => steps[step.id]?.status === "running");
  const total = STEPS.reduce((sum, step) => sum + (steps[step.id]?.durationMs ?? 0), 0);

  return (
    <section aria-label="Progress" className="grid gap-3 rounded-2xl border border-line bg-card px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-medium">{finished ? "Research complete" : "Researching"}</h2>
        <span className="font-mono text-[11px] text-foreground/60 tabular-nums">
          {done} of {STEPS.length} steps{finished ? `, ${(total / 1000).toFixed(1)} s of work` : ""}
        </span>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
      <ol className="relative grid min-w-[560px] grid-cols-8 gap-1" aria-live="polite">
        {/* The line behind the nodes, filled up to the last finished step. */}
        <span aria-hidden className="absolute top-[13px] right-[6.25%] left-[6.25%] h-px bg-line" />
        <span
          aria-hidden
          className="absolute top-[13px] left-[6.25%] h-px bg-foreground transition-[width] duration-700"
          style={{ width: `${(Math.max(0, done - 1) / (STEPS.length - 1)) * 87.5}%` }}
        />
        {STEPS.map((step, index) => {
          const state = steps[step.id] ?? { status: "pending" as const };
          return (
            <li key={step.id} className="relative grid min-w-[64px] justify-items-center gap-2 text-center">
              <span
                className={`grid size-[26px] place-items-center rounded-full border font-mono text-[10.5px] transition-colors ${
                  state.status === "done"
                    ? "border-foreground bg-foreground text-background"
                    : state.status === "running"
                      ? "node-pulse border-electric bg-electric text-white"
                      : state.status === "failed"
                        ? "border-caution bg-caution-soft text-caution"
                        : "border-line bg-page text-foreground/40"
                }`}
              >
                {state.status === "done" ? (
                  <Check className="size-3.5" aria-label="Done" />
                ) : state.status === "failed" ? (
                  <TriangleAlert className="size-3.5" aria-label="Could not finish" />
                ) : (
                  <span aria-label={state.status === "running" ? "Running" : "Waiting"}>{index + 1}</span>
                )}
              </span>
              <span className={`text-[11px] leading-tight ${state.status === "pending" ? "text-foreground/45" : "text-foreground"}`}>{step.short}</span>
              <span className="font-mono text-[10px] text-foreground/45 tabular-nums">
                {state.status === "running" && state.startedAt && now > 0
                  ? `${Math.max(0, Math.round((now - Date.parse(state.startedAt)) / 1000))} s`
                  : state.durationMs !== undefined
                    ? `${(state.durationMs / 1000).toFixed(1)} s`
                    : " "}
              </span>
            </li>
          );
        })}
      </ol>
      </div>

      {!finished && (running.length > 0 || latest.length > 0) && (
        <div className="grid gap-1.5 border-t border-line pt-3" aria-live="polite">
          {running.map((step) => (
            <p key={step.id} className="flex gap-2 font-mono text-[12px] text-foreground/75">
              <span className="shrink-0 text-electric">{step.short}</span>
              <span className="truncate">{steps[step.id]?.latest}</span>
            </p>
          ))}
          {latest.length > 0 && (
            <ol className="grid gap-1">
              {latest.map((line, index) => (
                <li key={line.key} className={`feed-in flex gap-2 text-[13px] ${index === 0 ? "text-foreground" : "text-foreground/55"}`}>
                  <span className="shrink-0 font-mono text-[11px] text-foreground/45 tabular-nums">
                    {index === 0 ? "Latest" : new Date(line.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="truncate">{line.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
