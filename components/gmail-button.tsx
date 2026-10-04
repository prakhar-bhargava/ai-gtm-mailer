"use client";

import { Mail } from "lucide-react";
import { pillClass } from "@/components/brand";
import { openGmailDraft } from "@/lib/gmail";

// Opens a saved email in Gmail compose, addressed and with its paragraphs and signature intact.
export function GmailButton({ to, subject, body }: { to: string | null; subject: string; body: string }) {
  return (
    <button
      type="button"
      disabled={!to}
      title={to ? undefined : "This email has no recipient address saved"}
      onClick={() => to && openGmailDraft({ to, subject, body })}
      className={pillClass("blue", "sm")}
    >
      <Mail className="size-3.5" aria-hidden />
      Open in Gmail
    </button>
  );
}
