import { generateJson } from "@/lib/llm";
import { scoreHooks } from "@/lib/pipeline/score-hooks";
import { hookSystemPrompt, hookUserPrompt } from "@/lib/pipeline/prompts";
import type { StageSpec } from "@/lib/pipeline/stage";
import { hookAnswerSchema } from "@/lib/types";

// The model proposes 3 to 5 hooks from the signals; code scores and ranks them.
export const hooks: StageSpec = {
  id: "hooks",
  required: true,
  startMessage: "Ranking the possible reasons to get in touch",
  timeoutMs: 40000, // a model call, so it needs the same allowance as the draft
  run: async (ctx) => {
    if (ctx.signals.length === 0) {
      return { summary: "No public signals to build a hook from", hooks: [] };
    }

    const ids = ctx.signals.map((signal) => signal.id) as [string, ...string[]];
    const answer = await generateJson({
      system: hookSystemPrompt(),
      prompt: hookUserPrompt(ctx.prospect, ctx.signals),
      schema: hookAnswerSchema(ids),
    });

    const ranked = scoreHooks(answer.hooks, ctx.signals, ctx.prospect.role);
    const best = ranked.find((hook) => !hook.blockedReason);
    const summary = best
      ? `Ranked ${ranked.length} possible hooks. The best scores ${best.scores.total} of 100`
      : `Ranked ${ranked.length} possible hooks, and none passed the sensitivity check`;
    return { summary, hooks: ranked };
  },
};
