import sources from "@/config/sources.json";
import { boardSlugs } from "@/lib/pipeline/domain";
import type { StageSpec } from "@/lib/pipeline/stage";
import { findJobBoard } from "@/lib/sources/job-boards";
import { isFinanceRole } from "@/lib/pipeline/hook-candidates";

const roleMatchers = sources.roleKeywords.map((word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"));

// Open finance and ops roles from the company's public job board (Greenhouse, Ashby, Lever,
// SmartRecruiters or Workable).
export const jobs: StageSpec = {
  id: "jobs",
  required: false,
  startMessage: "Looking for open roles on the company's job board",
  run: async (ctx) => {
    // Boards linked from the company's own site come first; guessed names are the fallback.
    const slugs = [...new Set([...ctx.jobSlugs, ...boardSlugs(ctx.prospect.company, ctx.domain)])];
    const board = await findJobBoard(slugs);
    if (!board) {
      return { summary: `No public job board found for ${ctx.prospect.company} (checked Greenhouse, Ashby, Lever, SmartRecruiters and Workable)` };
    }

    const relevant = board.jobs.filter((job) => {
      const text = `${job.title} ${job.department ?? ""}`;
      return roleMatchers.some((matcher) => matcher.test(text));
    });
    const fetchedAt = new Date().toISOString();
    // Real finance roles (AP, accounting, controller) before roles that only mention a finance word,
    // such as "Account Executive, Billing"; newest first within each group.
    const newest = (a: { updatedAt?: string | null }, b: { updatedAt?: string | null }) =>
      Date.parse(b.updatedAt ?? "0") - Date.parse(a.updatedAt ?? "0");
    const finance = relevant.filter((job) => isFinanceRole(job.title)).sort(newest);
    const rest = relevant.filter((job) => !isFinanceRole(job.title)).sort(newest);
    const chosen = [...finance, ...rest].slice(0, sources.maxSignalsPerSource);

    return {
      summary: `Found ${finance.length} open finance role${finance.length === 1 ? "" : "s"} and ${rest.length} other role${rest.length === 1 ? "" : "s"} with a finance word on ${board.provider} (${board.jobs.length} roles in total)`,
      newSignals: chosen.map((job) => ({
        type: "job",
        claim: `Hiring for ${job.title}`,
        snippet: `${job.title}${job.department ? ` (${job.department})` : ""}, listed on the ${board.provider} board${isFinanceRole(job.title) ? `, one of ${finance.length} open finance roles there` : ""}`,
        sourceName: `${board.provider} job board`,
        sourceUrl: job.url,
        publishedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
        fetchedAt,
      })),
    };
  },
};
