import pipeline from "@/config/pipeline.json";
import { cacheGet, cacheSet } from "@/lib/cache";
import { recordPage } from "@/lib/usage";
import { trail } from "@/lib/trail";
import type { CrawlPage } from "@/lib/types";

// Reads a company's own website with a real browser (Playwright), so pages built with JavaScript render
// fully and no model or paid reader is needed. No tokens are spent: the page structure (title, meta tags,
// headings, paragraphs, dated items, links, structured data) is read directly from the DOM.
//
// If Playwright or its browser is not installed, the same extraction runs on the raw HTML instead.
// Install the browser once with: npx playwright install chromium

const USER_AGENT = "Mozilla/5.0 (compatible; GTMAssociateResearch/1.0; public pages only)";
const NAV_TIMEOUT_MS = 15_000;
const POLITE_DELAY_MS = 400; // pause between pages on the same site
const FAILURE_MEMORY_MS = 10 * 60 * 1000;

export type RawPage = CrawlPage & {
  links: string[]; // every absolute link on the page, used to find more pages, profiles and job boards
  paragraphs: string[];
  dated: { title: string; date: string; url: string | null }[]; // items with a <time> date, e.g. newsroom posts
};

// ---------------------------------------------------------------------------------------------
// Browser lifecycle: one browser per server process, closed after a minute of no use.

type Browser = import("playwright").Browser;
const globalForBrowser = globalThis as typeof globalThis & {
  crawlBrowser?: Promise<Browser | null>;
  crawlBrowserTimer?: ReturnType<typeof setTimeout>;
};

async function getBrowser(): Promise<Browser | null> {
  if (!globalForBrowser.crawlBrowser) {
    globalForBrowser.crawlBrowser = (async () => {
      try {
        const { chromium } = await import("playwright");
        return await chromium.launch({
          headless: true,
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        });
      } catch {
        // Not installed, or the browser binary is missing. The HTML fallback takes over.
        return null;
      }
    })();
  }
  const browser = await globalForBrowser.crawlBrowser;
  if (!browser) globalForBrowser.crawlBrowser = undefined; // try again next run, in case it was installed meanwhile
  return browser;
}

function scheduleClose() {
  clearTimeout(globalForBrowser.crawlBrowserTimer);
  globalForBrowser.crawlBrowserTimer = setTimeout(async () => {
    const browser = await globalForBrowser.crawlBrowser;
    globalForBrowser.crawlBrowser = undefined;
    await browser?.close().catch(() => undefined);
  }, 60_000);
}

// ---------------------------------------------------------------------------------------------
// robots.txt: pages the site asks crawlers not to read are skipped.

type RobotsRule = { allow: boolean; pattern: string };

async function disallowedPaths(origin: string): Promise<RobotsRule[]> {
  const key = `robots:${origin}`;
  const cached = cacheGet(key);
  let text = cached;
  if (text === null) {
    try {
      const response = await fetch(`${origin}/robots.txt`, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(pipeline.sourceTimeoutMs),
      });
      text = response.ok ? await response.text() : "";
    } catch {
      text = "";
    }
    cacheSet(key, text);
  }
  return parseRobots(text);
}

// The rules in the "User-agent: *" group. Consecutive User-agent lines share one group, and both
// Allow and Disallow are kept, so "Disallow: /*?" doesn't read as "Disallow: /".
export function parseRobots(text: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let agents: string[] = [];
  let inRules = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const [field, ...rest] = line.split(":");
    const name = field.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (name === "user-agent") {
      if (inRules) {
        agents = [];
        inRules = false;
      }
      agents.push(value);
    } else if (name === "allow" || name === "disallow") {
      inRules = true;
      if (agents.includes("*") && value) rules.push({ allow: name === "allow", pattern: value });
    }
  }
  return rules;
}

function robotsRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

