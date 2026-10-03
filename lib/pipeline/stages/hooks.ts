import { sleep, type StageSpec } from "@/lib/pipeline/stage";

// Stub: returns a fixed count. Replaced by the LLM hook step on Day 3.
export const hooks: StageSpec = {
  id: "hooks",
  required: true,
  startMessage: "Ranking the possible reasons to get in touch",
  run: async () => {
    await sleep(900);
    return "Ranked 3 possible hooks (sample data)";
  },
};
