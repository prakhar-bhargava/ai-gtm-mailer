import { createRun, listRuns } from "@/lib/runs";
import { ProspectInput } from "@/lib/types";

// Saves a new run. The run starts when its stream is opened, from the run page.
export async function POST(request: Request) {
  const parsed = ProspectInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  return Response.json({ id: createRun(parsed.data) }, { status: 201 });
}

export function GET() {
  return Response.json({ runs: listRuns() });
}
