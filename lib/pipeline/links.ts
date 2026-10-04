// Finds and sorts the links on a company page. Pure functions: no requests are made here.

const SOCIAL_HOSTS = ["x.com", "twitter.com", "facebook.com", "instagram.com", "youtube.com", "github.com", "crunchbase.com", "linkedin.com"];

// Paths on the company's own site that are worth reading for more facts about the company.
const USEFUL_PATH = /\/(about|news|newsroom|press|blog|careers|jobs|company|team|leadership)(\/|$)/i;

// Every link in a page's raw HTML, including the navigation and footer (where social icons live),
// with relative links resolved against the page address.
export function extractHrefs(html: string, pageUrl: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(/href\s*=\s*["']([^"'#\s>]+)["']/gi)) {
    try {
      const absolute = new URL(match[1], pageUrl);
      if (absolute.protocol === "http:" || absolute.protocol === "https:") found.add(absolute.toString());
    } catch {
      // not a valid link, skip it
    }
  }
  return [...found];
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export type SortedLinks = {
  social: string[]; // profile references, stored and never fetched (LinkedIn included)
  jobBoardSlugs: string[]; // job-board names read straight from a link (Greenhouse, Ashby, Lever, SmartRecruiters, Workable)
  pages: string[]; // the company's own useful pages, for the next level of reading
};

// Cookie, consent and privacy pages are never followed or recorded: they say nothing about the company.
const EXCLUDED_PATH = /cookie|consent|privacy|gdpr/i;

export function sortLinks(urls: string[], domain: string): SortedLinks {
  const social = new Set<string>();
  const jobBoardSlugs = new Set<string>();
  const pages = new Set<string>();
  const companyHost = domain.replace(/^www\./, "").toLowerCase();

  for (const url of urls) {
    const host = hostOf(url);
    if (!host || EXCLUDED_PATH.test(url)) continue;

    if (SOCIAL_HOSTS.some((social) => host === social || host.endsWith(`.${social}`))) {
      // Profile links only: skip individual videos, posts and share buttons.
      if (!/\/(watch|share|intent|sharer|status|posts?|reel)\b/i.test(new URL(url).pathname + new URL(url).search)) {
        social.add(url);
      }
      continue;
    }

    const board = url.match(/^https?:\/\/(?:job-boards|boards)\.greenhouse\.io\/([a-z0-9-]+)/i);
    if (board) jobBoardSlugs.add(board[1].toLowerCase());
    const ashby = url.match(/^https?:\/\/jobs\.ashbyhq\.com\/([a-z0-9-]+)/i);
    if (ashby) jobBoardSlugs.add(ashby[1].toLowerCase());
    const lever = url.match(/^https?:\/\/jobs\.(?:eu\.)?lever\.co\/([a-z0-9-]+)/i);
    if (lever) jobBoardSlugs.add(lever[1].toLowerCase());
    const smart = url.match(/^https?:\/\/(?:jobs|careers)\.smartrecruiters\.com\/([A-Za-z0-9-]+)/);
    if (smart) jobBoardSlugs.add(smart[1]);
    const workable = url.match(/^https?:\/\/apply\.workable\.com\/([a-z0-9-]+)/i);
    if (workable && workable[1] !== "api") jobBoardSlugs.add(workable[1].toLowerCase());

    // Only the company's own pages are followed.
    if ((host === companyHost || host.endsWith(`.${companyHost}`)) && USEFUL_PATH.test(new URL(url).pathname)) {
      pages.add(url.split("#")[0].replace(/\/$/, ""));
    }
  }

  return { social: [...social], jobBoardSlugs: [...jobBoardSlugs], pages: [...pages] };
}
