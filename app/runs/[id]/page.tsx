import { notFound } from "next/navigation";
import { RunView } from "@/components/run-view";
import { signatureLines } from "@/lib/signature";
import { getEvents, getRun } from "@/lib/runs";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  const isNew = run.status === "new";
  return (
    <RunView
      runId={id}
      prospect={run.prospect}
      signature={signatureLines()}
      streamUrl={isNew ? `/api/runs/${id}/stream` : null}
      initialEvents={isNew ? [] : getEvents(id)}
    />
  );
}
