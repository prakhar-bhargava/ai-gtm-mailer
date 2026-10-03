import type { StageSpec } from "@/lib/pipeline/stage";
import { readPage } from "@/lib/sources/company-page";

// The company's own description of itself. It has no date, so it can support a hook but never lead one.
// Its first sentence also tells the news check which company is meant.
export const companySite: StageSpec = {
  id: "company_site",
  required: false,
  startMessage: "Reading the company website",
  run: async (ctx) => {
    if (!ctx.domain) throw new Error("the company website is not known yet");
    let page;
    try {
      page = await readPage(`https://${ctx.domain}/about`);
    } catch {
      page = await readPage(`https://${ctx.domain}`);
    }
    const flat = page.text.replace(/\s+/g, " ");
    const sentence = flat.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
    if (sentence.length < 20) throw new Error("the page had no readable description");

    return {
      summary: `Read ${ctx.domain}'s ${page.url.endsWith("/about") ? "about page" : "home page"}`,
      companyDescription: sentence.slice(0, 300),
      newSignals: [
        {
          type: "company_site",
          claim: `The company describes itself: "${sentence.slice(0, 200)}"`,
          snippet: flat.slice(0, 300),
          sourceName: `${ctx.domain} (company website)`,
          sourceUrl: page.url,
          publishedAt: null,
          fetchedAt: new Date().toISOString(),
        },
      ],
    };
  },
};
