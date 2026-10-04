"use client";

import { ArrowRight, ChevronDown, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { PillButton } from "@/components/brand";
import { StatusPill } from "@/components/status-pill";
import type { Outcome } from "@/lib/types";

export type CaseCard = {
  id: string;
  group: "happy" | "look";
  company: string;
  title: string;
  why: string;
  expected: Outcome | null; // null for a case that is planned but not built
  replay: string | null; // recorded run to watch
  input: Record<string, string> | null; // details to fill in for a live run
};

const REQUIRED = [
  { id: "name", label: "Name", placeholder: "Priya Shah", type: "text", autoComplete: "off" },
  { id: "company", label: "Organisation", placeholder: "Northwind Payments", type: "text", autoComplete: "organization" },
  { id: "domain", label: "Website", placeholder: "northwindpayments.com", type: "text", autoComplete: "url" },
  { id: "email", label: "Recipient email", placeholder: "priya@northwindpayments.com", type: "email", autoComplete: "off" },
] as const;

export function RunForm({ cases = [] }: { cases?: CaseCard[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filled, setFilled] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields: Record<string, string> = {};
    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === "string" && value.trim()) fields[key] = value.trim();
    }
    const missing = REQUIRED.filter((field) => !fields[field.id]).map((field) => field.label.toLowerCase());
    if (missing.length) {
      setError(`Add the ${missing.join(", ")}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) throw new Error(body.error ?? "Could not start the run. Try again.");
      router.push(`/runs/${body.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the run. Try again.");
      setBusy(false);
    }
  }

  // Fills the form from a case, leaving the recipient email for the rep (sample contacts are placeholders).
  function fillFrom(card: CaseCard) {
    const form = formRef.current;
    if (!form || !card.input) return;
    for (const [key, value] of Object.entries(card.input)) {
      const input = form.elements.namedItem(key) as HTMLInputElement | null;
      if (input) input.value = value;
    }
    if (card.input.role) setShowDetails(true);
    setFilled(card.company);
    const email = form.elements.namedItem("email") as HTMLInputElement | null;
    email?.focus();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const groups: { id: CaseCard["group"]; title: string; note: string }[] = [
    { id: "happy", title: "Happy paths", note: "What a good run looks like." },
    { id: "look", title: "Cases to look at", note: "Where the system has to behave differently." },
  ];

  return (
    <div className="grid gap-10">
      <form ref={formRef} onSubmit={onSubmit} className="grid gap-5 rounded-2xl border border-line bg-card p-5 sm:p-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {REQUIRED.map((field, index) => (
            <Field key={field.id} {...field} required autoFocus={index === 0} />
          ))}
        </div>

        <div id="more-details" hidden={!showDetails} className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <Field id="role" label="Role" placeholder="Head of Finance" />
          <Field id="linkedinUrl" label="Their LinkedIn" placeholder="linkedin.com/in/..." hint="Cited as the source of what you paste below." />
          <Field id="companyLinkedinUrl" label="Company LinkedIn" placeholder="linkedin.com/company/..." hint="Saved for reference. Never opened." />
          <div className="grid gap-1.5 sm:col-span-3">
            <label htmlFor="linkedinText" className="text-[12px] text-foreground/70">
              Paste from their LinkedIn
            </label>
            <textarea
              id="linkedinText"
              name="linkedinText"
              rows={4}
              maxLength={4000}
              placeholder={"Their headline, About section or a recent post. Leave a blank line between pieces.\n\nThe app never opens LinkedIn itself: what you paste is ranked and checked like any other source."}
              className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none placeholder:text-foreground/35 focus-visible:border-electric"
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-3">
            <label htmlFor="notes" className="text-[12px] text-foreground/70">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Anything you already know about them"
              className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none placeholder:text-foreground/35 focus-visible:border-electric"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowDetails((open) => !open)}
            aria-expanded={showDetails}
            aria-controls="more-details"
            className="flex items-center gap-1 text-[13px] text-foreground/65 hover:text-foreground"
          >
            <ChevronDown className={`size-4 transition-transform ${showDetails ? "rotate-180" : ""}`} aria-hidden />
            {showDetails ? "Fewer details" : "Add role, LinkedIn text or notes"}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {filled && <span className="font-mono text-[11px] text-foreground/60">Filled from {filled}. Add the recipient email.</span>}
            {error && (
              <p role="alert" className="text-[13px] text-destructive">
                {error}
              </p>
            )}
            <PillButton type="submit" disabled={busy}>
              {busy ? "Starting..." : "Research and draft"}
              {!busy && <ArrowRight className="size-4" aria-hidden />}
            </PillButton>
          </div>
        </div>
      </form>

      {cases.length > 0 && (
        <section aria-labelledby="cases-heading" className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="grid gap-1">
              <h2 id="cases-heading" className="text-[20px] tracking-tight">
                Try a case
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Recorded runs replay step by step with no model or network calls. Use the details to run one live.
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            {groups.map((group) => (
              <div key={group.id} className="grid content-start gap-3">
                <p className="flex items-baseline gap-2">
                  <span className="text-[14px] font-medium">{group.title}</span>
                  <span className="text-[12px] text-muted-foreground">{group.note}</span>
                </p>
                <ul className={`grid gap-3 ${group.id === "look" ? "sm:grid-cols-2" : ""}`}>
                  {cases
                    .filter((card) => card.group === group.id)
                    .map((card) => (
                      <li key={card.id}>
                        <CaseTile card={card} onUse={() => fillFrom(card)} />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CaseTile({ card, onUse }: { card: CaseCard; onUse: () => void }) {
  const planned = card.expected === null;
  return (
    <article
      className={`grid h-full content-between gap-4 rounded-2xl p-4 ${planned ? "border border-dashed border-foreground/25" : "border border-line bg-card"}`}
    >
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[11px] text-foreground/55">{card.company}</span>
          {planned ? (
            <span className="rounded-full bg-foreground/[0.07] px-2 py-0.5 font-mono text-[10px] text-foreground/60">Planned</span>
          ) : (
            <StatusPill status="finished" outcome={card.expected} />
          )}
        </div>
        <h3 className="text-[15px] leading-snug font-medium">{card.title}</h3>
        <p className="text-[13px] leading-5 text-muted-foreground">{card.why}</p>
      </div>
      {!planned && (
        <div className="flex flex-wrap items-center gap-2">
          {card.replay && (
            <a href={`/replay/${card.replay}?live=1`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 font-mono text-[11px] text-background hover:bg-foreground/85">
              <Play className="size-3" aria-hidden />
              Watch it run
            </a>
          )}
          {card.input && (
            <button type="button" onClick={onUse} className="inline-flex h-8 items-center rounded-full border border-foreground/15 bg-white px-3.5 font-mono text-[11px] hover:border-foreground/40">
              Use these details
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function Field({
  id,
  label,
  hint,
  ...input
}: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-[12px] text-foreground/70">
        {label}
        {input.required && <span className="sr-only"> (required)</span>}
      </label>
      <input
        id={id}
        name={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-11 rounded-xl border border-line bg-white px-3.5 text-[14px] outline-none placeholder:text-foreground/35 focus-visible:border-electric"
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
