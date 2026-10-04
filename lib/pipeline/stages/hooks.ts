import { scoreHooks } from "@/lib/pipeline/score-hooks";
import { candidateHooks, categoryLabel } from "@/lib/pipeline/hook-candidates";
import type { StageSpec } from "@/lib/pipeline/stage";

// Ranks the possible reasons to get in touch. No model call: angles come from the signals and the
// lexicon in config/hook-lexicon.json, and the rubric scores them (docs/06).
export const hooks: StageSpec = {
  id: "hooks",
  required: true,
  startMessage: "Ranking the possible reasons to get in touch",
  run: async (ctx) => {
    if (ctx.signals.length === 0) {
      return { summary: "No public signals to build a hook from", hooks: [] };
    }
    const ranked = scoreHooks(candidateHooks(ctx.signals, ctx.prospect.company), ctx.signals, ctx.prospect.role);
    const best = ranked.find((hook) => !hook.blockedReason);
    const summary = best
      ? `Ranked ${ranked.length} possible angle${ranked.length === 1 ? "" : "s"}. The best (${categoryLabel(best.category ?? "").toLowerCase()}) scores ${best.scores.total} of 100`
      : `Ranked ${ranked.length} possible angles, and none passed the sensitivity check`;
    return { summary, hooks: ranked };
  },
};
