import seller from "@/config/seller-brief.zamp.json";
import mailRules from "@/config/mail-rules.json";
import { approvedFigures, caseletFor } from "@/lib/proof";
import { categoryLabel } from "@/lib/pipeline/hook-candidates";
import type { Hook, ProspectInput, Signal } from "@/lib/types";

// The one model call in a run. Research, ranking and checking are done in code before and after it;
// the model only chooses among the top angles and writes the email.

function signalLine(signal: Signal): string {
  return `  - id ${signal.id} (${signal.type}, ${signal.sourceName}, ${signal.publishedAt ? signal.publishedAt.slice(0, 10) : "undated"}): ${signal.claim}${signal.snippet !== signal.claim ? `. Detail: ${signal.snippet}` : ""}`;
}

export function writerSystemPrompt(): string {
  const body = mailRules.body;
  return [
    `You write one cold outreach email for ${seller.seller}. Tone: ${seller.tone}`,
    `${seller.seller} sells: ${seller.offer}`,
    `Approved value line: "${seller.value_line}"`,
    `Approved figures (the only numbers about ${seller.seller} you may use): ${approvedFigures().join("; ")}.`,
    "",
    "You get up to three ranked angles about the prospect's company, each with its source signals and a customer story.",
    "Choose the angle that gives the most concrete, recent reason for a finance leader to reply. Prefer the first unless another is clearly more specific. Return its id and a reason under 25 words.",
    "",
    `Subject: ${mailRules.subject.minWords} to ${mailRules.subject.maxWords} words, actionable. Name the company and the fact or problem you saw, then what ${seller.seller} changes, using an approved figure.`,
    `Pattern: "<Company> is <the fact>: <outcome>". Examples: "Northwind is hiring three AP roles: an AI employee live in four days", "Northwind is expanding to Brazil: scale AP without adding headcount".`,
    "",
    "Body, in this order, paragraphs separated by one blank line:",
    "1. The greeting on its own line: \"Hi <first name>,\"",
    "2. The premise: one or two sentences stating the fact from the chosen angle, then the pain such a change usually brings a finance team. Say \"usually\" or \"often\": the pain is typical, not a known fact about them.",
    "3. The customer story for that angle, retold in one or two sentences close to its wording. Add no numbers, names or details to it.",
    `4. How ${seller.seller} helps: one or two sentences built on the value line, with at most the approved figures.`,
    "5. The call to action: one short interest question, such as \"Worth a short call next week?\"",
    `Length: ${body.targetMinWords} to ${body.targetMaxWords} words, never under ${body.hardMinWords}. Every sentence under ${body.maxSentenceWords} words. No sign-off or name at the end: the signature is added for you.`,
    "Plain text only: no markdown, bullets, links, emoji or exclamation marks. At most one question mark, in the call to action.",
    "",
    "Claims: every sentence that states a fact about the prospect's company goes in claims, with the id of the signal it comes from. Keep its wording close to the signal.",
    `Never: invent facts or numbers, name customers other than in the story given, give ROI multipliers, describe their volumes or workload as fact, open with stock phrases ("I hope this finds you well", "I noticed"), say how you found the information, or flatter.`,
  ].join("\n");
}

export function writerUserPrompt(prospect: ProspectInput, angles: Hook[], signals: Signal[], background: string[]): string {
  const firstName = prospect.name.trim().split(/\s+/)[0];
  const blocks = angles.map((hook, index) => {
    const cited = signals.filter((signal) => hook.signalIds.includes(signal.id));
    const story = caseletFor(hook.category);
    return [
      `Angle ${hook.id} (rank ${index + 1}, ${categoryLabel(hook.category ?? "other").toLowerCase()}, score ${hook.scores.total} of 100)`,
      `  Fact: ${hook.text}`,
      `  Typical pain: ${hook.pain}`,
      `  Why now: ${hook.whyNow}`,
      `  Customer story [${story.id}]: ${story.text}`,
      "  Signals:",
      ...cited.map(signalLine),
    ].join("\n");
  });
  return [
    `Prospect: ${prospect.name} (first name ${firstName})${prospect.role ? `, ${prospect.role}` : ""} at ${prospect.company}.`,
    prospect.notes ? `Rep's note: ${prospect.notes}` : "",
    "",
    ...blocks,
    "",
    background.length
      ? `What the company's own website says (for understanding only; do not state these as facts unless they are a signal above):\n${background.map((line) => `  - ${line}`).join("\n")}`
      : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
