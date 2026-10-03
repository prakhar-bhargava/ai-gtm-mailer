import { upsertCompany } from "@/lib/accounts";
import { extractHrefs, sortLinks } from "@/lib/pipeline/links";
import type { StageSpec } from "@/lib/pipeline/stage";
import { fetchText } from "@/lib/sources/http";
import { trail } from "@/lib/trail";

// Follows the company's own links to find more of its public footprint:
// social profiles (recorded as references only), job boards linked from the site,
// and useful pages such as about, news and careers. It reads up to 2 levels deep,
// and no more than MAX_PAGES pages in total, to keep requests within the rate limit.
const MAX_PAGES = 4;
const MAX_DEPTH = 2;

export const discover: StageSpec = {
  id: "discover",
  required: false,
  startMessage: "Following links on the company's website",
  run: async (ctx) => {
    if (!ctx.domain) throw new Error("the company website is not known yet");
    const domain = ctx.domain;

    const visited = new Set<string>();
    const social = new Set<string>();
    const jobSlugs = new Set<string>();
    let frontier = [`https://${domain}`];

    for (let depth = 0; depth < MAX_DEPTH && visited.size < MAX_PAGES && frontier.length; depth++) {
      const next: string[] = [];
      for (const url of frontier) {
        if (visited.size >= MAX_PAGES) break;
        if (visited.has(url)) continue;
        visited.add(url);
        // Raw HTML, not the reader's text: the text drops the navigation and footer.
        // The homepage is the same copy identity already cached, so it costs no request.
        let html;
        try {
          html = await fetchText(url, { cacheKey: url === `https://${domain}` ? `home:${domain}` : `html:${url}`, accept: "text/html" });
        } catch {
          trail(`Could not read ${url}, skipping it`);
          continue;
        }
        const sorted = sortLinks(extractHrefs(html, url), domain);
        sorted.social.forEach((link) => social.add(link));
        sorted.jobBoardSlugs.forEach((slug) => jobSlugs.add(slug));
        for (const link of sorted.pages) {
          if (!visited.has(link) && !next.includes(link)) next.push(link);
        }
        trail(`Found ${sorted.social.length} social links and ${sorted.pages.length} useful pages on ${url}`);
      }
      frontier = next;
    }

    const socialList = [...social];
    // A company's LinkedIn page found on its own site becomes the LinkedIn reference. It is never fetched.
    const linkedinCompany = socialList.find((link) => /linkedin\.com\/company\//i.test(link)) ?? null;
    upsertCompany({
      name: ctx.prospect.company,
      domain,
      jobBoard: jobSlugs.size ? [...jobSlugs][0] : null,
      social: socialList,
      companyLinkedinUrl: linkedinCompany,
    });

    const parts = [
      `Read ${visited.size} page${visited.size === 1 ? "" : "s"} on ${domain}`,
      `found ${socialList.length} social profile${socialList.length === 1 ? "" : "s"}`,
      jobSlugs.size ? `and a job board link` : "",
    ].filter(Boolean);
    return { summary: parts.join(", "), jobSlugs: [...jobSlugs] };
  },
};
