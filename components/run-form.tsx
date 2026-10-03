"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RunForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string" && value.trim()) fields[key] = value.trim();
    }
    if (!fields.name || !fields.company) {
      setError("Enter the prospect's name and company.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) throw new Error(body.error ?? "Could not save the run");
      router.push(`/runs/${body.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the run");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="name">Prospect name</Label>
        <Input id="name" name="name" placeholder="e.g. Sample Prospect" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" placeholder="e.g. Example Co" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">Role (optional)</Label>
        <Input id="role" name="role" placeholder="e.g. Head of Finance" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="domain">Company website (optional)</Label>
        <Input id="domain" name="domain" placeholder="e.g. example.com" />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="linkedinUrl">LinkedIn URL (optional, stored for reference only)</Label>
        <Input id="linkedinUrl" name="linkedinUrl" placeholder="https://www.linkedin.com/in/..." />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="notes">Notes for the rep (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Start run"}
        </Button>
        {error && <p className="text-sm text-amber-700">{error}</p>}
      </div>
    </form>
  );
}
