import { sleep, type StageSpec } from "@/lib/pipeline/stage";

// Stub: returns fixed sample data. Replaced by the Greenhouse, Lever and Ashby step on Day 3.
export const jobs: StageSpec = {
  id: "jobs",
  required: false,
  startMessage: "Looking for open roles on the company's job board",
  run: async (prospect) => {
    await sleep(1100);
    return { summary: `Found 3 open finance roles at ${prospect.company} (sample data)` };
  },
};
