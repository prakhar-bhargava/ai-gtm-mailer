import { z } from "zod";
import { addToOutbox } from "@/lib/outbox";
import { getRun } from "@/lib/runs";

const SendInput = z.object({
  subject: z.string().trim().min(1, "The subject is empty"),
  body: z.string().trim().min(1, "The message is empty"),
});

// A human pressed Send. The message goes into the Outbox; it is never sent automatically.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) return Response.json({ error: "Run not found" }, { status: 404 });

  const parsed = SendInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const outboxId = addToOutbox({
    runId: id,
    toName: run.prospect.name,
    toCompany: run.prospect.company,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });
  return Response.json({ id: outboxId }, { status: 201 });
}
