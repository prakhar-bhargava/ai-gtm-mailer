import pipeline from "@/config/pipeline.json";
import type { ProspectInput, StageEvent, StageId } from "@/lib/types";

export type Emit = (event: StageEvent) => void;

export type StageSpec = {
  id: StageId;
  // Required stages stop the run when they fail. Optional stages fail soft.
  required: boolean;
  startMessage: string;
  run: (prospect: ProspectInput) => Promise<string>; // returns a rep-facing summary
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`no answer after ${ms / 1000} seconds`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function event(
  stage: StageId,
  status: StageEvent["status"],
  message: string,
  durationMs?: number,
): StageEvent {
  return { stage, status, message, durationMs, at: new Date().toISOString() };
}

// Runs one stage with a timeout and emits started, then done or failed.
// Returns true when the stage finished, false when it failed.
export async function runStage(
  spec: StageSpec,
  prospect: ProspectInput,
  emit: Emit,
): Promise<boolean> {
  const started = Date.now();
  emit(event(spec.id, "started", spec.startMessage));
  try {
    const summary = await withTimeout(spec.run(prospect), pipeline.stageTimeoutMs);
    emit(event(spec.id, "done", summary, Date.now() - started));
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    const tail = spec.required ? "Stopping the run." : "Carrying on without it.";
    emit(event(spec.id, "failed", `Couldn't finish this step: ${reason}. ${tail}`, Date.now() - started));
    return false;
  }
}