// The longest matching rule wins; on a tie, Allow wins (as Google reads robots.txt).
export function allowedByRobots(url: string, rules: RobotsRule[]): boolean {
  const parsed = new URL(url);
  const target = `${parsed.pathname}${parsed.search}`;
  let best: RobotsRule | null = null;
  for (const rule of rules) {
    if (!robotsRegex(rule.pattern).test(target)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) best = rule;
  }
  return !best || best.allow;
}

// ---------------------------------------------------------------------------------------------
// Extraction. The same shape comes back from the browser and from the HTML fallback.

const EXCLUDE = /cookie|consent|privacy|gdpr|javascript|enable js|browser is not supported/i;

function kindOf(url: string): CrawlPage["kind"] {
  const path = new URL(url).pathname.toLowerCase();
  if (path === "/" || path === "") return "home";
  if (/about|company|team|leadership/.test(path)) return "about";
  if (/careers|jobs/.test(path)) return "careers";
  if (/news|press|blog/.test(path)) return "news";
  return "other";
}

const TECH_HINTS: [RegExp, string][] = [
  [/js\.stripe\.com/, "Stripe"],
  [/hs-scripts|hubspot/, "HubSpot"],
  [/segment\.(com|io)/, "Segment"],
  [/googletagmanager|gtag\/js/, "Google Tag Manager"],
  [/intercom/, "Intercom"],
  [/salesforce|pardot/, "Salesforce"],
  [/marketo|mktoresp/, "Marketo"],
  [/drift\.com/, "Drift"],
  [/zendesk/, "Zendesk"],
  [/greenhouse\.io/, "Greenhouse"],
  [/lever\.co/, "Lever"],
  [/ashbyhq/, "Ashby"],
  [/workday/, "Workday"],
  [/_next\//, "Next.js"],
  [/wp-content|wordpress/, "WordPress"],
  [/webflow/, "Webflow"],
  [/shopify/, "Shopify"],
];

function techFrom(sources: string[]): string[] {
  const found = new Set<string>();
  for (const src of sources) for (const [pattern, name] of TECH_HINTS) if (pattern.test(src)) found.add(name);
  return [...found];
}

type DomResult = {
  title: string;
  description: string | null;
  siteName: string | null;
  headings: string[];
  paragraphs: string[];
  links: string[];
  scripts: string[];
  dated: { title: string; date: string; url: string | null }[];
  jsonLd: string[];
  published: string | null; // an article's own publish date, from its meta tags or first <time>
};

// Runs inside the page. Kept as plain script text, not a function: bundlers can wrap functions in helpers
// (such as __name) that don't exist in the browser, which breaks page.evaluate.
const EXTRACT_IN_PAGE = `(() => {
  const text = (node) => ((node && node.textContent) || "").replace(/\\s+/g, " ").trim();
  const meta = (selector) => { const el = document.querySelector(selector); return (el && el.content && el.content.trim()) || null; };
  const headings = Array.from(document.querySelectorAll("h1, h2")).map(text).filter((item) => item.length > 2).slice(0, 12);
  const paragraphs = Array.from(document.querySelectorAll("main p, article p, section p, p")).map(text).filter((item) => item.length >= 60).slice(0, 12);
  const links = Array.from(document.querySelectorAll("a[href]")).map((a) => a.href).filter((href) => href.startsWith("http"));
  const scripts = Array.from(document.querySelectorAll("script[src]")).map((s) => s.src);
  const dated = Array.from(document.querySelectorAll("time")).map((time) => {
    const holder = time.closest("article, li, a, div") || time.parentElement;
    const heading = holder ? holder.querySelector("h1, h2, h3, h4, a") : null;
    const link = holder ? (holder.closest("a") || holder.querySelector("a")) : null;
    return { title: text(heading), date: time.getAttribute("datetime") || text(time), url: link ? link.href : null };
  }).filter((item) => item.title.length > 10).slice(0, 10);
  const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent || "").slice(0, 5);
  const firstTime = document.querySelector("time[datetime]");
  const published = meta('meta[property="article:published_time"]') || meta('meta[name="date"]') || meta('meta[itemprop="datePublished"]') || (firstTime ? firstTime.getAttribute("datetime") : null);
  return {
    title: document.title.trim(),
    description: meta('meta[name="description"]') || meta('meta[property="og:description"]'),
    siteName: meta('meta[property="og:site_name"]'),
    headings, paragraphs, links, scripts, dated, jsonLd, published,
  };
})()`;

// The HTML fallback: the same fields, read with regular expressions from the raw page.
function extractFromHtml(html: string, url: string): DomResult {
  const strip = (value: string) =>
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&rsquo;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  const metaContent = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, "i"))?.[1] ??
    null;
  const all = (pattern: RegExp) => [...html.matchAll(pattern)].map((match) => strip(match[1]));
  const links = [...html.matchAll(/href\s*=\s*["']([^"'#\s>]+)["']/gi)]
    .map((match) => {
      try {
        return new URL(match[1], url).toString();
      } catch {
        return "";
      }
    })
    .filter((href) => href.startsWith("http"));
  return {
    title: strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
    description: metaContent("description") ?? metaContent("og:description"),
    siteName: metaContent("og:site_name"),
    headings: all(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi).filter((item) => item.length > 2).slice(0, 12),
    paragraphs: all(/<p[^>]*>([\s\S]*?)<\/p>/gi).filter((item) => item.length >= 60).slice(0, 12),
    links,
    scripts: [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]),
    dated: [...html.matchAll(/<time[^>]*datetime=["']([^"']+)["'][^>]*>[\s\S]{0,600}?<\/time>([\s\S]{0,400}?)<\/(?:a|h\d)>/gi)]
      .map((match) => ({ title: strip(match[2]), date: match[1], url: null }))
      .filter((item) => item.title.length > 10)
      .slice(0, 10),
    jsonLd: [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]).slice(0, 5),
    published:
      metaContent("article:published_time") ??
      html.match(/<time[^>]*datetime=["']([^"']+)["']/i)?.[1] ??
      html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ??
      null,
  };
}

