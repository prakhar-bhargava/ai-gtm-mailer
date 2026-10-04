"use client";

import { Check, Copy, Mail, Pencil, TriangleAlert, Undo2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { pillClass } from "@/components/brand";
import { formatDate, hostOf } from "@/lib/format";
import { copyFormatted, openGmailDraft } from "@/lib/gmail";
import { checkMail } from "@/lib/mail-check";
import type { Claim, Draft, ProspectInput } from "@/lib/types";

// The draft shown as the email it will become. Each sourced sentence is underlined and numbered;
// the numbers match the source notes under the letter. Teal: the source supports it. Amber: check it.
// The main action opens it in Gmail compose, addressed and formatted; it is also saved to the Outbox.
export function DraftEditor({
  runId,
  prospect,
  draft,
  signature,
}: {
  runId: string;
  prospect: ProspectInput;
  draft: Draft;
  signature: string[];
}) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [toEmail, setToEmail] = useState(prospect.email ?? "");
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "sent">("idle");
  const [via, setVia] = useState<"gmail" | "outbox">("outbox");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullBody = `${body.trimEnd()}\n\n${signature.join("\n")}`;
  // Same rules the server enforces on Send (docs/09-mail-guardrails.md).
  const checks = checkMail(subject, fullBody);
  const unsupported = draft.claims.filter((claim) => !claim.supported);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail.trim());
  const blocked = checks.hard.length > 0 || !subject.trim() || !body.trim() || !emailValid;
  const edited = subject !== draft.subject || body !== draft.body;

  async function save(route: "gmail" | "outbox") {
    setVia(route);
    setState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body: fullBody, toEmail: toEmail.trim() }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save to the Outbox. Try again.");
      setState("sent");
    } catch (caught) {
      setState("idle");
      const reason = caught instanceof Error ? caught.message : "Could not save to the Outbox. Try again.";
      setError(route === "gmail" ? `Opened in Gmail, but the Outbox record failed: ${reason}` : reason);
    }
  }

  // Open the tab first, inside the click, so the browser doesn't block it; then record it in the Outbox.
  function openInGmail() {
    openGmailDraft({ to: toEmail, subject, body: fullBody });
    void save("gmail");
  }

  async function copy() {
    try {
      await copyFormatted(subject, body, signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("The browser blocked the clipboard. Select the text and copy it instead.");
    }
  }

  if (state === "sent") {
    return (
      <section className="grid gap-4 rounded-2xl border border-line bg-card p-6 sm:p-8">
        <p className="flex items-center gap-2 text-[20px] tracking-tight">
          <Check className="size-5 text-verified" aria-hidden />
          {via === "gmail" ? "Opened in Gmail and saved to the Outbox" : "Saved to the Outbox"}
        </p>
        <p className="text-[14px] text-muted-foreground">
          {via === "gmail"
            ? "Check the new Gmail tab: the recipient, subject and paragraphs are filled in. Nothing is sent until you press Send there."
            : "The email is stored in this app. It has not been delivered."}
        </p>
        <div className="flex flex-wrap gap-2">
          {via === "gmail" && (
            <button type="button" onClick={() => openGmailDraft({ to: toEmail, subject, body: fullBody })} className={pillClass("light", "sm")}>
              Open Gmail again
            </button>
          )}
          <Link href="/outbox" className={pillClass("light", "sm")}>
            Open the Outbox
          </Link>
          <Link href="/app" className={pillClass("dark", "sm")}>
            Research someone else
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white" aria-labelledby="draft-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-card px-5 py-3 sm:px-8">
        <h2 id="draft-heading" className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-muted-foreground">
          <span>
            To <span className="font-medium text-foreground">{prospect.name}</span>, {prospect.company}
          </span>
          {toEmail && <span className="font-mono text-[12px]">{toEmail}</span>}
        </h2>
        <button type="button" onClick={() => setEditing((open) => !open)} aria-pressed={editing} className={pillClass("ghost", "sm")}>
          {editing ? <Check className="size-3.5" aria-hidden /> : <Pencil className="size-3.5" aria-hidden />}
          {editing ? "Done editing" : "Edit"}
        </button>
      </div>

      <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8">
        {editing ? (
          <div className="grid gap-4">
            <EditField id="toEmail" label="Recipient email">
              <input
                id="toEmail"
                type="email"
                value={toEmail}
                onChange={(event) => setToEmail(event.target.value)}
                placeholder="name@company.com"
                aria-invalid={toEmail.length > 0 && !emailValid}
                className="h-10 rounded-xl border border-line bg-white px-3 text-[14px] outline-none focus-visible:border-electric"
              />
            </EditField>
            <EditField id="subject" label="Subject">
              <input
                id="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-10 rounded-xl border border-line bg-white px-3 text-[14px] outline-none focus-visible:border-electric"
              />
            </EditField>
            <EditField id="body" label="Message">
              <textarea
                id="body"
                rows={10}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2.5 font-serif text-[16px] leading-7 outline-none focus-visible:border-electric"
              />
            </EditField>
          </div>
        ) : (
          <article className="grid max-w-[62ch] gap-5 font-serif text-[16.5px] leading-[1.75]">
            <p className="font-sans text-[15px]">
              <span className="text-muted-foreground">Subject </span>
              <span className="font-medium">{subject}</span>
            </p>
            <div className="whitespace-pre-line">
              <Annotated body={body} claims={draft.claims} />
            </div>
          </article>
        )}

        <div className="grid gap-0.5 font-serif text-[15px] leading-6 text-muted-foreground">
          {signature.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>

        {draft.claims.length > 0 && (
          <ol className="grid gap-2 border-t border-line pt-5 text-[13px]">
            {draft.claims.map((claim, index) => (
              <SourceNote key={`${index}-${claim.text}`} claim={claim} n={index + 1} />
            ))}
          </ol>
        )}
      </div>

      <div className="grid gap-4 border-t border-line bg-card px-5 py-5 sm:px-8">
        <Checks
          hard={[...(emailValid ? [] : ["Add the recipient's email address (Edit)"]), ...checks.hard]}
          soft={[
            ...(unsupported.length
              ? [`${unsupported.length === 1 ? "One sourced sentence isn't" : `${unsupported.length} sourced sentences aren't`} fully backed by the source. See the amber ${unsupported.length === 1 ? "note" : "notes"} above.`]
              : []),
            // The run's own style notes, until the rep edits. Word counts come from the live check instead.
            ...(edited ? [] : draft.lintIssues.filter((issue) => !/word/i.test(issue)).map(sentence)),
            ...checks.soft,
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={openInGmail} disabled={blocked || state === "saving"} className={pillClass("blue")}>
            <Mail className="size-4" aria-hidden />
            {state === "saving" && via === "gmail" ? "Opening..." : "Open in Gmail"}
          </button>
          <button type="button" onClick={copy} className={pillClass("light")}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            <span aria-live="polite">{copied ? "Copied with formatting" : "Copy formatted"}</span>
          </button>
          <button type="button" onClick={() => void save("outbox")} disabled={blocked || state === "saving"} className={pillClass("ghost")}>
            {state === "saving" && via === "outbox" ? "Saving..." : "Save to Outbox only"}
          </button>
          {edited && (
            <button
              type="button"
              onClick={() => {
                setSubject(draft.subject);
                setBody(draft.body);
              }}
              className={pillClass("ghost")}
            >
              <Undo2 className="size-4" aria-hidden />
              Undo my edits
            </button>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground">
          Gmail opens a new message with the recipient, subject, paragraphs and signature filled in. Nothing is sent until you press Send in Gmail.
        </p>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function EditField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[12px] text-foreground/70">
        {label}
      </label>
      {children}
    </div>
  );
}

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Checks({ hard, soft }: { hard: string[]; soft: string[] }) {
  if (hard.length === 0 && soft.length === 0) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-verified">
        <Check className="size-4" aria-hidden />
        Passes every check
      </p>
    );
  }
  return (
    <ul className="grid gap-1.5 text-[13px]" aria-label="Checks before sending">
      {hard.map((issue) => (
        <li key={issue} className="flex gap-2 text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Fix before sending: </span>
            {issue}
          </span>
        </li>
      ))}
      {soft.map((issue) => (
        <li key={issue} className="flex gap-2 text-caution">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{issue}</span>
        </li>
      ))}
    </ul>
  );
}

function SourceNote({ claim, n }: { claim: Claim; n: number }) {
  return (
    <li className="grid grid-cols-[1.5rem_1fr] gap-x-1">
      <span className={`font-medium tabular-nums ${claim.supported ? "text-verified" : "text-caution"}`}>{n}</span>
      <span className="text-muted-foreground">
        <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-line underline-offset-2 hover:decoration-foreground">
          {claim.sourceName || hostOf(claim.sourceUrl)}
        </a>
        , {formatDate(claim.publishedAt)}.{" "}
        {claim.supported ? "Matches the source." : <span className="text-caution">The source doesn&apos;t fully back this. Check it or cut it.</span>}
      </span>
    </li>
  );
}

// Splits the body into plain text and claim sentences. A claim the rep has edited away simply stops
// being underlined; its source note stays below.
function Annotated({ body, claims }: { body: string; claims: Claim[] }) {
  const parts = useMemo(() => {
    const found: { start: number; end: number; n: number; supported: boolean }[] = [];
    claims.forEach((claim, index) => {
      const candidates = [claim.text.trim(), claim.text.trim().replace(/[.!?]$/, "")];
      for (const text of candidates) {
        const start = text ? body.indexOf(text) : -1;
        if (start >= 0) {
          const end = start + text.length;
          if (!found.some((range) => start < range.end && end > range.start)) {
            found.push({ start, end, n: index + 1, supported: claim.supported });
          }
          break;
        }
      }
    });
    found.sort((a, b) => a.start - b.start);
    const out: ReactNode[] = [];
    let cursor = 0;
    for (const range of found) {
      if (range.start > cursor) out.push(<Fragment key={`t${cursor}`}>{body.slice(cursor, range.start)}</Fragment>);
      out.push(
        <span
          key={`c${range.start}`}
          className={`underline decoration-2 underline-offset-4 ${
            range.supported ? "decoration-verified/50" : "bg-caution-soft decoration-caution/60"
          }`}
        >
          {body.slice(range.start, range.end)}
          <sup className={`ml-0.5 font-sans text-[11px] font-medium no-underline ${range.supported ? "text-verified" : "text-caution"}`}>
            {range.n}
          </sup>
        </span>,
      );
      cursor = range.end;
    }
    if (cursor < body.length) out.push(<Fragment key={`t${cursor}`}>{body.slice(cursor)}</Fragment>);
    return out;
  }, [body, claims]);
  return <>{parts}</>;
}
