import lexicon from "@/config/hook-lexicon.json";
import { contentWords, escapeRegex, numbers } from "@/lib/pipeline/text";
import type { NewsItem } from "@/lib/sources/google-news";

// Decides, without a model call, whether a headline is about this company or another with the same name.
// Google News matches words, not companies, so "Basecamp" also finds base camps and coffee shops.
//
// A headline is kept when:
//   1. it names the company as a whole word, with a capital (so "base camp" or "on-ramp" don't count),
//   2. the word right after the name doesn't make it a different name: a capitalised word that isn't
//      ordinary headline English ("Basecamp Research", "Notion Labs"), or a business type ("Stripe Mining"),
//      unless the company's own website uses that word, and
//   3. it doesn't read as a story from another field: it uses a word such as "clinical", "patients" or
//      "expedition" (offTopicWords in config/hook-lexicon.json) that the company's own website never uses, and
//   4. it isn't the same story as a headline dropped by rule 2: sharing a figure such as "$140M", or most
//      of its distinctive words, with one counts as the same story.
// Everything dropped is reported with its reason, so the rep can see what was left out and why.

export type Dropped = { item: NewsItem; reason: string };

// Words a title-case headline often puts right after a company name. Anything else capitalised there,
// and not on the company's own site, is read as part of a different name.
const HEADLINE_WORDS = new Set(
  (
    "a an the and or but of to in on at for with by from as is are was were be been has have had will would can could may " +
    "into over about after before amid as vs via its it this that new now just also " +
    "acquires acquired acquire acquisition buys buying bought raises raised raising funding funds launches launched launch " +
    "launching announces announced announcing unveils unveiled introduces introduced expands expanded expanding enters entering " +
    "opens opened partners partnered partnering teams joins joined hires hired hiring names named appoints appointed adds added " +
    "reports reported posts posted says said sees saw plans planned files filed sets set hits hit reaches reached tops beats " +
    "cuts cut makes made takes took gets got goes went brings rolls rolling ships shipped releases released debuts integrates " +
    "ceo cfo coo cto founder co-founder president chief executive ipo valuation revenue earnings shares stock deal deals " +
    "sessions update updates news report review rivals rival vs versus valued value targets eyes bets doubles grows growth"
  ).split(" "),
);

export function sameCompany(
  items: NewsItem[],
  company: string,
  siteText: string,
): { kept: NewsItem[]; dropped: Dropped[] } {
  const site = siteText.toLowerCase();
  const name = company.trim();
  const nameRe = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(name)}(?=$|[^\\p{L}\\p{N}])`, "iu");
  // Names that are ordinary words ("Notion", "Stripe", "Basecamp") must appear capitalised as a name.
  const capitalRe = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(name)}(?=$|[^\\p{L}\\p{N}])`, "u");
  // "Stripe's Bridge" is Stripe's own product, so only a plain "Name Word" is tested, not a possessive.
  const nextWordRe = new RegExp(`${escapeRegex(name)}\\s+([\\p{L}&]+)`, "u");
  const prevWordRe = new RegExp(`([\\p{L}\\p{N}$'’.]+)\\s+${escapeRegex(name)}(?=$|[^\\p{L}\\p{N}])`, "u");
  const entityWords = new Set(lexicon.differentEntityWords);
  const offTopic = lexicon.offTopicWords;

  const siteWords = new Set(site.split(/[^a-z0-9&]+/).filter(Boolean));

  const kept: NewsItem[] = [];
  const dropped: Dropped[] = [];
  const otherNames: { item: NewsItem; other: string }[] = [];
  for (const item of items) {
    if (!nameRe.test(item.title) || !capitalRe.test(item.title)) {
      dropped.push({ item, reason: nameRe.test(item.title) ? `uses "${name.toLowerCase()}" as an ordinary word` : `doesn't name ${name}` });
      continue;
    }
    const titleWords = item.title.toLowerCase().split(/[^a-z0-9&]+/);
    const field = offTopic.find((word) => titleWords.includes(word) && !siteWords.has(word));
    if (field) {
      dropped.push({ item, reason: `reads as a story about something else ("${field}"), not ${name}'s business` });
      continue;
    }
    // The word before the name: "Ford Bronco Basecamp", "Production Ramp" and "$10M Basecamp" are other things.
    const prevRaw = item.title.match(prevWordRe)?.[1] ?? "";
    const prev = prevRaw.toLowerCase();
    const possessive = /['’]s?$/.test(prevRaw);
    const numberBefore = /^\$?\d/.test(prevRaw);
    const nameBefore = /^\p{Lu}/u.test(prevRaw) && !HEADLINE_WORDS.has(prev) && !siteWords.has(prev);
    if (prevRaw && !possessive && (numberBefore || nameBefore)) {
      const other = `${prevRaw} ${name}`;
      otherNames.push({ item, other });
      dropped.push({ item, reason: `"${other}" is something else` });
      continue;
    }
    const nextRaw = item.title.match(nextWordRe)?.[1] ?? "";
    const next = nextRaw.toLowerCase();
    const capitalised = /^\p{Lu}/u.test(nextRaw);
    const differentName = capitalised && !HEADLINE_WORDS.has(next) && !siteWords.has(next);
    const businessType = entityWords.has(next) && !siteWords.has(next);
    if (next && (differentName || businessType)) {
      const other = `${name} ${nextRaw}`;
      otherNames.push({ item, other });
      dropped.push({ item, reason: `"${other}" looks like a different organisation` });
      continue;
    }
    kept.push(item);
  }

  // Rule 4: the same story told without the other organisation's full name.
  const ignore = [name];
  const stillKept: NewsItem[] = [];
  for (const item of kept) {
    const figures = numbers(item.title).filter((value) => value.length >= 3);
    const words = new Set(contentWords(item.title, ignore));
    const twin = otherNames.find(({ item: other }) => {
      const otherFigures = numbers(other.title);
      const shared = contentWords(other.title, ignore).filter((word) => words.has(word) && !siteWords.has(word));
      return figures.some((value) => otherFigures.includes(value)) || shared.length >= 3;
    });
    if (twin) dropped.push({ item, reason: `same story as a headline about ${twin.other}` });
    else stillKept.push(item);
  }
  return { kept: stillKept, dropped };
}
