import { sleep, type StageSpec } from "@/lib/pipeline/stage";

// Stub: returns a fixed count. Replaced by the LLM draft step on Day 3.
export const draft: StageSpec = {
  id: "draft",
  required: true,
  startMessage: "Writing the draft email",
  run: async () => {
    await sleep(1000);
    return "Wrote a 70-word draft with 2 cited claims (sample data)";
  },
};
