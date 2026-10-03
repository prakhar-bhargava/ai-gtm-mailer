import rubric from "@/config/rubric.json";
import { generateJson } from "@/lib/llm";
import { lintDraft } from "@/lib/pipeline/lint";
import { verifySystemPrompt, verifyUserPrompt } from "@/lib/pipeline/prompts";
import type { StageSpec } from "@/lib/pipeline/stage";
import { verifyAnswerSchema, type Outcome } from "@/lib/types";

// Checks each claim against the snippet it cites, then lints the style.
// Any unsupported claim or lint issue makes the draft "flagged", so the rep sees it highlighted.
export const verify: StageSpec = {
  id: "verify",
  required: false,
  startMessage: "Checking each claim against its source",
  timeoutMs: 40000,
  run: async (ctx) => {
    const current = ctx.draft;
    if (!current) throw new Error("there is no draft to check");

    const cited = ctx.signals.filter((signal) => current.claims.some((claim) => claim.signalId === signal.id));
    const answer = await generateJson({
      system: verifySystemPrompt(),
      prompt: verifyUserPrompt(current, cited),
      schema: verifyAnswerSchema(current.claims.length),
    });

    const claims = current.claims.map((claim, index) => ({
      ...claim,
      supported: answer.results.find((result) => result.index === index)?.supported ?? false,
    }));
    const lintIssues = [
      ...lintDraft(current.subject, current.body),
      ...answer.uncitedFacts.map((fact) => `states a fact with no source: "${fact}"`),
    ];
    const unsupported = claims.filter((claim) => !claim.supported).length;

    const hook = ctx.hooks.find((item) => !item.blockedReason);
    const strong = (hook?.scores.total ?? 0) >= rubric.thresholds.personalised;
    const outcome: Outcome = strong && unsupported === 0 && lintIssues.length === 0 ? "draft" : "flagged";

    const problems = [
      unsupported ? `${unsupported} claim${unsupported === 1 ? "" : "s"} not supported by the source` : "",
      lintIssues.length ? `${lintIssues.length} style issue${lintIssues.length === 1 ? "" : "s"}` : "",
      strong ? "" : "the hook scored below the personalised threshold",
    ].filter(Boolean);

    return {
      summary: problems.length ? `Flagged for review: ${problems.join(", ")}` : "All claims supported and the style checks pass",
      draft: { ...current, claims, lintIssues },
      outcome,
    };
  },
};
