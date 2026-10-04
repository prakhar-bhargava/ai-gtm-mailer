"use client";

import { useState } from "react";
import { DraftEditor } from "@/components/send-panel";
import { Section } from "@/components/section";
import templates from "@/config/templates.json";
import type { Draft, ProspectInput } from "@/lib/types";

// Fills the placeholders and returns a draft the editor can use. Templates have no claims, so no source notes appear.
function fill(text: string, prospect: ProspectInput): string {
  const firstName = prospect.name.split(/\s+/)[0] ?? prospect.name;
  return text.replaceAll("{first_name}", firstName).replaceAll("{company}", prospect.company);
}

// Shown when a search has no usable reason to write. The rep picks a generic email and reviews it like any other draft.
export function TemplateChooser({
  runId,
  prospect,
  signature,
}: {
  runId: string;
  prospect: ProspectInput;
  signature: string[];
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const template = templates.templates.find((item) => item.id === chosen);

  if (template) {
    const draft: Draft = {
      subject: fill(template.subject, prospect),
      body: fill(template.body, prospect),
      claims: [],
      lintIssues: [],
    };
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Template: {template.label}. Review it before saving.</p>
          <button type="button" onClick={() => setChosen(null)} className="text-sm text-primary hover:underline">
            Choose another
          </button>
        </div>
        <DraftEditor key={template.id} runId={runId} prospect={prospect} draft={draft} signature={signature} />
      </div>
    );
  }

  return (
    <Section title="Use a generic template" description="No research to lean on? Pick a general email. You review and edit it before it is saved.">
      <ul className="grid gap-2 sm:grid-cols-3">
        {templates.templates.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setChosen(item.id)}
              className="grid h-full w-full gap-1 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-sm text-muted-foreground">{item.subject}</span>
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
