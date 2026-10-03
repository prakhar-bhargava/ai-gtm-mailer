import { generateJson } from "@/lib/llm";
import { draftSystemPrompt, draftUserPrompt } from "@/lib/pipeline/prompts";
import type { StageSpec } from "@/lib/pipeline/stage";
import { draftAnswerSchema, type Claim, type Draft } from "@/lib/types";

// Writes the email from the best hook and only the signals that hook cites.
export const draft: StageSpec = {
  id: "draft",
  required: true,
  startMessage: "Writing the draft email",
  run: async (ctx) => {
    const hook = ctx.hooks.find((item) => !item.blockedReason);
    if (!hook) throw new Error("no hook is usable for a draft");

    const cited = ctx.signals.filter((signal) => hook.signalIds.includes(signal.id));
    const ids = cited.map((signal) => signal.id) as [string, ...string[]];
    const answer = await generateJson({
      system: draftSystemPrompt(),
      prompt: draftUserPrompt(ctx.prospect, hook, cited),
      schema: draftAnswerSchema(ids),
    });

    const claims: Claim[] = answer.claims.map((claim) => {
      const signal = cited.find((item) => item.id === claim.signalId);
      if (!signal) throw new Error("the draft cited a signal that does not exist");
      return {
        text: claim.text,
        signalId: signal.id,
        sourceName: signal.sourceName,
        sourceUrl: signal.sourceUrl,
        publishedAt: signal.publishedAt,
        supported: false, // set by the verify step
      };
    });

    const finished: Draft = {
      subject: answer.subject,
      body: answer.body.replace(/\[s:[^\]]+\]/g, "").trim(),
      claims,
      lintIssues: [],
    };
    return { summary: `Wrote a draft with ${claims.length} cited claim${claims.length === 1 ? "" : "s"}`, draft: finished };
  },
};
