import sensitive from "@/config/sensitive-topics.json";

const patterns = sensitive.topics.map((topic) => ({
  topic,
  // Matches the start of a word, so "restructur" also catches "restructuring".
  regex: new RegExp(`\\b${topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
}));

// Returns the topic that matched, or null. Used as a second check after the model's own flag.
export function sensitiveTopicIn(text: string): string | null {
  const hit = patterns.find((pattern) => pattern.regex.test(text));
  return hit ? hit.topic : null;
}
