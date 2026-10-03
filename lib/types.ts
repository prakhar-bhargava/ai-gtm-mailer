import { z } from "zod";

// Shared shapes for the pipeline, the stream and the UI.

export const StageId = z.enum([
  "identity",
  "news",
  "jobs",
  "company_site",
  "hooks",
  "draft",
  "run",
]);
export type StageId = z.infer<typeof StageId>;

// One factual sentence in the draft, tied to the source it came from.
export const Claim = z.object({
  text: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string(),
  publishedAt: z.string().nullable(),
});
export type Claim = z.infer<typeof Claim>;

export const Draft = z.object({
  subject: z.string(),
  body: z.string(),
  claims: z.array(Claim),
});
export type Draft = z.infer<typeof Draft>;

// What the model must return for the draft. Checked against the signal ids it was given.
// Tags such as [s:s1] are stripped from the body before display; the claims list keeps the link.
const TAG = /\[s:[^\]]+\]/g;
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

export const draftAnswerSchema = (signalIds: [string, ...string[]]) =>
  z.object({
    subject: z
      .string()
      .refine((subject) => wordCount(subject) >= 2 && wordCount(subject) <= 4, "must be 2 to 4 words"),
    body: z
      .string()
      .refine((body) => {
        const words = wordCount(body.replace(TAG, ""));
        return words >= 50 && words <= 100;
      }, "must be 50 to 100 words"),
    claims: z
      .array(z.object({ text: z.string().min(1), signalId: z.enum(signalIds) }))
      .min(1, "must cite at least one signal"),
  });

export const StageEvent = z.object({
  stage: StageId,
  status: z.enum(["started", "done", "failed"]),
  message: z.string(),
  durationMs: z.number().optional(),
  draft: Draft.optional(),
  at: z.string(),
});
export type StageEvent = z.infer<typeof StageEvent>;

// Query-string input from the new run form. Empty strings are allowed for optional fields.
export const ProspectInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  company: z.string().trim().min(1, "Company is required"),
  role: z.string().trim().optional(),
  domain: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type ProspectInput = z.infer<typeof ProspectInput>;
