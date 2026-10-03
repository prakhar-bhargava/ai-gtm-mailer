import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { timeAgo } from "@/lib/format";
import { listOutbox } from "@/lib/outbox";

export const dynamic = "force-dynamic";

export default function OutboxPage() {
  const items = listOutbox();
  return (
    <main className="mx-auto max-w-3xl">
      <PageHeader title="Outbox" description="Emails you approved. They are stored here and have not been delivered." />

      {items.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border bg-card p-8">
          <p className="font-medium">No emails yet</p>
          <p className="text-sm text-muted-foreground">Open a finished run, review the draft, and choose Save to Outbox.</p>
          <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
            Go to runs
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/outbox/${item.id}`} className="grid gap-0.5 px-5 py-4 hover:bg-secondary/50">
                <span className="flex items-baseline justify-between gap-4">
                  <span className="truncate font-medium">
                    {item.toName}, {item.toCompany}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">{timeAgo(item.sentAt)}</span>
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  <span className="text-foreground">{item.subject}</span>
                  {"  "}
                  {item.body.replace(/\s+/g, " ").slice(0, 120)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
