import rubric from "@/config/rubric.json";
import { wordCount } from "@/lib/types";

// Style checks from docs/06. Word count is already enforced by the draft schema.
export function lintDraft(subject: string, body: string): string[] {
  const issues: string[] = [];
  const text = `${subject}\n${body}`.toLowerCase();

  for (const phrase of rubric.bannedPhrases) {
    if (text.includes(phrase)) issues.push(`uses the stock phrase "${phrase}"`);
  }
  if (body.includes("!")) issues.push("contains an exclamation mark");
  const questions = (body.match(/\?/g) ?? []).length;
  if (questions > 1) issues.push(`asks ${questions} questions; the rule is one`);
  if (/\d+(\.\d+)?\s*(x|times|%)/i.test(body) && /(faster|cheaper|more|less|reduc|increase|save)/i.test(body)) {
    issues.push("may contain an ROI figure, which the rules don't allow");
  }
  if (wordCount(subject) > 4) issues.push("subject is longer than 4 words");
  const words = wordCount(body);
  if (words < 50 || words > 100) issues.push(`body is ${words} words; the target is 50 to 100`);
  return issues;
}
