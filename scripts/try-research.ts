// Runs a prospect through every step except the model call, and prints what the writer would get.
// Usage: npx tsx scripts/try-research.ts "Name" "Company" domain.com ["Role"]
import { newContext, runStage, type Emit } from "@/lib/pipeline/stage";
import { identity } from "@/lib/pipeline/stages/identity";
import { companySite } from "@/lib/pipeline/stages/company-site";
import { discover } from "@/lib/pipeline/stages/discover";
import { news } from "@/lib/pipeline/stages/news";
import { jobs } from "@/lib/pipeline/stages/jobs";
import { hooks } from "@/lib/pipeline/stages/hooks";
import { writerSystemPrompt, writerUserPrompt } from "@/lib/pipeline/prompts";
import { emptyUsage, snapshotUsage, withUsage } from "@/lib/usage";

const [name, company, domain, role] = process.argv.slice(2);
const emit: Emit = (event) => {
  if (event.status === "done" || event.status === "failed") console.log(`[${event.stage}] ${event.status}: ${event.message}`);
  if (event.payload?.findings?.some((finding) => finding.kind === "headline_dropped")) {
    event.payload.findings.forEach((finding) => console.log(`   dropped: ${finding.label}`));
  }
};

void withUsage(emptyUsage(), async () => {
  const ctx = newContext({ name, company, domain, role });
  await runStage(identity, ctx, emit);
  await runStage(companySite, ctx, emit);
  await runStage(discover, ctx, emit);
  await Promise.all([news, jobs].map((spec) => runStage(spec, ctx, emit)));
  await runStage(hooks, ctx, emit);
  for (const hook of ctx.hooks) console.log(`  ${hook.id} ${hook.scores.total} [${hook.category}] ${hook.text.slice(0, 110)}${hook.blockedReason ? " BLOCKED" : ""}`);
  const top = ctx.hooks.filter((hook) => !hook.blockedReason).slice(0, 3);
  const prompt = writerUserPrompt(ctx.prospect, top, ctx.signals, [ctx.companyDescription ?? "", ...ctx.siteText].slice(0, 8));
  console.log("\n--- writer prompt ---\n" + prompt);
  console.log(`\n~${Math.round((writerSystemPrompt().length + prompt.length) / 4)} input tokens`);
  console.log(JSON.stringify(snapshotUsage()));
  process.exit(0);
});
