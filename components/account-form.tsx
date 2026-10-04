"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/section";

// Adds a website, a LinkedIn page, or a person to an account. Saves through /api/accounts, then refreshes the list.
export function AccountForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const withPerson = value("personName") !== "";
    const payload = {
      company: value("company"),
      domain: value("domain"),
      companyLinkedinUrl: value("companyLinkedinUrl"),
      person: withPerson
        ? { name: value("personName"), role: value("role"), email: value("email"), linkedinUrl: value("personLinkedinUrl") }
        : undefined,
    };
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save. Try again.");
      setSaved(true);
      event.currentTarget.reset();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Add details" description="Add a website or LinkedIn page to a company, or a person at it. LinkedIn links are saved for reference only.">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field id="company" label="Company" required />
        <Field id="domain" label="Website" placeholder="acme.com" />
        <Field id="companyLinkedinUrl" label="Company LinkedIn" placeholder="linkedin.com/company/..." />
        <Field id="personName" label="Person" placeholder="Priya Shah" />
        <Field id="role" label="Role" placeholder="Head of Finance" />
        <Field id="email" label="Email" type="email" placeholder="name@company.com" />
        <Field id="personLinkedinUrl" label="Their LinkedIn" placeholder="linkedin.com/in/..." />
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save details"}
          </Button>
          {saved && <span className="text-sm text-verified">Saved.</span>}
          {error && (
            <span role="alert" className="text-sm text-destructive">
              {error}
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

function Field({ id, label, ...input }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-10" {...input} />
    </div>
  );
}
