import type { ProspectInput, StageEvent } from "@/lib/types";
import { runStage, type Emit } from "@/lib/pipeline/stage";
import { identity } from "@/lib/pipeline/stages/identity";
import { news } from "@/lib/pipeline/stages/news";
import { jobs } from "@/lib/pipeline/stages/jobs";
import { companySite } from "@/lib/pipeline/stages/company-site";
import { hooks } from "@/lib/pipeline/stages/hooks";
import { draft } from "@/lib/pipeline/stages/draft";

// Order matters: identity first, then the three optional signal sources in parallel, then hooks and draft.
// Only identity, hooks and draft can stop the run.
export async function runPipeline(prospect: ProspectInput, emit: Emit): Promise<void> {
  const finish = (status: StageEvent["status"], message: string) =>
    emit({ stage: "run", status, message, at: new Date().toISOString() });

  if (!(await runStage(identity, prospect, emit))) {
    finish("failed", "Run stopped: could not identify the prospect");
    return;
  }

  await Promise.all([news, jobs, companySite].map((spec) => runStage(spec, prospect, emit)));

  const requiredSteps = [hooks, draft];
  for (const spec of requiredSteps) {
    if (!(await runStage(spec, prospect, emit))) {
      finish("failed", "Run stopped before a draft was written");
      return;
    }
  }

  finish("done", "Draft ready for review");
}
