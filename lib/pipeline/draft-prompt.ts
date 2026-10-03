import seller from "@/config/seller-brief.zamp.json";
import type { ProspectInput } from "@/lib/types";
import type { SampleSignal } from "@/lib/pipeline/sample-signals";

export function draftSystemPrompt(): string {
  return [
    `You write a cold outreach email on behalf of ${seller.seller}. ${seller.offer}`,
    `Strongest proof point: ${seller.strongest_proof_point}.`,
    `Tone: ${seller.tone}`,
    "",
    "Structure: a premise (one factual sentence about the prospect's company, taken from a signal), then value (one or two sentences on the pain it implies and what the seller does about it), then a call to action that is an interest question such as 'Worth a look?'.",
    "Rules:",
    "- Subject: 2 to 4 words, lowercase is fine.",
    "- Body: 50 to 100 words.",
    "- Use only the signals you are given. Every factual sentence must appear in claims with the id of the signal that supports it.",
    "- No ROI numbers or multipliers, no stock openers such as 'I noticed you recently' or 'I hope this finds you well', no flattery, no exclamation marks, no emoji.",
    "- At most one question, the final call to action.",
    "- Do not say how the information was found (never say 'I saw on LinkedIn').",
    "- Do not invent facts. If the signals don't support a pitch, write the most general honest email you can and cite only what is supported.",
  ].join("\n");
}

export function draftUserPrompt(prospect: ProspectInput, signals: SampleSignal[]): string {
  const lines = [`Prospect: ${prospect.name}${prospect.role ? `, ${prospect.role}` : ""} at ${prospect.company}.`];
  if (prospect.notes) lines.push(`Rep's notes: ${prospect.notes}`);
  lines.push("", "Signals (use only these):");
  for (const signal of signals) {
    lines.push(
      `- id ${signal.id}: ${signal.claim}. Detail: ${signal.snippet}. Source: ${signal.sourceName}, published ${signal.publishedAt ?? "date unknown"}.`,
    );
  }
  return lines.join("\n");
}
