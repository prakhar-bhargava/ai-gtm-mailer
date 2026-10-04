import mailRules from "@/config/mail-rules.json";
import rubric from "@/config/rubric.json";
import { generateJson } from "@/lib/llm";
import { writerSystemPrompt, writerUserPrompt } from "@/lib/pipeline/prompts";
import type { StageSpec } from "@/lib/pipeline/stage";
import { allCaselets } from "@/lib/proof";
import { writerAnswerSchema, type Claim, type Draft } from "@/lib/types";

const MAX_ANGLES = 3;
const MAX_BACKGROUND = 8;

// The run's one model call. It gets the top angles that cleared the threshold, their signals, the matching
// customer stories and a little of the company's own website, then picks an angle and writes the email.
export const draft: StageSpec = {
  id: "draft",
  required: true,
  startMessage: "Writing the email (the run's one model call)",
  run: async (ctx) => {
    const usable = ctx.hooks.filter((hook) => !hook.blockedReason);
    const angles = usable.filter((hook, index) => index === 0 || hook.scores.total >= rubric.thresholds.flagged).slice(0, MAX_ANGLES);
    if (!angles.length) throw new Error("no hook is usable for a draft");

    const signalIds = [...new Set(angles.flatMap((hook) => hook.signalIds))];
    const signals = ctx.signals.filter((signal) => signalIds.includes(signal.id));
    const background = [ctx.companyDescription ?? "", ...ctx.siteText]
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line, index, all) => line.length >= 25 && line.length <= 220 && all.indexOf(line) === index)
      .slice(0, MAX_BACKGROUND);

    const answer = await generateJson({
      system: writerSystemPrompt(),
      prompt: writerUserPrompt(ctx.prospect, angles, signals, background),
      schema: writerAnswerSchema({
        hookIds: angles.map((hook) => hook.id) as [string, ...string[]],
        signalIds: signalIds as [string, ...string[]],
        caseletIds: allCaselets().map((item) => item.id) as [string, ...string[]],
        company: ctx.prospect.company,
        subjectWords: [mailRules.subject.minWords, mailRules.subject.maxWords],
        bodyWords: [mailRules.body.hardMinWords, mailRules.body.hardMaxWords],
      }),
    });

    const claims: Claim[] = answer.claims.map((claim) => {
      const signal = signals.find((item) => item.id === claim.signalId)!;
      return {
        text: claim.text,
        signalId: signal.id,
        sourceName: signal.sourceName,
        sourceUrl: signal.sourceUrl,
        publishedAt: signal.publishedAt,
        supported: false, // set by the check step
      };
    });

    // The chosen angle goes first, so "why this angle" and the check step use it.
    const chosen = ctx.hooks.find((hook) => hook.id === answer.chosenHookId)!;
    const reordered = [chosen, ...ctx.hooks.filter((hook) => hook.id !== chosen.id)];

    const finished: Draft = {
      subject: answer.subject.trim(),
      body: answer.body.replace(/\[s:[^\]]+\]/g, "").replace(/\n{3,}/g, "\n\n").trim(),
      claims,
      lintIssues: [],
      hookId: chosen.id,
      reason: answer.reason,
      caseletId: answer.caseletId,
    };
    const switched = chosen.id !== angles[0].id ? `, choosing angle ${chosen.id} over the top-ranked one` : "";
    return {
      summary: `Wrote a ${finished.body.split(/\s+/).filter(Boolean).length}-word email with ${claims.length} cited claim${claims.length === 1 ? "" : "s"}${switched}`,
      draft: finished,
      hooks: reordered,
      chosenReason: answer.reason,
    };
  },
};
