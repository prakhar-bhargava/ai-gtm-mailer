import { rerunFlaggedProspects } from "@/lib/rescore";

// Starts a fresh run, with the current pipeline, for each prospect whose latest run was flagged or stopped.
// The runs execute one after another on the server; their pages follow them live.
export function POST() {
  return Response.json(rerunFlaggedProspects(), { status: 202 });
}
