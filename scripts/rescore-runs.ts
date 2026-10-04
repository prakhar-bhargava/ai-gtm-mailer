// Re-applies the current "ready to review" rule to saved runs, after a threshold change in config/rubric.json.
// Same as "Re-check flagged runs" on the dashboard. Stop the dev server first: two processes writing one
// SQLite file can corrupt it.
// Usage: npx tsx scripts/rescore-runs.ts          (dry run: lists what would change)
//        npx tsx scripts/rescore-runs.ts --apply  (writes the change)
import rubric from "@/config/rubric.json";
import { recheckFlaggedRuns } from "@/lib/rescore";

const apply = process.argv.includes("--apply");
const result = recheckFlaggedRuns(apply);
for (const line of result.lines) console.log(`${line.ready ? "ready now     " : "stays flagged "} ${line.company.padEnd(14)} score ${line.score}: ${line.reason}`);
console.log(`\n${result.checked} flagged runs checked; ${result.changed} ${apply ? "changed to" : "would change to"} ready to review (threshold ${rubric.thresholds.personalised}).`);
