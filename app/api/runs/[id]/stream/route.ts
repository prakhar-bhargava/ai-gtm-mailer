import { runPipeline } from "@/lib/pipeline";
import { appendEvent, getEvents, getRun, setRunStatus } from "@/lib/runs";
import type { StageEvent } from "@/lib/types";

export const maxDuration = 60;

const encoder = new TextEncoder();

function sse(events: StageEvent[] | ((send: (e: StageEvent) => void) => Promise<void>)) {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StageEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // The browser closed the stream. The run keeps going and its events stay in the database.
        }
      };
      if (typeof events === "function") {
        await events(send);
      } else {
        events.forEach(send);
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// A new run executes now and saves each event as it streams. A run that already started
// replays its saved events, so a reload shows the same result without running again.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) return Response.json({ error: "Run not found" }, { status: 404 });

  if (run.status !== "new") {
    return sse(getEvents(id));
  }

  setRunStatus(id, "running");
  return sse(async (send) => {
    const emit = (event: StageEvent) => {
      appendEvent(id, event);
      send(event);
    };
    try {
      await runPipeline(run.prospect, emit);
    } finally {
      // Runs that crash still end as "stopped", so the dashboard never shows them as running forever.
      const end = getEvents(id).find((event) => event.stage === "run");
      setRunStatus(id, "finished", end?.status === "done" ? "draft" : "stopped");
    }
  });
}
