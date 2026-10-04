import { createReplayRun } from "@/lib/replay";

// Starts a recorded search as a new saved search, then opens it.
export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // ?live=1 plays the recording back step by step; without it, the finished search opens at once.
  const live = new URL(request.url).searchParams.get("live") === "1";
  const id = createReplayRun(name, { live });
  if (!id) return Response.json({ error: "No recorded search with that name" }, { status: 404 });
  return Response.redirect(new URL(`/runs/${id}`, request.url), 303);
}
