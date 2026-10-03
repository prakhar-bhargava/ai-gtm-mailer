import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { RunView } from "@/components/run-view";
import { getEvents, getRun } from "@/lib/runs";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  const { prospect } = run;
  const isNew = run.status === "new";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="grid gap-2">
        <div className="flex gap-4 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">← New run</Link>
          <Link href="/dashboard" className="hover:text-zinc-900">Dashboard</Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{prospect.name}</h1>
          <span className="text-lg text-zinc-600">{prospect.company}</span>
          <Badge variant="secondary">Sample data</Badge>
        </div>
        <p className="text-xs text-zinc-400">Run {id}</p>
      </header>
      <RunView
        streamUrl={isNew ? `/api/runs/${id}/stream` : null}
        initialEvents={isNew ? [] : getEvents(id)}
      />
    </main>
  );
}
