import { sleep, type StageSpec } from "@/lib/pipeline/stage";

// Stub: returns fixed sample data. Replaced by the real identity step on Day 3.
export const identity: StageSpec = {
  id: "identity",
  required: true,
  startMessage: "Working out which company and person this is",
  run: async (prospect) => {
    await sleep(700);
    return `Matched ${prospect.name} to ${prospect.company} (sample data)`;
  },
};
