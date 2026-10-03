"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Section } from "@/components/section";

export function SendPanel({
  runId,
  subject: initialSubject,
  body: initialBody,
  signature,
}: {
  runId: string;
  subject: string;
  body: string;
  signature: string[];
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [state, setState] = useState<"editing" | "saving" | "sent" | "error">("editing");
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    setState("saving");
    setMessage(null);
    try {
      const response = await fetch(`/api/runs/${runId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save to the Outbox");
      setState("sent");
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Could not save to the Outbox");
    }
  }

  if (state === "sent") {
    return (
      <Section title="Sent to the Outbox">
        <p className="text-sm text-zinc-600">
          The message is saved in this app&apos;s Outbox. It has not been delivered by email.
        </p>
        <Link href="/outbox" className="w-fit text-sm font-medium text-zinc-900 underline underline-offset-2">
          Open the Outbox
        </Link>
      </Section>
    );
  }

  return (
    <Section title="Review and send">
      <div className="grid gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" rows={8} value={body} onChange={(event) => setBody(event.target.value)} />
      </div>
      <div className="grid gap-1 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
        <span className="text-xs font-medium text-zinc-500">Signature</span>
        {signature.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={send} disabled={state === "saving" || !subject.trim() || !body.trim()}>
          {state === "saving" ? "Saving..." : "Send"}
        </Button>
        <span className="text-xs text-zinc-500">Saves to the Outbox. Nothing is emailed.</span>
        {message && <p className="text-sm text-amber-700">{message}</p>}
      </div>
    </Section>
  );
}
