import sources from "@/config/sources.json";
import { upsertCompany } from "@/lib/accounts";
import { sortLinks } from "@/lib/pipeline/links";
import type { NewSignal, StageSpec } from "@/lib/pipeline/stage";
import { crawlPage, forFeed, type RawPage } from "@/lib/sources/crawler";
import { report, trail } from "@/lib/trail";
import type { Finding } from "@/lib/types";

// Follows the company's own links with the crawler to find more of its public footprint:
// careers, newsroom, press and blog pages; social profiles (recorded as references only, never opened);
// job boards linked from the site; and dated items on the newsroom, which can become signals.
// The crawler runs locally, so this step costs no model calls and no rate-limited requests.
const MAX_PAGES = 8; // including the home and about pages already read
const EXCLUDED = new RegExp(sources.excludeTerms.join("|"), "i");

// Careers and news first: they hold the most datable, specific facts.
function priority(url: string): number {
  const path = new URL(url).pathname.toLowerCase();
  if (/careers|jobs/.test(path)) return 0;
  if (/newsroom|press|news/.test(path)) return 1;
  if (/blog/.test(path)) return 2;
  if (/about|company|leadership|team/.test(path)) return 3;
  return 4;
}

function isRecent(date: string): boolean {
  const time = Date.parse(date);
  return Number.isFinite(time) && Date.now() - time <= sources.newsDays * 86_400_000 && time <= Date.now() + 86_400_000;
}

export const discover: StageSpec = {
  id: "discover",
  required: false,
  startMessage: "Following links on the company's website",
  run: async (ctx) => {
    if (!ctx.domain) throw new Error("the company website is not known yet");
    const domain = ctx.domain;

    const read: RawPage[] = [await crawlPage(`https://${domain}`)];
    try {
      read.push(await crawlPage(`https://${domain}/about`));
    } catch {
      // already reported by the website step
    }

    const social = new Set<string>();
    const jobSlugs = new Set<string>();
    const queue = new Set<string>();
    const visit = (page: RawPage) => {
      const sorted = sortLinks(page.links, domain);
      sorted.social.forEach((link) => social.add(link));
      sorted.jobBoardSlugs.forEach((slug) => jobSlugs.add(slug));
      sorted.pages.forEach((link) => queue.add(link));
    };
    read.forEach(visit);

    const seen = new Set(read.map((page) => page.url.replace(/\/$/, "")));
    const next = [...queue].filter((url) => !seen.has(url)).sort((a, b) => priority(a) - priority(b));
    trail(`Found ${next.length} pages worth reading; reading up to ${MAX_PAGES - read.length}`);

    for (const url of next) {
      if (read.length >= MAX_PAGES) break;
      try {
        const page = await crawlPage(url);
        read.push(page);
        visit(page);
        report(`Read ${new URL(page.url).pathname}: "${page.title.slice(0, 70)}"`, { crawl: forFeed(page) });
      } catch (error) {
        report(`Skipped ${new URL(url).pathname}`, {
          findings: [{ kind: "page_skipped", label: `${new URL(url).pathname}: ${error instanceof Error ? error.message : "no answer"}`, url }],
        });
      }
    }

    // Dated items on the company's own newsroom, press or blog pages, within the news window.
    const dated = read
      .filter((page) => page.kind === "news" || page.kind === "home")
      .flatMap((page) => page.dated.map((item) => ({ ...item, page })))
      .filter((item) => isRecent(item.date) && !EXCLUDED.test(item.title))
      .filter((item, index, all) => all.findIndex((other) => other.title === item.title) === index)
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, sources.maxSignalsPerSource);

    // Older posts are shown in the feed so the rep can see they were found, but they can't be a reason to write now.
    const older = read
      .flatMap((page) => page.dated.map((item) => ({ ...item, page })))
      .filter((item) => Number.isFinite(Date.parse(item.date)) && !isRecent(item.date))
      .filter((item, index, all) => all.findIndex((other) => other.title === item.title) === index)
      .slice(0, 5);

    const newSignals: NewSignal[] = dated.map((item) => ({
      type: "company_site",
      claim: `${ctx.prospect.company} published: "${item.title.slice(0, 160)}"`,
      snippet: item.title.slice(0, 300),
      sourceName: `${domain} (${item.page.kind === "news" ? "newsroom" : "website"})`,
      sourceUrl: item.url ?? item.page.url,
      publishedAt: new Date(Date.parse(item.date)).toISOString(),
      fetchedAt: new Date().toISOString(),
    }));

    const socialList = [...social];
    const findings: Finding[] = [
      ...socialList.map((url) => ({ kind: "profile" as const, label: new URL(url).host.replace(/^www\./, ""), url })),
      ...[...jobSlugs].map((slug) => ({ kind: "job_board" as const, label: `Job board: ${slug}`, url: null })),
      ...dated.map((item) => ({ kind: "dated_item" as const, label: `${item.date.slice(0, 10)}: ${item.title.slice(0, 90)}`, url: item.url ?? item.page.url })),
      ...older.map((item) => ({
        kind: "dated_item" as const,
        label: `${item.date.slice(0, 10)} (older than ${sources.newsDays} days, not used): ${item.title.slice(0, 80)}`,
        url: item.url ?? item.page.url,
      })),
    ];
    if (findings.length) report(`Found ${socialList.length} profiles, ${jobSlugs.size} job boards and ${dated.length} dated posts`, { findings });

    // A company's LinkedIn page found on its own site becomes the LinkedIn reference. It is never opened.
    const linkedinCompany = socialList.find((link) => /linkedin\.com\/company\//i.test(link)) ?? null;
    upsertCompany({
      name: ctx.prospect.company,
      domain,
      jobBoard: jobSlugs.size ? [...jobSlugs][0] : null,
      social: socialList,
      companyLinkedinUrl: linkedinCompany,
    });

    const parts = [
      `Read ${read.length} page${read.length === 1 ? "" : "s"} on ${domain}`,
      `${socialList.length} social profile${socialList.length === 1 ? "" : "s"}`,
      dated.length ? `${dated.length} dated post${dated.length === 1 ? "" : "s"}` : "",
      jobSlugs.size ? "a job board link" : "",
    ].filter(Boolean);
    return { summary: parts.join(", "), jobSlugs: [...jobSlugs], newSignals };
  },
};
