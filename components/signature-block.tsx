"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { pillClass } from "@/components/brand";
import type { Sender } from "@/lib/sender";

const FIELDS: { key: keyof Sender; label: string; placeholder: string }[] = [
  { key: "signoff", label: "Sign-off", placeholder: "Best," },
  { key: "name", label: "Name", placeholder: "Your name" },
  { key: "title", label: "Title", placeholder: "Account executive" },
  { key: "phone", label: "Phone", placeholder: "+91 98..." },
  { key: "company", label: "Company", placeholder: "Zamp" },
  { key: "website", label: "Website", placeholder: "zamp.ai" },
  { key: "logoUrl", label: "Logo link (https)", placeholder: "https://..." },
  { key: "bookingUrl", label: "Booking link (https, for the Card design)", placeholder: "https://cal.com/..." },
];

// The signature under every draft, with the company logo. "Edit signature" changes it for every
// future draft and the Outbox; it's saved on the server, not in this browser.
export function SignatureBlock({ sender, onSaved }: { sender: Sender; onSaved: (sender: Sender) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(sender);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(method: "PUT" | "DELETE") {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/sender", {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PUT" ? JSON.stringify(form) : undefined,
      });
      const result = (await response.json()) as Sender & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Couldn't save the signature");
      onSaved(result);
      setForm(result);
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save the signature");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form
        className="grid gap-3 rounded-2xl border border-line bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save("PUT");
        }}
      >
        <p className="text-[13px] text-muted-foreground">Your signature, used on every draft and in the Outbox.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className={`grid gap-1 text-[12px] text-foreground/70 ${field.key === "logoUrl" || field.key === "bookingUrl" ? "sm:col-span-2" : ""}`}>
              {field.label}
              <input
                value={form[field.key]}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                placeholder={field.placeholder}
                className="h-10 rounded-xl border border-line bg-white px-3 text-[15px] text-foreground outline-none focus-visible:border-electric"
              />
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className={pillClass("dark", "sm")}>
            {saving ? "Saving..." : "Save signature"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className={pillClass("ghost", "sm")}>
            Cancel
          </button>
          <button type="button" onClick={() => void save("DELETE")} className={pillClass("ghost", "sm")}>
            Reset to default
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group grid gap-3">
      <p className="font-serif text-[18px] text-foreground/80">{sender.signoff}</p>
      <div className="flex items-start gap-3">
        {sender.logoUrl && (
          // A plain img: the logo is on another site and is shown as-is, the way the email will show it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sender.logoUrl} alt={sender.company} width={40} height={40} className="size-10 rounded-lg border border-line bg-white object-contain" />
        )}
        <div className="grid text-[15px] leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">{sender.name}</span>
          {sender.title && <span>{sender.title}</span>}
          {sender.phone && <span className="tabular-nums">{sender.phone}</span>}
          <span>
            {sender.company}
            {sender.website && (
              <>
                {" · "}
                <span className="text-electric">{sender.website}</span>
              </>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(sender);
            setEditing(true);
          }}
          className={`${pillClass("ghost", "sm")} ml-auto`}
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit signature
        </button>
      </div>
    </div>
  );
}
