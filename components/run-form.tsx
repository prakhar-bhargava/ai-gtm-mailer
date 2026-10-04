"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type SampleProspect = {
  id: string;
  label: string;
  input: Record<string, string>;
};

async function startRun(fields: Record<string, string>): Promise<string> {
  const response = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  const body = (await response.json()) as { id?: string; error?: string };
  if (!response.ok || !body.id) throw new Error(body.error ?? "Could not start the run. Try again.");
  return body.id;
}

export function RunForm({ samples = [] }: { samples?: SampleProspect[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // "form" or a sample id
  const [showDetails, setShowDetails] = useState(false);

  async function run(fields: Record<string, string>, source: string) {
    setBusy(source);
    setError(null);
    try {
      const id = await startRun(fields);
      router.push(`/runs/${id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the run. Try again.");
      setBusy(null);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields: Record<string, string> = {};
    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === "string" && value.trim()) fields[key] = value.trim();
    }
    if (!fields.name || !fields.company) {
      setError("Add the person's name and their company.");
      return;
    }
    void run(fields, "form");
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field id="name" label="Name" placeholder="Priya Shah" required autoFocus />
          <Field id="company" label="Company" placeholder="Acme Payments" required />
          <Button type="submit" size="lg" className="h-10 px-5" disabled={busy !== null}>
            {busy === "form" ? "Starting..." : "Research"}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((open) => !open)}
          aria-expanded={showDetails}
          aria-controls="more-details"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={`size-4 transition-transform ${showDetails ? "rotate-180" : ""}`} aria-hidden />
          {showDetails ? "Fewer details" : "Add email, role, website or notes"}
        </button>

        {/* Kept mounted so typed values survive closing the panel. */}
        <div id="more-details" hidden={!showDetails} className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <Field id="role" label="Role" placeholder="Head of Finance" />
          <Field id="email" type="email" label="Their email" placeholder="name@company.com" hint="Needed before a mail can be saved to the Outbox." />
          <Field id="domain" label="Company website" placeholder="acme.com" hint="Skips the website search and avoids mix-ups with similar names." />
          <Field id="linkedinUrl" label="Their LinkedIn" placeholder="linkedin.com/in/..." hint="Saved for reference. Never opened by the app." />
          <Field id="companyLinkedinUrl" label="Company LinkedIn" placeholder="linkedin.com/company/..." hint="Saved for reference. Never opened by the app." />
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Anything you already know about them" />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-caution">
            {error}
          </p>
        )}
      </form>

      {samples.length > 0 && (
        <section aria-labelledby="samples-heading" className="grid gap-3">
          <div className="grid gap-0.5">
            <h2 id="samples-heading" className="text-[15px] font-semibold">Sample prospects</h2>
            <p className="text-sm text-muted-foreground">Real companies with a placeholder contact. One click starts a run.</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {samples.map((sample) => (
              <li key={sample.id}>
                <button
                  type="button"
                  onClick={() => void run(sample.input, sample.id)}
                  disabled={busy !== null}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 disabled:opacity-60"
                >
                  <span className="grid gap-0.5">
                    <span className="font-medium">{sample.input.company}</span>
                    <span className="text-sm text-muted-foreground">{sample.label}</span>
                  </span>
                  <span className="text-sm font-medium text-primary">{busy === sample.id ? "Starting..." : "Run"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  ...input
}: { id: string; label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-10 bg-card" aria-describedby={hint ? `${id}-hint` : undefined} {...input} />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
