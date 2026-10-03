// Sample signals for the draft step until the gather stages are connected.
// Every entry is fake and points at example.com. Do not use these for a real prospect.
export type SampleSignal = {
  id: string;
  claim: string;
  snippet: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
};

export const SAMPLE_SIGNALS: SampleSignal[] = [
  {
    id: "s1",
    claim: "Example Co has three open finance roles",
    snippet: "Open roles: Accounts Payable Lead, Financial Analyst, Procurement Specialist (sample)",
    sourceName: "Careers page (sample)",
    sourceUrl: "https://example.com/careers",
    publishedAt: null,
  },
  {
    id: "s2",
    claim: "Example Co opened a Singapore office",
    snippet: "Example Co opens a Singapore office to serve regional customers (sample)",
    sourceName: "News (sample)",
    sourceUrl: "https://example.com/news/singapore-office",
    publishedAt: "2026-09-15",
  },
];
