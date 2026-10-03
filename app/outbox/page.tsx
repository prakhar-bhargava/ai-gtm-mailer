import Link from "next/link";
import { Section } from "@/components/section";
import { listOutbox } from "@/lib/outbox";

export const dynamic = "force-dynamic";

export default function OutboxPage() {
  const items = listOutbox();
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="grid gap-2">
        <div className="flex gap-4 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">← New run</Link>
          <Link href="/dashboard" className="hover:text-zinc-900">Dashboard</Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Outbox</h1>
        <p className="text-zinc-600">Messages you sent from this app. They are saved here and have not been delivered by email.</p>
      </header>

      {items.length === 0 ? (
        <Section>
          <p className="text-sm text-zinc-600">Nothing here yet. Review a draft and press Send to add it.</p>
        </Section>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/outbox/${item.id}`} className="grid gap-1 rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
                <span className="font-medium text-zinc-900">{item.subject}</span>
                <span className="text-sm text-zinc-600">
                  To {item.toName} at {item.toCompany}
                </span>
                <span className="text-xs text-zinc-500">{new Date(item.sentAt).toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
