import Link from "next/link";
import { notFound } from "next/navigation";
import { senderCompany, senderName, signatureLines } from "@/lib/signature";
import { getOutboxItem } from "@/lib/outbox";

export const dynamic = "force-dynamic";

// Shows the saved message the way a mail client would: header lines, paragraphs, then the signature.
export default async function OutboxItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getOutboxItem(id);
  if (!item) notFound();

  const paragraphs = item.body.split(/\n\s*\n/).filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <Link href="/outbox" className="text-sm text-zinc-500 hover:text-zinc-900">← Outbox</Link>

      <article className="grid gap-6 rounded-xl border border-zinc-200 bg-white p-8">
        <header className="grid gap-2 border-b border-zinc-100 pb-5 text-sm">
          <div className="grid grid-cols-[4rem_1fr] gap-y-1">
            <span className="text-zinc-500">From</span>
            <span className="text-zinc-900">{senderName} · {senderCompany}</span>
            <span className="text-zinc-500">To</span>
            <span className="text-zinc-900">{item.toName} · {item.toCompany}</span>
            <span className="text-zinc-500">Subject</span>
            <span className="font-medium text-zinc-900">{item.subject}</span>
          </div>
        </header>

        <div className="grid gap-4 text-[15px] leading-7 text-zinc-800">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">{paragraph}</p>
          ))}
        </div>

        <footer className="grid gap-0.5 pt-2 text-sm text-zinc-600">
          {signatureLines().map((line) => (
            <span key={line}>{line}</span>
          ))}
        </footer>
      </article>

      <p className="text-xs text-zinc-500">Saved {new Date(item.sentAt).toLocaleString()}. Not delivered by email.</p>
    </main>
  );
}
