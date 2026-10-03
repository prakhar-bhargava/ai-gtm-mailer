import sources from "@/config/sources.json";
import { boardSlugs } from "@/lib/pipeline/domain";
import type { StageSpec } from "@/lib/pipeline/stage";
import { findJobBoard } from "@/lib/sources/job-boards";

const roleMatchers = sources.roleKeywords.map((word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"));

// Open finance and ops roles from the company's public Greenhouse or Ashby board.
export const jobs: StageSpec = {
  id: "jobs",
  required: false,
  startMessage: "Looking for open roles on the company's job board",
  run: async (ctx) => {
    const board = await findJobBoard(boardSlugs(ctx.prospect.company, ctx.domain));
    if (!board) {
      return { summary: `No public job board found for ${ctx.prospect.company} (checked Greenhouse and Ashby)` };
    }

    const relevant = board.jobs.filter((job) => {
      const text = `${job.title} ${job.department ?? ""}`;
      return roleMatchers.some((matcher) => matcher.test(text));
    });
    const fetchedAt = new Date().toISOString();
    const chosen = relevant.slice(0, sources.maxSignalsPerSource);

    return {
      summary: `Found ${relevant.length} open finance or ops role${relevant.length === 1 ? "" : "s"} on ${board.provider} (${board.jobs.length} roles in total)`,
      newSignals: chosen.map((job) => ({
        type: "job",
        claim: `Hiring for ${job.title}`,
        snippet: `${job.title}${job.department ? ` (${job.department})` : ""}, listed on the ${board.provider} board`,
        sourceName: `${board.provider} job board`,
        sourceUrl: job.url,
        publishedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
        fetchedAt,
      })),
    };
  },
};
