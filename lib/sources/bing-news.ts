import { fetchText } from "@/lib/sources/http";
import { tag, type NewsItem } from "@/lib/sources/google-news";

// Bing News RSS: keyless and free, a second index next to Google News. It finds trade press and
// regional outlets Google ranks lower. Like Google News it matches words, so the same-company check applies.
export async function searchBingNews(company: string): Promise<NewsItem[]> {
  const query = encodeURIComponent(`"${company}"`);
  const url = `https://www.bing.com/news/search?q=${query}&format=rss&qft=sortbydate%3d%221%22`;
  const xml = await fetchText(url, { cacheKey: `bingnews:${company.toLowerCase()}`, accept: "application/rss+xml" });

  const items: NewsItem[] = [];
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = tag(block, "title");
    const rawLink = tag(block, "link");
    // Bing wraps the article address in a click-tracking link; the real one is its "url" parameter.
    let link = rawLink;
    try {
      const inner = new URL(rawLink).searchParams.get("url");
      if (inner) link = inner;
    } catch {
      // keep the raw link
    }
    const sourceName = tag(block, "News:Source") || (() => {
      try {
        return new URL(link).host.replace(/^www\./, "");
      } catch {
        return "Bing News";
      }
    })();
    const pubDate = tag(block, "pubDate");
    const publishedAt = pubDate && !Number.isNaN(Date.parse(pubDate)) ? new Date(pubDate).toISOString() : null;
    if (title && link) items.push({ title, url: link, sourceName, publishedAt });
  }
  return items;
}
