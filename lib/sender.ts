import { z } from "zod";
import defaults from "@/config/sender.json";

// Who an email is from, and the signature it ends with. Safe to use in the browser.
// Defaults come from config/sender.json; a rep's own copy is saved in the local database (lib/signature.ts).

export const Sender = z.object({
  signoff: z.string().trim().max(40).default("Best,"),
  name: z.string().trim().min(1, "Add your name").max(80),
  title: z.string().trim().max(80).default(""),
  phone: z.string().trim().max(40).default(""),
  company: z.string().trim().max(80).default(""),
  website: z.string().trim().max(80).default(""),
  // A calendar link (Calendly, Cal.com, Google appointment page). The "Card" mail design shows it as a button.
  bookingUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || /^https:\/\//.test(value), "The booking link must be an https:// link")
    .default(""),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || /^https:\/\//.test(value), "The logo must be an https:// link")
    .default(""),
});
export type Sender = z.infer<typeof Sender>;

export const DEFAULT_SENDER: Sender = Sender.parse(defaults);

// The plain-text signature: what Gmail's compose link and the Outbox carry.
export function signatureLines(sender: Sender): string[] {
  const company = [sender.company, sender.website].filter(Boolean).join(" · ");
  return [sender.signoff, sender.name, sender.title, sender.phone, company].filter(Boolean);
}
