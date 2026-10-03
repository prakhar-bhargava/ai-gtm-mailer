import seller from "@/config/seller-brief.zamp.json";
import mailRules from "@/config/mail-rules.json";
import type { Claim, Draft, Hook, ProspectInput, Signal } from "@/lib/types";

const sellerSummary = [
  `${seller.seller} sells: ${seller.offer}`,
  `Strongest proof point: ${seller.strongest_proof_point}.`,
  `Ideal customer: ${seller.ideal_customer}`,
  "Pains and the angle for each:",
  ...seller.pains.map((pain) => `- When a company shows "${pain.signal}", the pain is "${pain.pain}". Zamp's angle: ${pain.zamp_angle}.`),
].join("\n");

function signalList(signals: Signal[]): string {
  return signals
    .map(
      (signal) =>
        `- id ${signal.id} (${signal.type}): ${signal.claim}. Detail: ${signal.snippet}. Source: ${signal.sourceName}, published ${signal.publishedAt ?? "date unknown"}.`,
    )
    .join("\n");
}

export function hookSystemPrompt(): string {
  return [
    "You find reasons to contact a prospect, using only the public signals you are given.",
    sellerSummary,
    "",
    "For each hook: write one short factual sentence, name the signal ids it rests on, state the pain it implies, and say why it matters now.",
    "Score relevance from 0 to 35: how strongly the signal implies a finance or operations pain that Zamp addresses.",
    "Anchors: hiring for accounts payable, accounting, finance or billing roles, an ERP or finance-system change, expansion into new countries or entities, or a funding round to scale finance: 25 to 35.",
    "Sales, marketing or engineering hiring, product launches, partnerships, and growth or revenue figures on their own: 0 to 15. Sales hiring does not imply a finance pain.",
    "Score specificity from 0 to 15: how specific the hook is to this company rather than the industry.",
    "Set sensitiveReason to a short reason if the hook touches layoffs, lawsuits, investigations, executive departures, health, family, politics, rumours or personal life. Otherwise null.",
    "Give 3 to 5 hooks. Only cite ids that appear in the signal list.",
    "Every hook must state a fact from a cited signal. Never write a hook about what is missing, absent or unknown (for example 'no hiring signals found'). If no signal supports a pain, give the hooks anyway with relevance 0 and say so in the pain field.",
  ].join("\n");
}

export function hookUserPrompt(prospect: ProspectInput, signals: Signal[]): string {
  return [
    `Prospect: ${prospect.name}${prospect.role ? `, ${prospect.role}` : ""} at ${prospect.company}.`,
    "",
    "Signals:",
    signalList(signals),
  ].join("\n");
}

export function draftSystemPrompt(): string {
  return [
    `You write a cold outreach email for ${seller.seller}. Tone: ${seller.tone}`,
    "",
    "Structure: a premise (one factual sentence about the prospect's company, from the hook), then value (one or two sentences on the pain and what the seller does about it), then a call to action that is an interest question such as 'Worth a look?'.",
    "Rules (full list in docs/09-mail-guardrails.md):",
    `- Subject: ${mailRules.subject.minWords} to ${mailRules.subject.maxWords} words, lowercase is fine.`,
    `- Body: aim for about 70 words, between ${mailRules.body.targetMinWords} and ${mailRules.body.targetMaxWords}. Use ${mailRules.body.minParagraphs} to ${mailRules.body.maxParagraphs} short paragraphs.`,
    "- Plain text only. No markdown, no bullet points, no links, no emoji.",
    `- Open with a greeting such as "Hi ${"Name"},". Keep every sentence under ${mailRules.body.maxSentenceWords} words.`,
    "- Use only the signals you are given. Each factual sentence goes in claims with the id of the signal that supports it.",
    "- No ROI numbers or multipliers, no stock openers such as 'I noticed you recently' or 'I hope this finds you well', no flattery, no exclamation marks, no emoji.",
    "- At most one question: the final call to action.",
    "- Never say how the information was found (do not mention LinkedIn or searching).",
    "- Do not invent facts, and do not name customers.",
    `- For the value sentence, use this approved line (you may shorten it): "${seller.value_line}" Do not add any other product features.`,
    "- Every sentence about the prospect's company must be a claim with a signal id. Do not describe the prospect's volumes, growth, pressures or workload unless a signal says so. Sentences about Zamp need no claim.",
  ].join("\n");
}

export function draftUserPrompt(prospect: ProspectInput, hook: Hook, signals: Signal[]): string {
  return [
    `Prospect: ${prospect.name}${prospect.role ? `, ${prospect.role}` : ""} at ${prospect.company}.`,
    `Chosen hook: ${hook.text}`,
    `Pain it implies: ${hook.pain}`,
    `Why now: ${hook.whyNow}`,
    "",
    "Signals (use only these):",
    signalList(signals),
  ].join("\n");
}

export function verifySystemPrompt(): string {
  return [
    "You check whether each claim in an email is supported by the source snippet it cites.",
    "A claim is supported only if the snippet states it or directly implies it. A claim that adds a fact, number or cause the snippet does not contain is not supported.",
    "For each claim, return its index, supported true or false, and the short quote from the snippet that supports it (or an empty string).",
    "Also list in uncitedFacts every sentence of the email that states a fact about the prospect's company (its growth, volumes, pressures, plans or events) and is not one of the claims. Do not list sentences about the seller, and do not list the call to action.",
  ].join("\n");
}

export function verifyUserPrompt(draft: Draft, signals: Signal[]): string {
  const byId = new Map(signals.map((signal) => [signal.id, signal]));
  const lines = draft.claims.map((claim: Claim, index) => {
    const signal = byId.get(claim.signalId);
    return `Claim ${index}: "${claim.text}"\n  Cited signal ${claim.signalId}: "${signal?.snippet ?? ""}"`;
  });
  return [...lines, "", `Email body:\n${draft.body}`].join("\n");
}
