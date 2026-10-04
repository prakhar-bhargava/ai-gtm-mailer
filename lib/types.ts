import { z } from "zod";

// Shared shapes for the pipeline, the database, the stream and the UI.

export const StageId = z.enum([
  "identity",
  "news",
  "jobs",
  "company_site",
  "discover",
  "hooks",
  "draft",
  "verify",
  "run",
]);
export type StageId = z.infer<typeof StageId>;

export const ProspectInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  company: z.string().trim().min(1, "Company is required"),
  role: z.string().trim().optional(),
  domain: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")), // the recipient
  linkedinUrl: z.string().trim().optional(), // the person's profile: stored as a reference, never fetched
  companyLinkedinUrl: z.string().trim().optional(), // the company page: stored as a reference, never fetched
  notes: z.string().trim().optional(),
});
export type ProspectInput = z.infer<typeof ProspectInput>;

// What the New run form must collect. Older saved runs may lack website and email, so ProspectInput stays loose.
export const NewRunInput = ProspectInput.extend({
  domain: z.string().trim().min(3, "Add the company website"),
  email: z.string().trim().email("Enter the recipient's email address"),
});

// A public fact about the prospect or company. Every signal keeps its source, date and fetch time.
export const Signal = z.object({
  id: z.string(),
  type: z.enum(["news", "job", "company_site"]),
  claim: z.string(),
  snippet: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string(),
  publishedAt: z.string().nullable(), // null means undated
  fetchedAt: z.string(),
});
export type Signal = z.infer<typeof Signal>;

export const HookScores = z.object({
  relevance: z.number(), // 0 to 35
  recency: z.number(), // 0 to 20, from code
  specificity: z.number(), // 0 to 15
  seniority: z.number(), // 0 to 10
  verifiability: z.number(), // 0 to 10, from code
  authorship: z.number(), // 0 to 10, from code
  total: z.number(), // 0 to 100
});
export type HookScores = z.infer<typeof HookScores>;

export const Hook = z.object({
  id: z.string(),
  text: z.string(),
  signalIds: z.array(z.string()).min(1),
  pain: z.string(),
  whyNow: z.string(),
  scores: HookScores,
  blockedReason: z.string().nullable(), // set when the sensitivity gate removes the hook
  category: z.string().optional(), // the angle type from config/hook-lexicon.json, e.g. finance_hiring
});
export type Hook = z.infer<typeof Hook>;

// One factual sentence in the draft, tied to the signal it came from.
// Defaults let drafts saved by earlier versions of the app still open.
export const Claim = z.object({
  text: z.string(),
  signalId: z.string().default(""),
  sourceName: z.string(),
  sourceUrl: z.string(),
  publishedAt: z.string().nullable().default(null),
  supported: z.boolean().default(false), // set by the verify step
});
export type Claim = z.infer<typeof Claim>;

export const Draft = z.object({
  subject: z.string(),
  body: z.string(),
  claims: z.array(Claim),
  lintIssues: z.array(z.string()).default([]),
  hookId: z.string().optional(), // the angle the writer chose
  reason: z.string().optional(), // why it chose it
  caseletId: z.string().optional(), // the customer story it retold
});
export type Draft = z.infer<typeof Draft>;

export const Outcome = z.enum(["draft", "flagged", "abstained", "stopped"]);
export type Outcome = z.infer<typeof Outcome>;

// One page read from the company's own website by the crawler. Shown live in the run's findings feed.
export const CrawlPage = z.object({
  url: z.string(),
  kind: z.enum(["home", "about", "careers", "news", "other"]),
  title: z.string(),
  description: z.string().nullable(),
  headings: z.array(z.string()),
  excerpt: z.string().nullable(),
  facts: z.array(z.string()).default([]), // from the site's structured data, e.g. "Founded 2010"
  tech: z.array(z.string()).default([]), // tools the page loads, e.g. "HubSpot"
  linkCount: z.number(),
  ms: z.number(),
  via: z.enum(["browser", "html"]), // a real browser, or the plain-HTML fallback
});
export type CrawlPage = z.infer<typeof CrawlPage>;

// Things found along the way that are worth showing even when they don't become signals.
export const Finding = z.object({
  kind: z.enum(["profile", "job_board", "dated_item", "tech", "fact", "page_skipped", "headline_dropped"]),
  label: z.string(),
  url: z.string().nullable().default(null),
});
export type Finding = z.infer<typeof Finding>;

// What a run cost. Only model calls use quota; everything else is free.
export const Usage = z.object({
  modelCalls: z.number(),
  modelCallsSaved: z.number(), // answers reused from the cache
  inputTokens: z.number(),
  outputTokens: z.number(),
  thinkingTokens: z.number(),
  pagesRead: z.number(),
  pagesFromCache: z.number(),
  freeRequests: z.number(),
  freeRequestsFromCache: z.number(),
  hosts: z.record(z.string(), z.number()),
});
export type Usage = z.infer<typeof Usage>;

// Extra data a stage can attach to its event. The run view and the database both read it.
export const StagePayload = z.object({
  domain: z.string().optional(),
  signals: z.array(Signal).optional(),
  hooks: z.array(Hook).optional(),
  draft: Draft.optional(),
  outcome: Outcome.optional(),
  crawl: CrawlPage.optional(), // a page the crawler just read (progress events)
  findings: z.array(Finding).optional(),
  usage: Usage.optional(), // on the end-of-run event
  chosenReason: z.string().optional(), // why the writer picked the angle it used
});
export type StagePayload = z.infer<typeof StagePayload>;

export const StageEvent = z.object({
  stage: StageId,
  // progress: a note from inside a running step, such as a request or a wait for a free slot.
  status: z.enum(["started", "progress", "done", "failed"]),
  message: z.string(),
  durationMs: z.number().optional(),
  payload: StagePayload.optional(),
  at: z.string(),
});
export type StageEvent = z.infer<typeof StageEvent>;

// Shapes the LLM must return. Each is checked by generateJson before use.
const TAG = /\[s:[^\]]+\]/g;
export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

// The one model answer per run: which angle, why, and the email. Checked by generateJson before use.
export const writerAnswerSchema = (options: {
  hookIds: [string, ...string[]];
  signalIds: [string, ...string[]];
  caseletIds: [string, ...string[]];
  company: string;
  subjectWords: [number, number];
  bodyWords: [number, number];
}) =>
  z.object({
    chosenHookId: z.enum(options.hookIds),
    reason: z.string().min(1),
    caseletId: z.enum(options.caseletIds),
    subject: z
      .string()
      .refine(
        (subject) => wordCount(subject) >= options.subjectWords[0] && wordCount(subject) <= options.subjectWords[1],
        `must be ${options.subjectWords[0]} to ${options.subjectWords[1]} words`,
      )
      .refine((subject) => subject.toLowerCase().includes(options.company.toLowerCase()), `must name ${options.company}`),
    body: z.string().refine((body) => {
      const words = wordCount(body.replace(TAG, ""));
      return words >= options.bodyWords[0] && words <= options.bodyWords[1];
    }, `must be ${options.bodyWords[0]} to ${options.bodyWords[1]} words`),
    claims: z
      .array(z.object({ text: z.string().min(1), signalId: z.enum(options.signalIds) }))
      .min(1, "must cite at least one signal"),
  });
