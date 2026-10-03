import { fetchText } from "@/lib/sources/http";

export type NewsItem = {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string | null;
};

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };

function decode(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (match) => ENTITIES[match] ?? match).trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1].replace(/<!\[CDATA\[|\]\]>/g, "")) : "";
}

// Google News RSS: keyless and free, but it matches on words, not companies.
// The caller must check that the story is about the right company.
export async function searchNews(company: string): Promise<NewsItem[]> {
  const query = encodeURIComponent(`"${company}" when:180d`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchText(url, { cacheKey: `news:${company.toLowerCase()}`, accept: "application/rss+xml" });

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
