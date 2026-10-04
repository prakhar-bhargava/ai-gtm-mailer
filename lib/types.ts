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
});
export type Draft = z.infer<typeof Draft>;

export const Outcome = z.enum(["draft", "flagged", "abstained", "stopped"]);
export type Outcome = z.infer<typeof Outcome>;

// Extra data a stage can attach to its event. The run view and the database both read it.
export const StagePayload = z.object({
  domain: z.string().optional(),
  signals: z.array(Signal).optional(),
  hooks: z.array(Hook).optional(),
  draft: Draft.optional(),
  outcome: Outcome.optional(),
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

export const hookAnswerSchema = (signalIds: [string, ...string[]]) =>
  z.object({
    hooks: z
      .array(
        z.object({
          text: z.string().min(1),
          signalIds: z.array(z.enum(signalIds)).min(1),
          pain: z.string().min(1),
          whyNow: z.string().min(1),
          relevance: z.number().int().min(0).max(35),
          specificity: z.number().int().min(0).max(15),
          sensitiveReason: z.string().nullable(),
        }),
      )
      .min(1)
      .max(5),
  });

export const draftAnswerSchema = (signalIds: [string, ...string[]]) =>
  z.object({
    subject: z
      .string()
      .refine((subject) => wordCount(subject) >= 2 && wordCount(subject) <= 4, "must be 2 to 4 words"),
    body: z
      .string()
      // Hard limits only. The 50 to 100 target is checked by the style lint, so the rep sees it flagged
      // instead of the run failing over a few words.
      .refine((body) => {
        const words = wordCount(body.replace(TAG, ""));
        return words >= 35 && words <= 130;
      }, "must be about 50 to 100 words"),
    claims: z
      .array(z.object({ text: z.string().min(1), signalId: z.enum(signalIds) }))
      .min(1, "must cite at least one signal"),
  });

// Which headlines are about this company and not one with the same name.
export const entityAnswerSchema = (count: number) =>
  z.object({
    sameCompany: z.array(z.number().int().min(0).max(count - 1)),
  });

export const verifyAnswerSchema = (count: number) =>
  z.object({
    results: z
      .array(z.object({ index: z.number().int().min(0).max(count - 1), supported: z.boolean(), evidence: z.string() }))
      .length(count),
    uncitedFacts: z.array(z.string()),
  });
