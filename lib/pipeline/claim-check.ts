import { approvedMatches, allCaselets, sellerName, valueLine } from "@/lib/proof";
import { companyIsSubject } from "@/lib/pipeline/hook-candidates";
import { contentWords, coverage, numbers, sentences } from "@/lib/pipeline/text";
import type { Claim, Draft, Signal } from "@/lib/types";

// Checks the draft against its sources without a model call.
//
// A claim is supported when every number in it appears in the cited signal, and at least
// MIN_COVERAGE of its content words (by stem) appear there too. Company and seller names don't count,
// since they are in every sentence.
//
// A news headline where the company is only mentioned ("Ultraviolette taps Intel CEO, raises $85M")
// supports nothing about the company itself.
//
// Separately, any sentence about the prospect's company that isn't one of the claims, and any number
// that comes from neither a source nor the approved figures, is listed for the rep to check.

const MIN_COVERAGE = 0.6;

export type ClaimResult = { claims: Claim[]; issues: string[]; reasons: Record<number, string> };

export function checkClaims(draft: Draft, signals: Signal[], company: string): ClaimResult {
  const ignore = [company, sellerName];
  const reasons: Record<number, string> = {};
  const claims = draft.claims.map((claim, index) => {
    const signal = signals.find((item) => item.id === claim.signalId);
    if (!signal) {
      reasons[index] = "cites a source that isn't in this run";
      return { ...claim, supported: false };
    }
    // A headline that only mentions the company can't back a claim about what the company did.
    if (signal.type === "news" && !companyIsSubject(signal.claim, company)) {
      reasons[index] = `the source is someone else's story that only mentions ${company}`;
      return { ...claim, supported: false };
    }
    const source = `${signal.claim} ${signal.snippet} ${signal.sourceName}`;
    const sourceNumbers = new Set(numbers(source));
    const missing = numbers(claim.text).filter((value) => !sourceNumbers.has(value));
    if (missing.length) {
      reasons[index] = `the number ${missing.join(", ")} isn't in the source`;
      return { ...claim, supported: false };
    }
    const share = coverage(claim.text, source, ignore);
    if (share < MIN_COVERAGE) {
      reasons[index] = `only ${Math.round(share * 100)}% of its words are in the source`;
      return { ...claim, supported: false };
    }
    return { ...claim, supported: true };
  });

  const issues: string[] = [];
  const known = [...allCaselets().map((item) => item.text), valueLine];
  const claimText = draft.claims.map((claim) => claim.text).join(" ");
  const sourceNumbers = new Set(signals.flatMap((signal) => numbers(`${signal.claim} ${signal.snippet}`)));
  const approved = approvedMatches().map((item) => item.toLowerCase());
  const companyRe = new RegExp(`\\b${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");

  const parts = sentences(draft.body).slice(1); // the greeting is first
  for (const sentence of parts) {
    if (sentence.endsWith("?")) continue; // the call to action
    if (contentWords(sentence).length < 3) continue;
    const aboutSeller = new RegExp(`\\b${sellerName}\\b`, "i").test(sentence) && !companyRe.test(sentence);
    const fromStory = known.some((text) => coverage(sentence, text, ignore) >= MIN_COVERAGE);
    if (aboutSeller || fromStory) continue;
    if (companyRe.test(sentence) && coverage(sentence, claimText, ignore) < MIN_COVERAGE) {
      issues.push(`States a fact about ${company} with no source: "${sentence.slice(0, 120)}"`);
    }
  }

  const lower = draft.body.toLowerCase();
  const stray = numbers(draft.body).filter(
    (value) => !sourceNumbers.has(value) && !approved.some((phrase) => phrase.includes(value) && lower.includes(phrase)),
  );
  if (stray.length) issues.push(`Has a number with no source: ${[...new Set(stray)].join(", ")}`);

  // Each claim should also be in the email itself, not only in the citation list.
  draft.claims.forEach((claim, index) => {
    if (coverage(claim.text, draft.body, ignore) < 0.8) {
      issues.push(`Claim ${index + 1} is cited but not in the email: "${claim.text.slice(0, 80)}"`);
    }
  });
  return { claims, issues, reasons };
}