// A few facts from schema.org data, when the site publishes it.
function factsFromJsonLd(blocks: string[]): string[] {
  const facts: string[] = [];
  for (const block of blocks) {
    try {
      const data = JSON.parse(block) as unknown;
      const items = Array.isArray(data) ? data : [data];
      for (const item of items as Record<string, unknown>[]) {
        if (!item || typeof item !== "object") continue;
        if (item.foundingDate) facts.push(`Founded ${String(item.foundingDate).slice(0, 4)}`);
        const employees = item.numberOfEmployees as { value?: unknown } | undefined;
        if (employees?.value) facts.push(`About ${employees.value} employees`);
        const address = item.address as { addressLocality?: string; addressCountry?: string } | undefined;
        if (address?.addressLocality) facts.push(`Based in ${[address.addressLocality, address.addressCountry].filter(Boolean).join(", ")}`);
      }
    } catch {
      // malformed JSON-LD is common; skip it
    }
  }
  return [...new Set(facts)];
}

function toPage(url: string, dom: DomResult, ms: number, via: CrawlPage["via"]): RawPage {
  const paragraphs = dom.paragraphs.filter((item) => !EXCLUDE.test(item));
  // A single news or blog post (not a listing page) is itself a dated item: its headline and publish date.
  const path = new URL(url).pathname.replace(/\/$/, "");
  const isPost = kindOf(url) === "news" && path.split("/").filter(Boolean).length >= 2;
  const dated = [...dom.dated];
  if (isPost && dom.published && Number.isFinite(Date.parse(dom.published))) {
    dated.unshift({ title: dom.headings[0] || dom.title, date: dom.published, url });
  }
  return {
    url,
    kind: kindOf(url),
    title: dom.title || url,
    description: dom.description && !EXCLUDE.test(dom.description) ? dom.description : null,
    headings: [...new Set(dom.headings.filter((item) => !EXCLUDE.test(item)))].slice(0, 6),
    excerpt: paragraphs[0]?.slice(0, 280) ?? null,
    facts: factsFromJsonLd(dom.jsonLd),
    tech: techFrom(dom.scripts),
    linkCount: dom.links.length,
    ms,
    via,
    links: [...new Set(dom.links)],
    paragraphs,
    dated,
  };
}

