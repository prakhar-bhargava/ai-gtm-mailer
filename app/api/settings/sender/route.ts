import { Sender } from "@/lib/sender";
import { getSender, resetSender, saveSender } from "@/lib/signature";

export async function GET() {
  return Response.json(getSender());
}

// Saves the rep's signature. Used by "Edit signature" under every draft.
export async function PUT(request: Request) {
  const parsed = Sender.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid signature" }, { status: 400 });
  }
  return Response.json(saveSender(parsed.data));
}

export async function DELETE() {
  return Response.json(resetSender());
}
