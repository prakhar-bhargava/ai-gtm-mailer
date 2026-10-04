// Small text helpers for the in-house checks (same company, angle ranking, claim check).
// No model calls: plain word matching that a person can read and predict.

const STOPWORDS = new Set(
  "a an the and or but of to in on at for with by from as is are was were be been being it its this that these those has have had will would can could into over about after before more most than then so such not no our your their his her they we you i he she them us also just new".split(
    " ",
  ),
);

// Lowercase words with punctuation removed.
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9$%.]+/)
    .map((word) => word.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

// A crude stem: the first five letters. "hiring", "hires" and "hired" all become "hirin"/"hires"/"hired",
// so it is paired with a shared-prefix test below rather than exact equality.
const stem = (word: string) => word.slice(0, 5);

export function contentWords(text: string, ignore: string[] = []): string[] {
  const skip = new Set(ignore.flatMap(words));
  return words(text).filter((word) => word.length > 2 && !STOPWORDS.has(word) && !skip.has(word) && !/^\d/.test(word));
}

// Share of the claim's content words that also appear (by stem) in the source.
export function coverage(claim: string, source: string, ignore: string[] = []): number {
  const claimWords = contentWords(claim, ignore);
  if (claimWords.length === 0) return 1;
  const sourceStems = new Set(contentWords(source).map(stem));
  const hits = claimWords.filter((word) => sourceStems.has(stem(word)) || sourceStems.has(stem(word.replace(/(ing|ed|es|s)$/, ""))));
  return hits.length / claimWords.length;
}

// Numbers as written ("$280M", "7B", "3", "2024"), normalised so "$280 million" and "$280M" match.
export function numbers(text: string): string[] {
  const found = text.match(/\$?\d[\d,.]*\s?(%|k|m|b|bn|million|billion|thousand)?/gi) ?? [];
  return found.map((item) =>
    item
      .toLowerCase()
      .replace(/[$,\s]/g, "")
      .replace(/\.$/, "")
      .replace(/million$/, "m")
      .replace(/billion$|bn$/, "b")
      .replace(/thousand$/, "k"),
  );
}

export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function daysAgo(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  return Number.isFinite(time) ? Math.max(0, Math.round((now - time) / 86_400_000)) : null;
}
