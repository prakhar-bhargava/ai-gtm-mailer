import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { getOutboxItem } from "@/lib/outbox";
import { senderCompany, senderName } from "@/lib/signature";

export const dynamic = "force-dynamic";

// The saved message the way a mail client shows it: header lines, then the text exactly as stored.
export default async function OutboxItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getOutboxItem(id);
  if (!item) notFound();

  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/outbox" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          Outbox
        </Link>
        <div className="flex gap-2">
          <Link href={`/runs/${item.runId}`} className="inline-flex h-8 items-center rounded-lg px-3 text-sm text-primary hover:bg-secondary">
            Open the run
          </Link>
          <CopyButton text={`Subject: ${item.subject}\n\n${item.body}`} label="Copy email" />
        </div>
      </div>

      <article className="overflow-hidden rounded-lg border border-border bg-card">
        <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 border-b border-border px-6 py-5 text-sm sm:px-10">
          <dt className="text-muted-foreground">From</dt>
          <dd>
            {senderName}, {senderCompany}
          </dd>
          <dt className="text-muted-foreground">To</dt>
          <dd>
            {item.toName}, {item.toCompany}
          </dd>
          <dt className="text-muted-foreground">Subject</dt>
          <dd className="font-medium">{item.subject}</dd>
        </dl>
        <div className="max-w-[62ch] px-6 py-8 font-serif text-[16.5px] leading-[1.75] whitespace-pre-wrap sm:px-10">{item.body}</div>
      </article>

      <p className="text-sm text-muted-foreground">
        Saved {new Date(item.sentAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}. Not delivered by email.
      </p>
    </main>
  );
}
