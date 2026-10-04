import sources from "@/config/sources.json";
import { sameCompany } from "@/lib/pipeline/same-company";
import type { StageSpec } from "@/lib/pipeline/stage";
import { searchBingNews } from "@/lib/sources/bing-news";
import { searchNews, type NewsItem } from "@/lib/sources/google-news";
import { report } from "@/lib/trail";

// The same story from two feeds, or with a different publisher suffix, counts once.
function storyKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 9).join(" ");
}

// Three free searches in parallel: Google News for the name, Google News for the name plus business-event
// words, and Bing News. A feed that fails is skipped; the others still count.
async function gather(company: string): Promise<{ items: NewsItem[]; feeds: string[] }> {
  const results = await Promise.allSettled([
    searchNews(company),
    searchNews(company, { focus: true }),
    searchBingNews(company),
  ]);
  const names = ["Google News", "Google News (business events)", "Bing News"];
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  const feeds: string[] = [];
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    feeds.push(`${names[index]} (${result.value.length})`);
    for (const item of result.value) {
      const key = storyKey(item.title);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  });
  if (!feeds.length) throw new Error("none of the news feeds answered");
  return { items, feeds };
}

// Recent news about the company, from Google News and Bing News (free, no key). Three filters, in order:
// 1. it is recent and reads like business news,
// 2. it names this company, not another with the same name (same-company.ts, checked against the
//    words on the company's own website), and
// 3. no more than the per-source limit.
// No model call. Dropped headlines are shown with the reason, so nothing disappears silently.
export const news: StageSpec = {
  id: "news",
  required: false,
  startMessage: "Checking recent news about the company",
  run: async (ctx) => {
    const cutoff = Date.now() - sources.newsDays * 86_400_000;
    const { items, feeds } = await gather(ctx.prospect.company);
    report(`Searched ${feeds.join(", ")}: ${items.length} different headlines`, {});
    const recent = items.filter((item) => {
      const title = item.title.toLowerCase();
      const dated = item.publishedAt === null || Date.parse(item.publishedAt) >= cutoff;
      const excluded = sources.excludeTerms.some((term) => title.includes(term));
      return dated && !excluded && sources.newsMustMention.some((word) => title.includes(word));
    });
    if (recent.length === 0) {
      return { summary: `No recent business news about ${ctx.prospect.company}` };
    }

    const siteText = [ctx.companyDescription ?? "", ...ctx.siteText].join(" ");
    const { kept, dropped } = sameCompany(recent, ctx.prospect.company, siteText);
    if (dropped.length) {
      report(`Left out ${dropped.length} headline${dropped.length === 1 ? "" : "s"} that may be about something else`, {
        findings: dropped.slice(0, 6).map(({ item, reason }) => ({
          kind: "headline_dropped" as const,
          label: `${item.title.slice(0, 90)}: ${reason}`,
          url: item.url,
        })),
      });
    }
    if (kept.length === 0) {
      return { summary: `Found ${recent.length} headline${recent.length === 1 ? "" : "s"} with the name, but none clearly about this company` };
    }

    const fetchedAt = new Date().toISOString();
    const chosen = kept
      .sort((a, b) => Date.parse(b.publishedAt ?? "0") - Date.parse(a.publishedAt ?? "0"))
      .slice(0, sources.maxSignalsPerSource);
    return {
      summary: `Found ${kept.length} recent news item${kept.length === 1 ? "" : "s"} about ${ctx.prospect.company}`,
      newSignals: chosen.map((item) => ({
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
