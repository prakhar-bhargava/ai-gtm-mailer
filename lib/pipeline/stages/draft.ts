import { generateJson } from "@/lib/llm";
import { draftSystemPrompt, draftUserPrompt } from "@/lib/pipeline/draft-prompt";
import { SAMPLE_SIGNALS } from "@/lib/pipeline/sample-signals";
import type { StageSpec } from "@/lib/pipeline/stage";
import { draftAnswerSchema, type Draft } from "@/lib/types";

// Calls the LLM with the seller brief and the signals. The signals are still sample data,
// so the draft is real model output built on fake inputs.
export const draft: StageSpec = {
  id: "draft",
  required: true,
  startMessage: "Writing the draft email",
  timeoutMs: 40000, // above llm.timeoutMs so the model call times out first and gives a readable message
  run: async (prospect) => {
    const signalIds = SAMPLE_SIGNALS.map((signal) => signal.id) as [string, ...string[]];
    const answer = await generateJson({
      system: draftSystemPrompt(),
      prompt: draftUserPrompt(prospect, SAMPLE_SIGNALS),
      schema: draftAnswerSchema(signalIds),
    });

    const claims = answer.claims.map((claim) => {
      const signal = SAMPLE_SIGNALS.find((item) => item.id === claim.signalId);
      if (!signal) throw new Error("the draft cited a signal that does not exist");
      return {
        text: claim.text,
        sourceName: signal.sourceName,
        sourceUrl: signal.sourceUrl,
        publishedAt: signal.publishedAt,
      };
    });

    const finished: Draft = {
      subject: answer.subject,
      body: answer.body.replace(/\[s:[^\]]+\]/g, "").trim(),
      claims,
    };
    return {
      summary: `Wrote a draft citing ${claims.length} signal${claims.length === 1 ? "" : "s"} (signals are sample data)`,
      draft: finished,
    };
  },
};