// ---------------------------------------------------------------------------------------------
// Public API

// Reads one page. Uses the browser when available, the raw HTML otherwise. Results are cached.
export async function crawlPage(url: string): Promise<RawPage> {
  const key = `crawl:${url}`;
  const cached = cacheGet(key);
  if (cached) {
    recordPage(true);
    trail(`Using a saved copy of ${new URL(url).pathname || "/"}, no request needed`);
    return JSON.parse(cached) as RawPage;
  }

  // A page that failed in the last 10 minutes fails again at once, so the next step in the same run
  // doesn't wait on it twice. After that it is tried again (a timeout during a rehearsal shouldn't stick).
  const failedBefore = cacheGet(`crawlfail:${url}`);
  if (failedBefore) {
    const [at, ...message] = failedBefore.split("|");
    if (Date.now() - Number(at) < FAILURE_MEMORY_MS) throw new Error(message.join("|"));
  }
  try {
    const page = await crawlFresh(url, key);
    recordPage(false);
    return page;
  } catch (error) {
    cacheSet(`crawlfail:${url}`, `${Date.now()}|${error instanceof Error ? error.message : "no answer"}`);
    throw error;
  }
}

async function crawlFresh(url: string, key: string): Promise<RawPage> {
  const origin = new URL(url).origin;
  const rules = await disallowedPaths(origin);
  if (!allowedByRobots(url, rules)) throw new Error(`robots.txt asks crawlers not to read ${new URL(url).pathname}`);

  const started = Date.now();
  const browser = await getBrowser();
  let page: RawPage;
  if (browser) {
    trail(`Opening ${url} in a headless browser`);
    const context = await browser.newContext({ userAgent: USER_AGENT, javaScriptEnabled: true });
    try {
      const tab = await context.newPage();
      // Skip images, fonts and media: only the text and links are needed.
      await tab.route("**/*", (route) =>
        ["image", "font", "media"].includes(route.request().resourceType()) ? route.abort() : route.continue(),
      );
      const response = await tab.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
      if (response && response.status() >= 400) throw new Error(`the site answered with status ${response.status()}`);
      await tab.waitForTimeout(600); // let client-side content render
      const dom = (await tab.evaluate(EXTRACT_IN_PAGE)) as DomResult;
      page = toPage(tab.url(), dom, Date.now() - started, "browser");
    } finally {
      await context.close().catch(() => undefined);
      scheduleClose();
    }
  } else {
    trail(`Reading ${url} as plain HTML (browser not installed)`);
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(NAV_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`the site answered with status ${response.status}`);
    page = toPage(response.url || url, extractFromHtml(await response.text(), url), Date.now() - started, "html");
  }
  trail(`Read "${page.title.slice(0, 70)}" in ${(page.ms / 1000).toFixed(1)} s`);
  cacheSet(key, JSON.stringify(page));
  await new Promise((resolve) => setTimeout(resolve, POLITE_DELAY_MS));
  return page;
}

// The summary of one page that goes to the live feed (no full link list or paragraphs).
export function forFeed(page: RawPage): CrawlPage {
  return {
    url: page.url,
    kind: page.kind,
    title: page.title,
    description: page.description,
    headings: page.headings,
    excerpt: page.excerpt,
    facts: page.facts,
    tech: page.tech,
    linkCount: page.linkCount,
    ms: page.ms,
    via: page.via,
  };
}
