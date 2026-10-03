import { upsertCompany } from "@/lib/accounts";
import { guessDomain, normalizeDomain } from "@/lib/pipeline/domain";
import type { StageSpec } from "@/lib/pipeline/stage";
import { fetchText } from "@/lib/sources/http";

// Finds the company's website and checks that it answers. A typed website is trusted;
// a guessed one is labelled as a guess so the rep can correct it.
export const identity: StageSpec = {
  id: "identity",
  required: true,
  startMessage: "Finding the company's website",
  run: async ({ prospect }) => {
    const typed = prospect.domain ? normalizeDomain(prospect.domain) : null;
    const domain = typed ?? guessDomain(prospect.company);
    try {
      await fetchText(`https://${domain}`, { cacheKey: `home:${domain}`, accept: "text/html" });
    } catch {
      throw new Error(`${domain} did not answer. Add the company website and try again`);
    }
    upsertCompany({ name: prospect.company, domain });
    const note = typed ? "" : " (guessed from the name; add the website to be sure)";
    return { summary: `Matched ${prospect.company} to ${domain}${note}`, domain };
  },
};
