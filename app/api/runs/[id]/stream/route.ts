import type { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { ProspectInput, type StageEvent } from "@/lib/types";

// The run executes inside this request and streams each stage event as it happens.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const parsed = ProspectInput.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StageEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // The browser closed the stream; the run keeps going but nothing is sent.
        }
      };
      await runPipeline(parsed.data, send);
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
