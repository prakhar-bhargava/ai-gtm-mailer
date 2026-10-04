import { upsertCompany } from "@/lib/accounts";
import { guessDomain, normalizeDomain } from "@/lib/pipeline/domain";
import type { NewSignal, StageSpec } from "@/lib/pipeline/stage";
import type { ProspectInput } from "@/lib/types";
import { crawlPage, forFeed } from "@/lib/sources/crawler";
import { report } from "@/lib/trail";

// Text the rep pasted from the person's LinkedIn (headline, About, a recent post) becomes up to three
// signals, one per paragraph. The app never opens LinkedIn: the rep chose what to share. The profile
// address, when given, is the citation; otherwise the citation says it was pasted.
function pastedProfile(prospect: ProspectInput): NewSignal[] {
  const text = prospect.linkedinText?.trim();
  if (!text) return [];
  const url = prospect.linkedinUrl?.trim();
  const source = url ? (url.startsWith("http") ? url : `https://${url}`) : "pasted by the rep";
  const fetchedAt = new Date().toISOString();
  return text
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length >= 25)
    .slice(0, 3)
    .map((part) => ({
      type: "profile" as const,
      claim: `${prospect.name} on LinkedIn: "${part.slice(0, 220)}${part.length > 220 ? "..." : ""}"`,
      snippet: part.slice(0, 900),
      sourceName: "LinkedIn (pasted by the rep)",
      sourceUrl: source,
      publishedAt: null,
      fetchedAt,
    }));
}

// Finds the company's website and checks that it answers. A typed website is trusted;
// a guessed one is labelled as a guess so the rep can correct it. The home page read here is cached,
// so the website step that follows reuses it without a second request.
export const identity: StageSpec = {
  id: "identity",
  required: true,
  startMessage: "Finding the company's website",
  run: async ({ prospect }) => {
    const profile = pastedProfile(prospect);
    const pasted = profile.length ? `. Added ${profile.length} note${profile.length === 1 ? "" : "s"} you pasted from LinkedIn` : "";
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
          summary: `Matched ${prospect.company} to ${domain}. The site blocks automated reading (${reason}), so the run continues with news and job boards${pasted}`,
          domain,
          newSignals: profile,
        };
      }
      throw new Error(`${domain} could not be read (${reason}). Check the website and try again`);
    }
    upsertCompany({ name: prospect.company, domain });
    const note = typed ? "" : " (guessed from the name; add the website to be sure)";
    return { summary: `Matched ${prospect.company} to ${domain}${note}${pasted}`, domain, newSignals: profile };
  },
};
