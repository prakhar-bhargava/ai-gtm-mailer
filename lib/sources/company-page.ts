import { fetchText } from "@/lib/sources/http";

export type PageText = { title: string; url: string; text: string };

// Jina Reader turns a web page into markdown. Keyless; the free tier is rate limited.
export async function readPage(url: string): Promise<PageText> {
  const markdown = await fetchText(`https://r.jina.ai/${url}`, {
    cacheKey: `page:${url}`,
    accept: "text/plain",
  });
  const title = markdown.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? url;
  const bodyStart = markdown.indexOf("Markdown Content:");
  const text = (bodyStart >= 0 ? markdown.slice(bodyStart + "Markdown Content:".length) : markdown).trim();
  return { title, url, text };
}
