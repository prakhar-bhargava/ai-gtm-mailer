import sources from "@/config/sources.json";
import { generateJson } from "@/lib/llm";
import type { StageSpec } from "@/lib/pipeline/stage";
import { entityAnswerSchema } from "@/lib/types";
import { searchNews, type NewsItem } from "@/lib/sources/google-news";

// Recent news about the company. Three filters, in order:
// 1. the headline names the company and reads like business news,
// 2. it is recent,
// 3. the model confirms it's about this company and not another with the same name.
// If the confirmation fails, the stories are dropped rather than shown unchecked.
export const news: StageSpec = {
  id: "news",
  required: false,
  startMessage: "Checking recent news about the company",
  timeoutMs: 40000, // includes a model call for the same-company check
  run: async (ctx) => {
    const name = ctx.prospect.company.toLowerCase();
    const cutoff = Date.now() - sources.newsDays * 86_400_000;

    const items = await searchNews(ctx.prospect.company);
    const candidates = items
      .filter((item) => {
        const title = item.title.toLowerCase();
        const dated = item.publishedAt === null || Date.parse(item.publishedAt) >= cutoff;
        return dated && title.includes(name) && sources.newsMustMention.some((word) => title.includes(word));
      })
      .slice(0, 8);

    if (candidates.length === 0) {
      return { summary: `No recent news about ${ctx.prospect.company} that clearly matched` };
    }

    const kept = await sameCompanyOnly(candidates, ctx.prospect.company, ctx.domain, ctx.companyDescription);
    if (kept.length === 0) {
      return { summary: `Found ${candidates.length} headline${candidates.length === 1 ? "" : "s"} with the name, but none confirmed as this company` };
    }

    const fetchedAt = new Date().toISOString();
    return {
      summary: `Found ${kept.length} recent news item${kept.length === 1 ? "" : "s"} about ${ctx.prospect.company}`,
      newSignals: kept.slice(0, sources.maxSignalsPerSource).map((item) => ({
        type: "news",
        claim: item.title,
        snippet: item.title,
        sourceName: item.sourceName,
        sourceUrl: item.url,
        publishedAt: item.publishedAt,
        fetchedAt,
      })),
    };
  },
};

async function sameCompanyOnly(
  items: NewsItem[],
  company: string,
  domain: string | null,
  description: string | null,
): Promise<NewsItem[]> {
  const list = items.map((item, index) => `${index}. ${item.title}`).join("\n");
  const answer = await generateJson({
    system:
      "You decide which news headlines are about one specific company. A shared name is not enough: a headline about a different company with the same name does not count.",
    prompt: [
      `Company: ${company}`,
      `Website: ${domain ?? "unknown"}`,
      `The company describes itself as: ${description ?? "unknown"}`,
      "",
      "Headlines:",
      list,
      "",
      "Return the numbers of the headlines that are about this company.",
    ].join("\n"),
    schema: entityAnswerSchema(items.length),
  });
  return items.filter((_, index) => answer.sameCompany.includes(index));
}
