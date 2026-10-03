import { runPipeline } from "@/lib/pipeline";
import { appendEvent, getEvents, getRun, setRunStatus } from "@/lib/runs";
import type { Outcome, StageEvent } from "@/lib/types";

export const maxDuration = 60;

const encoder = new TextEncoder();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Body = (send: (event: StageEvent) => void) => Promise<void>;

function sse(body: Body) {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StageEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // The browser closed the stream. The run keeps going and its events stay in the database.
        }
      };
      await body(send);
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

// Sends every saved event, then keeps sending new ones until the run finishes.
// Every connection starts from the first event, so a reload or a second tab sees the whole run.
async function tail(id: string, send: (event: StageEvent) => void) {
  let sent = 0;
  let idleSince = Date.now();
  for (;;) {
    // Read the status before the events: if the run is finished, all of its events are already saved.
    const finished = getRun(id)?.status !== "running";
    const events = getEvents(id);
    for (const event of events.slice(sent)) send(event);
    if (events.length > sent) idleSince = Date.now();
    sent = events.length;
    if (finished) return;
    // A run that stopped without finishing (for example after a server restart) must not hold the connection open.
    if (Date.now() - idleSince > STALL_MS) return;
    await sleep(500);
  }
}

const STALL_MS = 120_000;

// A new run executes now and saves each event as it streams. Any other connection follows the saved events.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) return Response.json({ error: "Run not found" }, { status: 404 });

  if (run.status !== "new") {
    return sse((send) => tail(id, send));
  }

  setRunStatus(id, "running");
  return sse(async (send) => {
    const emit = (event: StageEvent) => {
      appendEvent(id, event);
      send(event);
    };
    let outcome: Outcome = "stopped";
    try {
      outcome = await runPipeline(run.prospect, emit);
    } finally {
      // A run that crashes still ends as "stopped", so the dashboard never shows it as running forever.
      setRunStatus(id, "finished", outcome);
    }
  });
}
