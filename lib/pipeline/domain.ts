// Turns what the rep typed into a website and the names a job board might use.

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

// A guess only: the identity step checks that the site answers and tells the rep it was guessed.
export function guessDomain(company: string): string {
  return `${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
}

// Likely job-board names for a company, most specific first. Each is tried on Greenhouse and Ashby.
export function boardSlugs(company: string, domain: string | null): string[] {
  const words = company
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const candidates = [
    words.join(""),
    words.join("-"),
    words[0],
    domain ? domain.split(".")[0] : undefined,
  ];
  return [...new Set(candidates.filter((slug): slug is string => Boolean(slug)))];
}
