import pipeline from "@/config/pipeline.json";
import type { Draft, Hook, Outcome, ProspectInput, Signal, StageEvent, StageId, StagePayload } from "@/lib/types";

export type Emit = (event: StageEvent) => void;

// A signal before the run assigns it an id (s1, s2, ...).
export type NewSignal = Omit<Signal, "id">;

// Shared state for one run. Stages read what earlier stages found.
export type RunContext = {
  prospect: ProspectInput;
  domain: string | null;
  companyDescription: string | null; // the company's own one-line description, used to tell same-name companies apart
  signals: Signal[];
  hooks: Hook[];
  draft: Draft | null;
};

export type StageOutput = {
  summary: string;
  domain?: string;
  companyDescription?: string;
  newSignals?: NewSignal[];
  hooks?: Hook[];
  draft?: Draft;
  outcome?: Outcome;
};

export type StageSpec = {
  id: StageId;
  // Required stages stop the run when they fail. Optional stages fail soft.
  required: boolean;
  startMessage: string;
  // Per-stage override for slow steps such as LLM calls. Defaults to config/pipeline.json.
  timeoutMs?: number;
  run: (ctx: RunContext) => Promise<StageOutput>;
};

export function newContext(prospect: ProspectInput): RunContext {
  return { prospect, domain: null, companyDescription: null, signals: [], hooks: [], draft: null };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no answer after ${ms / 1000} seconds`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Runs one stage with a timeout and emits started, then done or failed.
// Returns the stage output on success, or null when it failed.
export async function runStage(spec: StageSpec, ctx: RunContext, emit: Emit): Promise<StageOutput | null> {
  const started = Date.now();
  emit({ stage: spec.id, status: "started", message: spec.startMessage, at: new Date().toISOString() });
  try {
    const output = await withTimeout(spec.run(ctx), spec.timeoutMs ?? pipeline.stageTimeoutMs);

    // Give each new signal the next id, then merge everything into the shared context.
    const assigned: Signal[] = (output.newSignals ?? []).map((signal) => ({
      ...signal,
      id: `s${ctx.signals.length + 1}`,
    }));
    ctx.signals.push(...assigned);
    if (output.domain) ctx.domain = output.domain;
    if (output.companyDescription) ctx.companyDescription = output.companyDescription;
    if (output.hooks) ctx.hooks = output.hooks;
    if (output.draft) ctx.draft = output.draft;

    const payload: StagePayload = {
      domain: output.domain,
      signals: assigned.length ? assigned : undefined,
      hooks: output.hooks,
      draft: output.draft,
      outcome: output.outcome,
    };
    emit({
      stage: spec.id,
      status: "done",
      message: output.summary,
      durationMs: Date.now() - started,
      payload,
      at: new Date().toISOString(),
    });
    return output;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    const tail = spec.required ? "Stopping the run." : "Carrying on without it.";
    emit({
      stage: spec.id,
      status: "failed",
      message: `Couldn't finish this step: ${reason}. ${tail}`,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
    });
    return null;
  }
}
