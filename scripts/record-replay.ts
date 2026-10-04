// Records a real search as a replay in fixtures/replays, so it can be watched later without Gemini or
// any outside source. Needs GEMINI_API_KEY and network access.
// Usage: npx tsx scripts/record-replay.ts <name> "<label>" "<why>" "<contact name>" "<company>" <domain> ["<role>"]
// Use a placeholder contact name: replays must not invent facts about real people.
import fs from "node:fs";
import path from "node:path";
import { runPipeline } from "@/lib/pipeline/index";
import type { StageEvent } from "@/lib/types";

const [name, label, why, contact, company, domain, role] = process.argv.slice(2);
if (!name || !label || !why || !contact || !company || !domain) {
  console.error('Usage: npx tsx scripts/record-replay.ts <name> "<label>" "<why>" "<contact>" "<company>" <domain> ["<role>"]');
  process.exit(1);
}

const prospect = { name: contact, company, domain, role: role || undefined };
const events: StageEvent[] = [];
const recordedAt = new Date().toISOString();

void (async () => {
  const outcome = await runPipeline(prospect, (event) => {
    events.push(event);
    if (event.status === "done" || event.status === "failed") console.log(`[${event.stage}] ${event.status}: ${event.message}`);
  });
  const file = path.join(process.cwd(), "fixtures", "replays", `${name}.json`);
  const replay = {
    name,
    label,
    why,
    outcome,
    prospect,
    recordedAt,
    note: `Recorded from a real search on ${recordedAt.slice(0, 10)}. Replaying it makes no model or source calls.`,
    events,
  };
  fs.writeFileSync(file, `${JSON.stringify(replay, null, 2)}\n`);
  console.log(`Saved ${file} (${events.length} events, outcome ${outcome})`);
  process.exit(0);
})();
