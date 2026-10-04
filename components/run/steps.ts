import type { StageEvent, StageId } from "@/lib/types";

// The stages the rep sees, in the order the pipeline runs them. News and jobs run side by side.
export const STEPS: { id: StageId; label: string; short: string }[] = [
  { id: "identity", label: "Find the company's website", short: "Website" },
  { id: "company_site", label: "Read the company website", short: "Read site" },
  { id: "discover", label: "Follow links on the website", short: "Follow links" },
  { id: "news", label: "Check recent news", short: "News" },
  { id: "jobs", label: "Check open roles", short: "Open roles" },
  { id: "hooks", label: "Pick the best reason to write", short: "Pick angle" },
  { id: "draft", label: "Write the email", short: "Write" },
  { id: "verify", label: "Check every claim against its source", short: "Check claims" },
];

export const STEP_LABEL: Record<string, string> = Object.fromEntries(STEPS.map((step) => [step.id, step.label]));

export type StepStatus = "pending" | "running" | "done" | "failed";
export type StepState = { status: StepStatus; message?: string; durationMs?: number; startedAt?: string; latest?: string };

export function deriveSteps(events: StageEvent[]): Record<string, StepState> {
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
