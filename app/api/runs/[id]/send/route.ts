import { z } from "zod";
import { checkMail } from "@/lib/mail-check";
import { addToOutbox } from "@/lib/outbox";
import { getRun } from "@/lib/runs";

const SendInput = z.object({
  toEmail: z.string({ error: "Add the recipient's email address" }).trim().email("Add the recipient's email address"),
  subject: z.string({ error: "The subject is empty" }).trim().min(1, "The subject is empty"),
  body: z.string({ error: "The message is empty" }).trim().min(1, "The message is empty"),
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

  // Hard guardrails are enforced here too, not only in the browser.
  const style = checkMail(parsed.data.subject, parsed.data.body);
  if (style.hard.length > 0) {
    return Response.json({ error: `Fix before sending: ${style.hard[0]}`, issues: style.hard }, { status: 422 });
  }

  const outboxId = addToOutbox({
    runId: id,
    toName: run.prospect.name,
    toCompany: run.prospect.company,
    toEmail: parsed.data.toEmail,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });
  return Response.json({ id: outboxId }, { status: 201 });
}
