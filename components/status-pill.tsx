import type { RunOutcome, RunStatus } from "@/lib/runs";

type Tone = "verified" | "caution" | "neutral" | "danger" | "active";

const TONE: Record<Tone, string> = {
  verified: "bg-verified-soft text-verified",
  caution: "bg-caution-soft text-caution",
  neutral: "bg-secondary text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
  active: "bg-primary/10 text-primary",
};

// A run still marked running after this long was cut off (server restart, closed tab) and will not finish.
const STALE_MS = 10 * 60 * 1000;

// The same words everywhere a run's result appears: run page, runs table, recent list.
export function runLabel(
  status: RunStatus,
  outcome: RunOutcome | null | undefined,
  createdAt?: string,
  interrupted = false,
): { text: string; tone: Tone } {
  const stale = interrupted || (createdAt !== undefined && Date.now() - Date.parse(createdAt) > STALE_MS);
  if (status !== "finished" && stale) return { text: "Interrupted", tone: "danger" };
  if (status === "new") return { text: "Not started", tone: "neutral" };
  if (status === "running") return { text: "Running", tone: "active" };
  switch (outcome) {
    case "draft":
      return { text: "Ready to review", tone: "verified" };
    case "flagged":
      return { text: "Check before sending", tone: "caution" };
    case "abstained":
      return { text: "No good reason to write", tone: "neutral" };
    default:
      return { text: "Stopped", tone: "danger" };
  }
}

export function StatusPill({
  status,
  outcome,
  createdAt,
  interrupted = false,
}: {
  status: RunStatus;
  outcome?: RunOutcome | null;
  createdAt?: string; // pass for saved runs so an abandoned run reads "Interrupted", not "Running"
  interrupted?: boolean; // the caller already knows the run will not finish
}) {
  const { text, tone } = runLabel(status, outcome, createdAt, interrupted);
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ${TONE[tone]}`}>
      {text === "Running" && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current" />}
      {text}
    </span>
  );
}
