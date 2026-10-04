import { upsertCompany } from "@/lib/accounts";
import { guessDomain, normalizeDomain } from "@/lib/pipeline/domain";
import type { StageSpec } from "@/lib/pipeline/stage";
import { crawlPage, forFeed } from "@/lib/sources/crawler";
import { report } from "@/lib/trail";

// Finds the company's website and checks that it answers. A typed website is trusted;
// a guessed one is labelled as a guess so the rep can correct it. The home page read here is cached,
// so the website step that follows reuses it without a second request.
export const identity: StageSpec = {
  id: "identity",
  required: true,
  startMessage: "Finding the company's website",
  run: async ({ prospect }) => {
    const typed = prospect.domain ? normalizeDomain(prospect.domain) : null;
    const domain = typed ?? guessDomain(prospect.company);
    try {
      const home = await crawlPage(`https://${domain}`);
      report(`Opened ${domain}: "${home.title.slice(0, 80)}"`, { crawl: forFeed(home) });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "it did not answer";
      // A site that answers "forbidden" or "too many requests" exists but blocks automated reading.
      // The company is still confirmed; news and job boards can carry the run.
      if (/status (401|403|429)/.test(reason)) {
        upsertCompany({ name: prospect.company, domain });
        return {
          summary: `Matched ${prospect.company} to ${domain}. The site blocks automated reading (${reason}), so the run continues with news and job boards`,
          domain,
        };
      }
      throw new Error(`${domain} could not be read (${reason}). Check the website and try again`);
    }
    upsertCompany({ name: prospect.company, domain });
    const note = typed ? "" : " (guessed from the name; add the website to be sure)";
    return { summary: `Matched ${prospect.company} to ${domain}${note}`, domain };
  },
};
