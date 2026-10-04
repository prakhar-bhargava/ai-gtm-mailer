import lexicon from "@/config/hook-lexicon.json";
import seller from "@/config/seller-brief.zamp.json";
import type { RawHook } from "@/lib/pipeline/score-hooks";
import { daysAgo, numbers } from "@/lib/pipeline/text";
import { sensitiveTopicIn } from "@/lib/pipeline/sensitivity";
import type { Signal } from "@/lib/types";

// Turns signals into candidate angles without a model call. Each signal's text is matched against the
// categories in config/hook-lexicon.json; the category gives the relevance score and the seller pain.
// Code then adds recency, verifiability, authorship and seniority (score-hooks.ts), so the whole ranking
// is predictable: the same signals always give the same order.

type Category = (typeof lexicon.categories)[number];

const compiled = lexicon.categories.map((category) => ({
  ...category,
  regexes: category.patterns.map((pattern) => new RegExp(pattern, "i")),
}));
const notFinance = lexicon.notFinanceRoles.map((pattern) => new RegExp(`\\b${pattern}`, "i"));

export function categorise(signal: Signal): Category {
  const text = `${signal.claim} ${signal.snippet}`;
  for (const category of compiled) {
    if (!category.types.includes(signal.type)) continue;
    if (category.id === "finance_hiring" && notFinance.some((regex) => regex.test(signal.claim))) continue;
    if (category.regexes.some((regex) => regex.test(text))) return category;
  }
  return compiled[compiled.length - 1];
}

// A job title that is a finance role, not a sales or engineering role that mentions finance.
export function isFinanceRole(title: string): boolean {
  const finance = compiled.find((category) => category.id === "finance_hiring")!;
  return !notFinance.some((regex) => regex.test(title)) && finance.regexes.some((regex) => regex.test(title));
}

export const categoryLabel = (id: string) => lexicon.categories.find((category) => category.id === id)?.label ?? id;

function painFor(category: Category) {
  return seller.pains[category.pain] ?? seller.pains[seller.pains.length - 1];
}

// Specificity (0 to 15): concrete detail earns points, generic text doesn't.
function specificity(text: string, company: string, count: number): number {
  let points = 6;
  if (numbers(text).length) points += 3;
  const names = (text.match(/\b[A-Z][a-zA-Z0-9&]+\b/g) ?? []).filter((word) => !company.includes(word));
  if (names.length >= 2) points += 3;
  if (count >= 2) points += 3;
  return Math.min(points, 15);
}

function whyNow(signals: Signal[]): string {
  const ages = signals.map((signal) => daysAgo(signal.publishedAt)).filter((age): age is number => age !== null);
  if (!ages.length) return "Undated, so it is background rather than a reason to write now";
  const newest = Math.min(...ages);
  return newest <= 1 ? "Published in the last day" : `Published ${newest} days ago`;
}

// Is the company the subject of the headline, or only mentioned in someone else's story?
// "India's Ultraviolette taps Intel CEO as adviser, raises $85 million" is a raise by Ultraviolette, not Intel.
// The company counts as the subject when it opens the headline (after a label such as "Exclusive:"), or when
// a verb follows it closely ("... Now Stripe Is Buying It"). A role word right after it ("Intel CEO") means
// the story is about a person or product, not a company event.
const LABEL = /^(exclusive|report|breaking|update|opinion|analysis|prediction|watch|explainer|live|first look)\s*[:\-–—|]\s*/i;
const ROLE_AFTER = /^(ceo|cfo|coo|cto|cmo|founder|co-?founder|executive|exec|chief|veteran|alum|alumni|chairman|chair|board|investor|-?backed|chips?|processors?|core|ultra|engineers?)\b/i;
const VERB_AFTER = /^(is|was|to|will|has|have|had|raises?|raised|acquires?|acquired|buys?|buying|bought|launches?|launched|expands?|expanded|opens?|opened|hires?|hired|names?|named|appoints?|files?|filed|announces?|announced|reports?|reported|partners?|plans?|says?|said|unveils?|enters?|cuts?|closes?|closed|completes?|completed|secures?|secured|signs?|signed|wins?|won|nears?|agrees?|agreed|sets?|moves?|adds?|added|reaches?|hits?|tops?|posts?|picks?|taps?|eyes?|bets?|makes?|takes?|gets?|goes?|joins?|teams?|introduces?|rolls?|ships?|releases?|debuts?|valued)\b/i;

