import seller from "@/config/seller-brief.zamp.json";

// The only figures and customer stories a draft may use. All of them come from the seller brief,
// and each has a public source. Shared by the writer prompt, the claim check and the style check.

export type Caselet = { id: string; text: string; source: string };

const proof = seller.proof;

export function caseletFor(category: string | undefined): Caselet {
  const list = proof.caselets;
  const match = list.find((item) => category && item.fits.includes(category)) ?? list[0];
  return { id: match.id, text: proof.use_customer_names ? match.named : match.anonymous, source: match.source };
}

export function allCaselets(): Caselet[] {
  return proof.caselets.map((item) => ({ id: item.id, text: proof.use_customer_names ? item.named : item.anonymous, source: item.source }));
}

// Phrases that may carry a number in an email: the approved figures, plus a sourced effort figure if set.
export function approvedFigures(): string[] {
  const impact = proof.impact.effortReduction as string | null;
  return [...proof.approved_figures.map((item) => item.text), ...(impact ? [impact] : [])];
}

// Every spelling the checks should accept for the approved figures.
export function approvedMatches(): string[] {
  const impact = proof.impact.effortReduction as string | null;
  return [...proof.approved_figures.flatMap((item) => [item.text, ...item.match]), ...(impact ? [impact] : [])];
}

export const sellerName = seller.seller;
export const valueLine = seller.value_line;
