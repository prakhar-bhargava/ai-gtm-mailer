import Link from "next/link";
import { notFound } from "next/navigation";
import { RunView } from "@/components/run-view";
import { SendPanel } from "@/components/send-panel";
import { signatureLines } from "@/lib/signature";
import { getEvents, getRun } from "@/lib/runs";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  const { prospect } = run;
  const isNew = run.status === "new";
  const events = isNew ? [] : getEvents(id);
  // The last draft written by the run, if there is one.
  const draft = [...events].reverse().find((event) => event.payload?.draft)?.payload?.draft;

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
        </div>
      </header>
      <RunView
        streamUrl={isNew ? `/api/runs/${id}/stream` : null}
        initialEvents={isNew ? [] : events}
      />
      {draft && run.status === "finished" && (
        <SendPanel runId={id} subject={draft.subject} body={draft.body} signature={signatureLines()} />
      )}
    </main>
  );
}