export function companyIsSubject(title: string, company: string): boolean {
  const text = title.replace(LABEL, "").trim();
  const escaped = company.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(['’]s)?(?=$|[^\\p{L}\\p{N}])`, "iu").exec(text);
  if (!match) return false;
  const start = match.index + match[1].length;
  const before = text.slice(0, start).trim().split(/\s+/).filter(Boolean).length;
  const after = text.slice(start + match[0].length - match[1].length).replace(/^[\s,:;\-–—]+/, "");
  const possessive = Boolean(match[2]);
  if (!possessive && ROLE_AFTER.test(after)) return false;
  if (before <= 1) return true;
  const nextWords = after.split(/\s+/).slice(0, 3);
  return nextWords.some((word) => VERB_AFTER.test(word));
}

const SPECULATION = /^(prediction|opinion|could|can|should|would|what if)\b|\?\s*(\([^)]*\))?\s*$/i;

export function isSpeculation(title: string): boolean {
  return SPECULATION.test(title.trim());
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export type Candidate = RawHook & { category: string };

export function candidateHooks(signals: Signal[], company: string): Candidate[] {
  const out: Candidate[] = [];
  const jobs = signals.filter((signal) => signal.type === "job");
  const byCategory = new Map<string, Signal[]>();
  for (const job of jobs) {
    const category = categorise(job);
    byCategory.set(category.id, [...(byCategory.get(category.id) ?? []), job]);
  }

  // Jobs are grouped: three open AP roles are one angle, and a stronger one than a single role.
  for (const [id, group] of byCategory) {
    const category = compiled.find((item) => item.id === id)!;
    const titles = group.map((job) => job.claim.replace(/^Hiring for /, ""));
    const shown = titles.slice(0, 3).join("; ");
    // The board's full count, when the job step recorded it ("one of 14 open finance roles there").
    const total = Math.max(group.length, ...group.map((job) => Number(job.snippet.match(/one of (\d+) open finance roles/)?.[1] ?? 0)));
    const text =
      id === "finance_hiring"
        ? `${company} has ${plural(total, "open finance role")}, including: ${shown}`
        : `${company} is hiring outside finance (${plural(group.length, "role")}): ${shown}`;
    const pain = painFor(category);
    out.push({
      category: id,
      text,
      signalIds: group.map((job) => job.id),
      pain: id === "finance_hiring" ? pain.pain : "No finance pain follows from these roles on their own",
      whyNow: whyNow(group),
      relevance: category.relevance + (id === "finance_hiring" ? Math.min(total - 1, 3) : 0),
      specificity: specificity(text, company, group.length),
      sensitiveReason: null,
    });
  }

  for (const signal of signals.filter((item) => item.type !== "job")) {
    const background = signal.type === "company_site" && !signal.publishedAt;
    // News where the company is only mentioned can't carry an event angle (a raise, an acquisition):
    // it's ranked as a plain mention instead.
    const mention = signal.type === "news" && !companyIsSubject(signal.claim, company);
    // A headline that asks a question or predicts ("Can Intel's ... Benefit the Stock?", "Prediction: ...")
    // reports no event, so it can't carry one either.
    const speculation = signal.type === "news" && isSpeculation(signal.claim);
    const category = background || mention || speculation ? compiled[compiled.length - 1] : categorise(signal);
    const pain = painFor(category);
    const text = background
      ? signal.claim
      : mention
        ? `Mentions ${company}: ${signal.claim} (${signal.sourceName})`
        : signal.type === "news"
          ? `${signal.claim} (${signal.sourceName})`
          : signal.claim;
    const topic = sensitiveTopicIn(`${signal.claim} ${signal.snippet}`);
    out.push({
      category: background ? "background" : category.id,
      text,
      signalIds: [signal.id],
      pain: background
        ? "None on its own: it describes the company, it doesn't show a change"
        : mention
          ? `None on its own: the story is about someone else and only mentions ${company}`
          : speculation
            ? "None on its own: the headline asks a question or predicts, it doesn't report an event"
            : pain.pain,
      whyNow: whyNow([signal]),
      relevance: background ? 2 : mention || speculation ? 3 : category.relevance,
      specificity: background ? 4 : specificity(signal.claim, company, 1),
      sensitiveReason: topic ? `mentions a sensitive topic (${topic})` : null,
      eventless: background || mention || speculation,
    });
  }
  return out;
}
