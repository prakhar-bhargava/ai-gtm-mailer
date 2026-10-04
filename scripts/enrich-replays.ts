// Adds real website-crawl events (pages read, links and posts found) to the recorded test flows, so their
// replays show the same live research feed as a real run. Only "progress" events are added: recorded
// signals, angles and drafts are untouched, so signal ids and claim links stay valid.
// Run: npx tsx scripts/enrich-replays.ts
import fs from "node:fs";
import path from "node:path";
import { newContext, runStage } from "@/lib/pipeline/stage";
import { companySite } from "@/lib/pipeline/stages/company-site";
import { discover } from "@/lib/pipeline/stages/discover";
import { identity } from "@/lib/pipeline/stages/identity";
import type { StageEvent } from "@/lib/types";

const DIR = path.join(process.cwd(), "fixtures", "replays");

async function enrich(file: string) {
  const full = path.join(DIR, file);
  const replay = JSON.parse(fs.readFileSync(full, "utf8"));
  const original: StageEvent[] = replay.events.filter((event: StageEvent) => !(event.status === "progress" && event.payload && (event.payload.crawl || event.payload.findings)));
  const captured: StageEvent[] = [];
  const ctx = newContext(replay.prospect);
  for (const spec of [identity, companySite, discover]) {
    await runStage(spec, ctx, (event) => {
      if (event.status === "progress" && event.payload && (event.payload.crawl || event.payload.findings)) captured.push(event);
    });
  }

  // Place each captured event inside its stage's recorded window, spread evenly between start and finish.
  const events = [...original];
  for (const stage of ["identity", "company_site", "discover"] as const) {
    const mine = captured.filter((event) => event.stage === stage);
    const start = events.findIndex((event) => event.stage === stage && event.status === "started");
    const end = events.findIndex((event, index) => index > start && event.stage === stage && (event.status === "done" || event.status === "failed"));
    if (start < 0 || end < 0 || mine.length === 0) continue;
    const t0 = Date.parse(events[start].at);
    const t1 = Date.parse(events[end].at);
    const placed = mine.map((event, index) => ({ ...event, at: new Date(t0 + ((t1 - t0) * (index + 1)) / (mine.length + 1)).toISOString() }));
    events.splice(end, 0, ...placed);
  }
  replay.events = events;
  replay.note = `${String(replay.note).replace(/ Website pages added from a crawl on .*$/, "")} Website pages added from a crawl on ${new Date().toISOString().slice(0, 10)}.`;
  fs.writeFileSync(full, `${JSON.stringify(replay, null, 2)}\n`);
  console.log(`${file}: added ${captured.length} crawl events`);
}

(async () => {
  for (const file of fs.readdirSync(DIR).filter((name) => name.endsWith(".json"))) {
    try {
      await enrich(file);
    } catch (error) {
      console.log(`${file}: skipped (${error instanceof Error ? error.message : error})`);
    }
  }
  process.exit(0);
})();
