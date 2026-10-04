import rules from "@/config/mail-rules.json";

// Checks a mail body (without the signature) against docs/09-mail-guardrails.md. Pure functions, so the same check runs on the
// server (verify step, Send API) and in the browser (live checks while the rep edits).

export type MailCheck = {
  hard: string[]; // blocks Send
  soft: string[]; // shown as a warning
};

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

// Paragraphs are separated by a blank line. The signature block is not counted as a paragraph.
function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// company: the prospect's company, which the subject must name. approved: the seller's sourced figures
// (lib/proof.ts), the only numbers about the seller allowed in a mail.
export type MailContext = { company?: string; approved?: string[] };

export function checkMail(subject: string, body: string, context: MailContext = {}): MailCheck {
  const hard: string[] = [];
  const soft: string[] = [];
  const text = body.trim();
  const lower = `${subject}\n${text}`.toLowerCase();
  const company = context.company?.trim() ?? "";

  // Subject: actionable. It names the company and the fact, then the outcome.
  const subjectWords = words(subject);
  if (subjectWords < rules.subject.minWords || subjectWords > rules.subject.maxWords) {
    hard.push(`Subject is ${subjectWords} words; it should be ${rules.subject.minWords} to ${rules.subject.maxWords}`);
  }
  if (rules.subject.mustNameCompany && company && !subject.toLowerCase().includes(company.toLowerCase())) {
    hard.push(`Subject should name ${company} and what you saw there`);
  }
  const subjectLower = subject.toLowerCase();
  if (!rules.subject.outcomeWords.some((word) => subjectLower.includes(word))) {
    soft.push("Subject doesn't say what changes for them (for example \"live in four days\" or \"without adding headcount\")");
  }
  const shouting = (subject.match(/\b[A-Z]{4,}\b/g) ?? []).filter((word) => !company.toUpperCase().includes(word));
  if (/!/.test(subject) || shouting.length) {
    hard.push("Subject shouts: no capitals in words, no exclamation mark");
  }

  // Length
  const bodyWords = words(text);
  if (bodyWords < rules.body.hardMinWords || bodyWords > rules.body.hardMaxWords) {
    hard.push(`Message is ${bodyWords} words; it must be ${rules.body.hardMinWords} to ${rules.body.hardMaxWords}`);
  } else if (bodyWords < rules.body.targetMinWords || bodyWords > rules.body.targetMaxWords) {
    soft.push(`Message is ${bodyWords} words; aim for ${rules.body.targetMinWords} to ${rules.body.targetMaxWords}`);
  }

  // Paragraphs and sentences
  const parts = paragraphs(text);
  if (parts.length < rules.body.minParagraphs || parts.length > rules.body.maxParagraphs) {
    soft.push(`Message has ${parts.length} paragraphs; use ${rules.body.minParagraphs} to ${rules.body.maxParagraphs}`);
  }
  const longest = Math.max(
    0,
    ...text.split(/(?<=[.!?])\s+/).map((sentence) => words(sentence)),
  );
  if (longest > rules.body.maxSentenceWords) {
    soft.push(`A sentence has ${longest} words; keep sentences under ${rules.body.maxSentenceWords}`);
  }

  // Formatting: plain text only
  if (new RegExp(rules.markdownPattern, "m").test(text)) {
    hard.push("Plain text only: remove markdown such as bold, headings, bullets, backticks or links");
  }
  if (new RegExp(rules.urlPattern, "i").test(text)) {
    hard.push("No links in the message body");
  }
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text + subject)) {
    hard.push("No emoji");
  }
  if (text.includes("!")) {
    hard.push("No exclamation marks in the message");
  }

  // Questions: one call to action at most
  const questions = (text.match(/\?/g) ?? []).length;
  if (questions > rules.body.maxQuestions) {
    hard.push(`Asks ${questions} questions; the rule is ${rules.body.maxQuestions}`);
  }

  // Wording
  for (const phrase of rules.bannedPhrases) {
    if (lower.includes(phrase)) hard.push(`Uses the stock phrase "${phrase}"`);
  }
  for (const pattern of rules.howFoundPatterns) {
    if (new RegExp(pattern, "i").test(text)) {
      hard.push("Says how the information was found. Lead with the fact instead");
      break;
    }
  }
  // Approved, sourced figures are allowed; any other number about results is not.
  let unapproved = text;
  for (const phrase of context.approved ?? []) unapproved = unapproved.split(phrase).join(" ");
  if (new RegExp(rules.roiPattern, "i").test(unapproved)) {
    hard.push("Contains an ROI figure, which is not allowed");
  }
  const flattery = rules.flatteryWords.find((word) => new RegExp(`\\b${word}\\b`, "i").test(text));
  if (flattery) soft.push(`Flattering word "${flattery}"; state the fact and drop the praise`);

  // Greeting: first, on its own line
  if (!new RegExp(rules.greeting).test(text)) {
    hard.push("Start with a greeting on its own line, such as \"Hi Name,\"");
  }

  return { hard, soft };
}
