"use client";

import { Check, Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, hostOf } from "@/lib/format";
import { checkMail } from "@/lib/mail-check";
import type { Claim, Draft, ProspectInput } from "@/lib/types";

// The draft shown as the email it will become. Each sourced sentence is underlined and numbered;
// the numbers match the source notes under the letter. Teal: the source supports it. Amber: check it.
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
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const fullBody = `${body.trimEnd()}\n\n${signature.join("\n")}`;
  // Same rules the server enforces on Send (docs/09-mail-guardrails.md).
  const checks = checkMail(subject, fullBody);
  const unsupported = draft.claims.filter((claim) => !claim.supported);
  const blocked = checks.hard.length > 0 || !subject.trim() || !body.trim();
  const edited = subject !== draft.subject || body !== draft.body;

  async function send() {
    setState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body: fullBody }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save to the Outbox. Try again.");
      setState("sent");
    } catch (caught) {
      setState("idle");
      setError(caught instanceof Error ? caught.message : "Could not save to the Outbox. Try again.");
    }
  }

  if (state === "sent") {
    return (
      <section className="grid gap-3 rounded-lg border border-border bg-card p-6 sm:p-8">
        <p className="flex items-center gap-2 text-lg font-semibold">
          <Check className="size-5 text-verified" aria-hidden />
          Saved to the Outbox
        </p>
        <p className="text-muted-foreground">The email is stored in this app. It has not been delivered.</p>
        <div className="flex gap-4 text-sm">
          <Link href="/outbox" className="font-medium text-primary hover:underline">
            Open the Outbox
          </Link>
          <Link href="/" className="font-medium text-primary hover:underline">
            Research someone else
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="draft-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3 sm:px-8">
        <h2 id="draft-heading" className="text-sm text-muted-foreground">
          To <span className="font-medium text-foreground">{prospect.name}</span>, {prospect.company}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setEditing((open) => !open)} aria-pressed={editing}>
          {editing ? <Check aria-hidden /> : <Pencil aria-hidden />}
          {editing ? "Done editing" : "Edit"}
        </Button>
      </div>

      <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8">
        {editing ? (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={9}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="font-serif text-[16px] leading-7"
              />
            </div>
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
          <ol className="grid gap-2 border-t border-border pt-5 text-sm">
            {draft.claims.map((claim, index) => (
              <SourceNote key={`${index}-${claim.text}`} claim={claim} n={index + 1} />
            ))}
          </ol>
        )}
      </div>

      <div className="grid gap-3 border-t border-border bg-secondary/40 px-5 py-4 sm:px-8">
        <Checks
          hard={checks.hard}
          soft={[
            ...(unsupported.length
              ? [`${unsupported.length === 1 ? "One sourced sentence isn't" : `${unsupported.length} sourced sentences aren't`} fully backed by the source. See the amber ${unsupported.length === 1 ? "note" : "notes"} above.`]
              : []),
            // The run's own style notes, until the rep edits. Word counts come from the live check instead.
            ...(edited ? [] : draft.lintIssues.filter((issue) => !/word/i.test(issue)).map(sentence)),
            ...checks.soft,
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" className="h-10 px-5" onClick={send} disabled={blocked || state === "saving"}>
            {state === "saving" ? "Saving..." : "Save to Outbox"}
          </Button>
          {edited && (
            <Button
              variant="ghost"
              size="lg"
              className="h-10"
              onClick={() => {
                setSubject(draft.subject);
                setBody(draft.body);
              }}
            >
              Undo my edits
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Nothing is emailed. You can copy it from the Outbox.</span>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Checks({ hard, soft }: { hard: string[]; soft: string[] }) {
  if (hard.length === 0 && soft.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-verified">
        <Check className="size-4" aria-hidden />
        Passes every check
      </p>
    );
  }
  return (
    <ul className="grid gap-1.5 text-sm" aria-label="Checks before saving">
      {hard.map((issue) => (
        <li key={issue} className="flex gap-2 text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Fix to save: </span>
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
        <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground">
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
