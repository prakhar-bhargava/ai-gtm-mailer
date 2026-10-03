import { sleep, type StageSpec } from "@/lib/pipeline/stage";

// Stub: returns fixed sample data. Replaced by the Jina Reader step on Day 3.
export const companySite: StageSpec = {
  id: "company_site",
  required: false,
  startMessage: "Reading the company website",
  run: async (prospect) => {
    await sleep(1800);
    return { summary: `Read 4 pages of ${prospect.company}'s website (sample data)` };
  },
};
