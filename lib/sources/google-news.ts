import { fetchText } from "@/lib/sources/http";

export type NewsItem = {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string | null;
};

export const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };

export function decode(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (match) => ENTITIES[match] ?? match).trim();
}

export function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1].replace(/<!\[CDATA\[|\]\]>/g, "")) : "";
}

// Google News RSS: keyless and free, but it matches on words, not companies.
// The caller must check that the story is about the right company.
// With focus, the query adds business-event words, which surfaces raises, deals and hires that a plain
// name search buries under product reviews and stock commentary.
const EVENT_WORDS = "(raises OR funding OR acquires OR acquisition OR expands OR expansion OR launches OR hires OR appoints OR CFO OR partnership OR IPO)";

export async function searchNews(company: string, options: { focus?: boolean } = {}): Promise<NewsItem[]> {
  const terms = options.focus ? `"${company}" ${EVENT_WORDS} when:180d` : `"${company}" when:180d`;
  const query = encodeURIComponent(terms);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  const key = `news:${options.focus ? "events:" : ""}${company.toLowerCase()}`;
  const xml = await fetchText(url, { cacheKey: key, accept: "application/rss+xml" });

  const items: NewsItem[] = [];
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const rawTitle = tag(block, "title");
    const sourceName = tag(block, "source");
    // Google appends " - Publisher" to headlines; the publisher is already in sourceName.
    const title = sourceName && rawTitle.endsWith(` - ${sourceName}`) ? rawTitle.slice(0, -(sourceName.length + 3)) : rawTitle;
    const pubDate = tag(block, "pubDate");
    const publishedAt = pubDate && !Number.isNaN(Date.parse(pubDate)) ? new Date(pubDate).toISOString() : null;
    const link = tag(block, "link");
    if (title && link) items.push({ title, url: link, sourceName: sourceName || "Google News", publishedAt });
  }
  return items;
}
