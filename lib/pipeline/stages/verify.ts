import rubric from "@/config/rubric.json";
import { checkMail } from "@/lib/mail-check";
import { checkClaims } from "@/lib/pipeline/claim-check";
import type { StageSpec } from "@/lib/pipeline/stage";
import { approvedMatches } from "@/lib/proof";
import type { Outcome } from "@/lib/types";

// Checks each claim against the source it cites, then the mail guardrails. No model call (claim-check.ts).
// Any unsupported claim or guardrail issue makes the draft "flagged", so the rep sees it highlighted.
export const verify: StageSpec = {
  id: "verify",
  required: false,
  startMessage: "Checking each claim against its source",
  run: async (ctx) => {
    const current = ctx.draft;
    if (!current) throw new Error("there is no draft to check");

    const checked = checkClaims(current, ctx.signals, ctx.prospect.company);
    const style = checkMail(current.subject, current.body, { company: ctx.prospect.company, approved: approvedMatches() });
    const lintIssues = [...style.hard, ...style.soft, ...checked.issues];
    const unsupported = checked.claims.filter((claim) => !claim.supported).length;

    const hook = ctx.hooks.find((item) => item.id === current.hookId) ?? ctx.hooks.find((item) => !item.blockedReason);
    const strong = (hook?.scores.total ?? 0) >= rubric.thresholds.personalised;
    const outcome: Outcome = strong && unsupported === 0 && lintIssues.length === 0 ? "draft" : "flagged";

    const problems = [
      unsupported ? `${unsupported} claim${unsupported === 1 ? "" : "s"} not supported by the source` : "",
      lintIssues.length ? `${lintIssues.length} guardrail issue${lintIssues.length === 1 ? "" : "s"}` : "",
      strong ? "" : `the angle scored below ${rubric.thresholds.personalised}`,
    ].filter(Boolean);

    return {
      summary: problems.length ? `Flagged for review: ${problems.join(", ")}` : "All claims supported and every guardrail passes",
      draft: { ...current, claims: checked.claims, lintIssues },
      outcome,
    };
  },
};
