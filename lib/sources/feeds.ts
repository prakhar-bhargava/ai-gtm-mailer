import { SourceError, fetchText } from "@/lib/sources/http";
import { tag } from "@/lib/sources/google-news";

// A company's own RSS or Atom feed (newsroom, blog, press). Feeds carry exact dates and every recent post,
// including the ones the crawler's eight pages didn't reach. Keyless, one small request.

export type FeedItem = { title: string; url: string | null; date: string };

// Feed links found on the site come first; then a few addresses that common site builders use.
export function feedCandidates(domain: string, links: string[]): string[] {
  const own = links.filter((link) => {
    try {
      const url = new URL(link);
      const host = url.host.replace(/^www\./, "");
      return (host === domain || host.endsWith(`.${domain}`)) && /(\/feed\/?$|\/rss(\.xml)?\/?$|\/atom(\.xml)?\/?$|feed\.xml$|rss\.xml$)/i.test(url.pathname);
    } catch {
      return false;
    }
  });
  const guesses = ["/feed", "/rss.xml", "/blog/rss.xml"].map((path) => `https://${domain}${path}`);
  return [...new Set([...own, ...guesses])].slice(0, 4);
}

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  // RSS 2.0
  for (const [, block] of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)) {
    const title = tag(block, "title");
    const date = tag(block, "pubDate") || tag(block, "dc:date");
    const link = tag(block, "link") || null;
    if (title && date && !Number.isNaN(Date.parse(date))) items.push({ title, url: link, date: new Date(date).toISOString() });
  }
  // Atom
  for (const [, block] of xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/g)) {
    const title = tag(block, "title");
    const date = tag(block, "published") || tag(block, "updated");
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? null;
    if (title && date && !Number.isNaN(Date.parse(date))) items.push({ title, url: link, date: new Date(date).toISOString() });
  }
  return items;
}

// The first candidate that answers with a feed. Pages that aren't feeds (an HTML 200) are skipped.
export async function readCompanyFeed(domain: string, links: string[]): Promise<{ url: string; items: FeedItem[] } | null> {
  for (const url of feedCandidates(domain, links)) {
    try {
      const body = await fetchText(url, { cacheKey: `feed:${url}`, accept: "application/rss+xml, application/atom+xml, application/xml" });
      if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(body.slice(0, 2000))) continue;
      const items = parseFeed(body);
      if (items.length) return { url, items };
    } catch (error) {
      if (error instanceof SourceError) continue;
      throw error;
    }
  }
  return null;
}
