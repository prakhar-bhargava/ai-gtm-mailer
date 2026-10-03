import { sleep, type StageSpec } from "@/lib/pipeline/stage";
import type { Draft } from "@/lib/types";

// Stub: returns a fixed sample draft. Replaced by the LLM draft step on Day 3.
// The sources are placeholders on example.com, not real pages.
export const draft: StageSpec = {
  id: "draft",
  required: true,
  startMessage: "Writing the draft email",
  run: async (prospect) => {
    await sleep(1000);
    const sampleDraft: Draft = {
      subject: "Finance ops question",
      body: [
        `Hi ${prospect.name.split(" ")[0]},`,
        "",
        "Saw that Example Co is hiring three finance roles right now. Teams in that position often have invoice and approval work piling up faster than the team can clear it.",
        "",
        "Zamp handles that kind of work end to end, so it may be worth a look.",
        "",
        "Worth a look?",
      ].join("\n"),
      claims: [
        {
          text: "Example Co is hiring three finance roles right now",
          sourceName: "Careers page (sample)",
          sourceUrl: "https://example.com/careers",
          publishedAt: null,
        },
      ],
    };
    return { summary: "Wrote a draft with 1 cited claim (sample data)", draft: sampleDraft };
  },
};
