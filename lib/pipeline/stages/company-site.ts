import sources from "@/config/sources.json";
import type { StageSpec } from "@/lib/pipeline/stage";
import { crawlPage, forFeed, type RawPage } from "@/lib/sources/crawler";
import { report, trail } from "@/lib/trail";
import type { Finding } from "@/lib/types";

const EXCLUDED = new RegExp(sources.excludeTerms.join("|"), "i");

// The company's own description of itself, read by the crawler from the home and about pages.
// It has no date, so it can support a hook but never lead one. Its first sentence also tells the news
// check which company is meant.
export const companySite: StageSpec = {
  id: "company_site",
  required: false,
  startMessage: "Reading the company website",
  run: async (ctx) => {
    if (!ctx.domain) throw new Error("the company website is not known yet");
    const home = await crawlPage(`https://${ctx.domain}`);

    // The about page: the link the site itself uses, or /about as a guess.
    const aboutLink =
      home.links.find((link) => {
        try {
          const url = new URL(link);
          return url.host.replace(/^www\./, "") === ctx.domain && /^\/(about|company)(-us)?\/?$/i.test(url.pathname);
        } catch {
          return false;
        }
      }) ?? `https://${ctx.domain}/about`;
    let about: RawPage | null = null;
    try {
      about = await crawlPage(aboutLink);
      report(`Read the about page: "${about.title.slice(0, 80)}"`, { crawl: forFeed(about) });
    } catch (error) {
      trail(`No about page at ${new URL(aboutLink).pathname} (${error instanceof Error ? error.message : "no answer"}), using the home page`);
    }

    // The first plain sentence that describes the company. Cookie and consent text is skipped.
    const candidates = [about?.description, home.description, ...(about?.paragraphs ?? []), ...home.paragraphs].filter(
      (item): item is string => Boolean(item),
    );
    const sentence =
      candidates
        .flatMap((text) => text.split(/(?<=[.!?])\s/))
        .map((item) => item.trim())
        .find((item) => item.length >= 40 && !EXCLUDED.test(item) && !/javascript/i.test(item)) ?? "";
    if (!sentence) throw new Error("the pages had no readable description");

    const source = about ?? home;
    const findings: Finding[] = [
      ...[...new Set([...home.facts, ...(about?.facts ?? [])])].map((fact) => ({ kind: "fact" as const, label: fact, url: null })),
      ...[...new Set([...home.tech, ...(about?.tech ?? [])])].map((tool) => ({ kind: "tech" as const, label: `Site uses ${tool}`, url: null })),
    ];
    if (findings.length) report(`Found ${findings.length} facts about the company on its site`, { findings });

    return {
      summary: `Read ${ctx.domain}'s ${about ? "home and about pages" : "home page"}`,
      companyDescription: sentence.slice(0, 300),
      newSignals: [
        {
          type: "company_site",
          claim: `The company describes itself: "${sentence.slice(0, 200)}"`,
          snippet: sentence.slice(0, 300),
          sourceName: `${ctx.domain} (company website)`,
          sourceUrl: source.url,
          publishedAt: null,
          fetchedAt: new Date().toISOString(),
        },
      ],
    };
  },
};
