import sources from "@/config/sources.json";
import { sameCompany } from "@/lib/pipeline/same-company";
import type { StageSpec } from "@/lib/pipeline/stage";
import { searchNews } from "@/lib/sources/google-news";
import { report } from "@/lib/trail";

// Recent news about the company, from Google News (free, no key). Three filters, in order:
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
    const items = await searchNews(ctx.prospect.company);
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
