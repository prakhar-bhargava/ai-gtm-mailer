import rubric from "@/config/rubric.json";
import { newContext, runStage, type Emit } from "@/lib/pipeline/stage";
import { identity } from "@/lib/pipeline/stages/identity";
import { news } from "@/lib/pipeline/stages/news";
import { jobs } from "@/lib/pipeline/stages/jobs";
import { companySite } from "@/lib/pipeline/stages/company-site";
import { hooks } from "@/lib/pipeline/stages/hooks";
import { draft } from "@/lib/pipeline/stages/draft";
import { verify } from "@/lib/pipeline/stages/verify";
import type { Outcome, ProspectInput, StageEvent } from "@/lib/types";

// Runs every stage in order and returns the outcome.
// Identity, hooks and draft can stop the run; the three signal sources and verify fail soft.
export async function runPipeline(prospect: ProspectInput, emit: Emit): Promise<Outcome> {
  const ctx = newContext(prospect);
  const finish = (status: StageEvent["status"], message: string, outcome: Outcome) => {
    emit({ stage: "run", status, message, payload: { outcome }, at: new Date().toISOString() });
    return outcome;
  };

  if (!(await runStage(identity, ctx, emit))) {
    return finish("failed", "Run stopped: could not find the company's website", "stopped");
  }

  // The website goes first: its description lets the news check tell same-name companies apart.
  await runStage(companySite, ctx, emit);
  await Promise.all([news, jobs].map((spec) => runStage(spec, ctx, emit)));

  if (!(await runStage(hooks, ctx, emit))) {
    return finish("failed", "Run stopped: could not rank the hooks", "stopped");
  }

  // Abstain: no usable hook clears the flagged threshold, so no personalised draft is written.
  const best = ctx.hooks.find((hook) => !hook.blockedReason);
  if (!best || best.scores.total < rubric.thresholds.flagged) {
    return finish(
      "done",
      "Nothing specific or recent enough to write about. Choose a value-led generic draft, or deprioritise this prospect",
      "abstained",
    );
  }

  if (!(await runStage(draft, ctx, emit))) {
    return finish("failed", "Run stopped before a draft was written", "stopped");
  }

  const checked = await runStage(verify, ctx, emit);
  const outcome: Outcome = checked?.outcome ?? "flagged";
  return finish(
    "done",
    outcome === "draft" ? "Draft ready for review" : "Draft ready, but check the flagged points",
    outcome,
  );
}
