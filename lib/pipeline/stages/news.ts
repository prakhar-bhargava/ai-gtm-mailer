import { sleep, type StageSpec } from "@/lib/pipeline/stage";

// Stub: returns fixed sample data. Replaced by the Tavily news step on Day 3.
export const news: StageSpec = {
  id: "news",
  required: false,
  startMessage: "Checking recent news about the company",
  run: async (prospect) => {
    await sleep(1400);
    return { summary: `Found 2 recent news items about ${prospect.company} (sample data)` };
  },
};
