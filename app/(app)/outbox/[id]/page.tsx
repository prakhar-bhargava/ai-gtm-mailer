import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { GmailButton } from "@/components/gmail-button";
import { getOutboxItem } from "@/lib/outbox";
import { getSender } from "@/lib/signature";

export const dynamic = "force-dynamic";

// The saved message the way a mail client shows it: header lines, then the text exactly as stored.
export default async function OutboxItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getOutboxItem(id);
  if (!item) notFound();
  const sender = getSender();

  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/outbox" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          Outbox
        </Link>
        <div className="flex gap-2">
          <Link href={`/runs/${item.runId}`} className="inline-flex h-8 items-center rounded-full px-3 text-[13px] text-electric hover:bg-black/5">
            Open the run
          </Link>
          <CopyButton text={`Subject: ${item.subject}\n\n${item.body}`} label="Copy email" />
          <GmailButton to={item.toEmail} subject={item.subject} body={item.body} />
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-line bg-card">
        <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 border-b border-line px-6 py-5 text-sm sm:px-10">
          <dt className="text-muted-foreground">From</dt>
          <dd>
            {sender.name}
            {sender.company ? `, ${sender.company}` : ""}
          </dd>
          <dt className="text-muted-foreground">To</dt>
          <dd>
            {item.toName}, {item.toCompany}
            {item.toEmail && <span className="ml-2 font-mono text-[12px] text-muted-foreground">{item.toEmail}</span>}
          </dd>
          <dt className="text-muted-foreground">Subject</dt>
          <dd className="font-medium">{item.subject}</dd>
        </dl>
        <div className="max-w-[64ch] px-6 py-8 font-serif text-[19px] leading-[1.7] whitespace-pre-wrap sm:px-10 sm:text-[20px]">{item.body}</div>
      </article>

      <p className="text-sm text-muted-foreground">
        Saved {new Date(item.sentAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}. Not delivered by email.
      </p>
    </main>
  );
}
