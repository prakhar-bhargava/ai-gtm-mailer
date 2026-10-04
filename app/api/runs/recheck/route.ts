import { recheckFlaggedRuns } from "@/lib/rescore";

// Re-applies today's "ready to review" rule to flagged runs. Only runs that pass every check move.
export function POST() {
  const { checked, changed } = recheckFlaggedRuns(true);
  return Response.json({ checked, changed });
}
