# Data sources and APIs for prospect signals (solo builder, 1-week demo, as of Oct 2026)

Note: Most pricing figures below come from third-party 2026 comparison posts, not vendor pricing pages fetched directly. Pricing changed often in 2025-2026 (Brave, Perplexity, Clearbit, Crunchbase), so check each vendor's pricing page before relying on a number. All figures are in USD unless noted. The builder is in India. None of these APIs is India-restricted as far as I found, but SerpAPI/Serper/Brave take card billing, and India-issued cards sometimes fail on foreign SaaS billing (not sourced, general caveat).

## 1. Web search / news APIs (Tavily, Exa, Serper, SerpAPI, Brave, Perplexity Sonar, NewsAPI, GNews, Google News RSS)

### Takeaway
For a free demo, Tavily (1,000 credits/month, no card) and Exa ($10/month free credits) are the most LLM-ready. Serper is the cheapest way to get raw Google SERP and news JSON. Brave no longer has a truly free tier (since Feb 2026). NewsAPI.org and GNews free tiers are delayed and limited to dev/non-commercial use, so they are weak for "recent news" signals. Google News RSS is free and keyless but gives headlines only.

### Cited Findings
- Tavily: 1,000 API credits/month free, no credit card; pay-as-you-go $0.008/credit; has search + extract endpoints; integrates with LangChain — [Parallel.ai, 2026](https://parallel.ai/articles/best-free-web-search-api.md); same free tier and per-credit price, and Tavily includes a full-page extraction tier — [apicostcalc, Sep 9 2026](https://apicostcalc.com/blog/exa-vs-tavily-vs-serper-vs-brave-web-search-api-cost.html)
- Exa: $10 onboarding bonus plus $10 free credits every month, no payment method required; embeddings-based index, "smaller and more specialized" — [Parallel.ai](https://parallel.ai/articles/best-free-web-search-api.md). Cost about $7 per 1k (standard), $12 per 1k (deep) — [apicostcalc](https://apicostcalc.com/blog/exa-vs-tavily-vs-serper-vs-brave-web-search-api-cost.html)
- Serper: returns real Google SERP as structured JSON (organic, knowledge graph, answer box, people-also-ask); "2,500 free queries with no credit card"; $0.30 per 1,000 queries — [Parallel.ai](https://parallel.ai/articles/best-free-web-search-api.md). CONFLICT: apicostcalc says Serper has "no free tier" and costs ~$1/1k — [apicostcalc](https://apicostcalc.com/blog/exa-vs-tavily-vs-serper-vs-brave-web-search-api-cost.html). (Likely explanation: a one-time 2,500-query signup grant, and per-1k price depends on credit pack size. Verify on serper.dev.)
- SerpAPI: 250 free searches/month (shared across all SerpAPI engines, including Google News), real-time; Starter $25/month for 1,000 searches; bills only successful searches — [SocialCrawl, 2026](https://www.socialcrawl.dev/blog/best-google-news-apis-2026.md). Step-tier plans ($25-$2,750) create hard caps. At 20k queries/month, Serper costs about $20 vs SerpAPI about $275 — [apicostcalc](https://apicostcalc.com/blog/exa-vs-tavily-vs-serper-vs-brave-web-search-api-cost.html)
- Brave Search API: free tier eliminated in February 2026. Now $5 per 1,000 search requests, with $5/month credit (about 1,000 queries). The credit requires public attribution to Brave, and a card is billed beyond it with no stated spending cap. Free allowance was earlier 2,000/month (2023) and 5,000/month (Aug 2025) — [Implicator.ai](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/). Bing Search API was shut down by Microsoft about six months earlier (Aug 2025) — [same](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/)
- Perplexity Sonar: Sonar is $1/M tokens in and out; Sonar Pro is $3/M in, $15/M out. There is also a per-1,000-request search fee: Sonar $5/$8/$12 and Sonar Pro $6/$10/$14 (low/medium/high context). The Perplexity Search API (raw results, no synthesis) costs $5 per 1K requests with no token cost. The Pro-subscriber API credit was discontinued Feb 2026, so there is no reliable free tier — [Puter developer blog, Jun 2026](https://developer.puter.com/tutorials/perplexity-api-pricing/)
- NewsAPI.org free: 100 requests/day, development use only, 24-hour delay, 1-month lookback; real-time paid starts at $449/month — [SocialCrawl](https://www.socialcrawl.dev/blog/best-google-news-apis-2026.md)
- GNews free: 100 requests/day, 12-hour delay, non-commercial, localhost-only; paid Essential €49.99/month (real-time, full content from 2020) — [SocialCrawl](https://www.socialcrawl.dev/blog/best-google-news-apis-2026.md)
- Google News RSS: available but "not a queryable structured API"; only basic headline lists, no search/ranking/metadata features — [SocialCrawl](https://www.socialcrawl.dev/blog/best-google-news-apis-2026.md)
- Other news options: NewsData.io 200 credits/day free (12h delay); Mediastack 100 calls/month free (delayed, non-commercial) — [SocialCrawl](https://www.socialcrawl.dev/blog/best-google-news-apis-2026.md)
- Firecrawl also offers search: 2 credits per 10 results within its 1,000 free credits/month — [Parallel.ai](https://parallel.ai/articles/best-free-web-search-api.md)

### Inferences
- NewsAPI and GNews free tiers are localhost or dev-only and delayed 12-24h. Running a public demo on them would likely breach their terms, and they can miss the news that matters most for outreach ("raised yesterday"). Use Tavily (`topic: news`) or Serper `/news` instead.
- Google News RSS (`news.google.com/rss/search?q=...`) works as a zero-cost, keyless fallback for headlines plus links. Pair it with Jina Reader to fetch article bodies.
- For a ~50-prospect demo with about 5 searches per prospect (~250 queries), every option fits inside its free tier. Rate limits and reliability matter more than cost.

### Gaps
- I found no reliable published latency benchmarks for Tavily, Exa, Serper, Brave or Sonar in the sources fetched. From general experience (unverified here), Serper is roughly 1-2s, Tavily basic 1-3s (advanced slower), and Sonar several seconds because it generates an answer.
- Tavily/Exa free-tier per-minute rate limits were not confirmed from vendor docs.
- I could not confirm the Serper free-tier conflict on serper.dev directly.

## 2. Person/company enrichment (Proxycurl, Apollo, PDL, Hunter, Clearbit, Crunchbase, Coresignal, Bright Data/Apify) and LinkedIn legal risk

### Takeaway
Proxycurl is gone. LinkedIn sued it in Jan 2025 and it shut down on July 4, 2025. Clearbit's free tools and Logo API are sunset. For a legal, free demo, use Apollo's free plan (API access with low rate limits; enrichment uses credits) or PDL's 100 free lookups/month for person+company data, and Hunter for email/domain. Avoid LinkedIn scraping (Apify/Bright Data actors, Proxycurl clones). LinkedIn's 2025-2026 litigation shows ToS/contract claims are what bite, whatever hiQ said about the CFAA.

### Cited Findings
- Proxycurl (Nubela): LinkedIn filed suit January 2025. Proxycurl settled and shut down July 4, 2025. The CEO cited the American Rule (no fee recovery even if you win) and LinkedIn/Microsoft's resources ("there is no winning in fighting this"). It had about $10M revenue. The team now runs NinjaPear (B2B/competitive-intel data APIs) — [Nubela blog "Goodbye Proxycurl"](https://nubela.co/blog/goodbye-proxycurl/)
- LinkedIn alleged Proxycurl used hundreds of thousands of fake accounts to collect profiles for API resale — [Unipile](https://www.unipile.com/is-linkedin-scraping-legal/)
- hiQ v. LinkedIn: April 2022 9th Cir. said scraping public data without login likely does not violate the CFAA. But on Dec 6, 2022 hiQ agreed to a consent judgment: $500,000 to LinkedIn, a permanent injunction, and destruction of code/data. hiQ lost on breach of contract (LinkedIn User Agreement s.8.2 bans automated collection) — [Unipile](https://www.unipile.com/is-linkedin-scraping-legal/)
- LinkedIn's 2025-26 enforcement (secondary source): Apollo.io and Seamless.AI LinkedIn company pages removed/restricted (Mar 6, 2025); ProAPIs sued (Oct 2025); HeyReach page removed and founder profiles restricted (Mar 25, 2026) — [Unipile](https://www.unipile.com/is-linkedin-scraping-legal/)
- LinkedIn v. ProAPIs (N.D. Cal. 5:25-cv-08393): alleged fake-account mill ("hundreds or thousands of fake accounts a day") and invalid cards used for Premium. ProAPIs charged clients up to $15k/month. Consent judgment entered Sept 21, 2026 permanently bars scraping/selling LinkedIn data and orders deletion of the archive. This was a settlement, not a merits ruling — [gblock.app](https://www.gblock.app/articles/linkedin-proapis-scraping-injunction-2026); also covered by [Bloomberg Law](https://news.bloomberglaw.com/artificial-intelligence/linkedins-war-against-bot-scrapers-ramps-up-as-ai-gets-smarter)
- Apollo API rate limits: free plan has API access at 50/min, 200/hour, 600/day. Paid plans get 200/min and 400-600/hour. Enrichment endpoints consume credits, and "your credit balance still governs how much data you can enrich" — [Apollo docs](https://docs.apollo.io/reference/rate-limits.md). Paid: Basic $49/user/month; full API on Organization tier $119/user/month — [Pin.com, Mar 2026](https://pin.com/blog/best-people-search-apis)
- People Data Labs: free 100 lookups/month; Pro from $98/month (350 enrichment credits); $0.28-$0.20 per credit — [Pin.com](https://pin.com/blog/best-people-search-apis)
- Hunter.io: limited free credits; Pro S $99/month (5,000 credits), API on paid plans — [Pin.com](https://pin.com/blog/best-people-search-apis). Snov.io: 50 free credits/month — [same](https://pin.com/blog/best-people-search-apis)
- Coresignal: no free tier mentioned; Starter $49/month (250 Collect credits) — [Pin.com](https://pin.com/blog/best-people-search-apis)
- Clearbit: free platform and Weekly Visitor Report ended April 30, 2025 — [Clearbit help center](https://help.clearbit.com/hc/en-us/articles/31990018203031-Clearbit-Free-Tools-Sunset-April-30th-2025). Free Logo API sunset Dec 1, 2025. Enrichment is now only via HubSpot Breeze Intelligence (~$45/month for 100 credits plus a HubSpot subscription). Legacy endpoints still work only for existing integrations — [Abmatic, 2026](https://abmatic.ai/blog/clearbit-enrichment-api-2026)
- Crunchbase: free Basic API discontinued (2023). Paid API starts at roughly $500/month — [The NextGen Nexus, May 2026](https://thenextgennexus.com/2026/05/14/crunchbase-killed-its-free-api-heres-how-to-rebuild-it-2026/)
- Apify actors for public ATS job boards exist at about $4 per 1,000 jobs (pay-per-event). This shows Apify pricing style; LinkedIn actors carry the ToS risk above — [Apify](https://apify.com/oddsmith/ats-job-board.md)

### Inferences
- The source of Apollo/PDL data also faces LinkedIn pressure (Apollo's page restriction), but using a vendor's API is the vendor's contractual exposure, not the builder's. Calling Apollo/PDL APIs is far lower risk than running a LinkedIn scraper yourself.
- For a live demo, the person's LinkedIn URL can be a user-supplied input. Get role/tenure from Apollo `people/match` or PDL, and public posts/talks from web search (Tavily/Exa with `site:` or domain filters), instead of fetching linkedin.com.
- Apollo's free tier (600 calls/day) is plenty for a demo. Credit allowance is the binding limit.
- Running a scraper while logged in to LinkedIn is the riskiest choice (account ban plus a contract claim). A solo builder should not do it.

### Gaps
- Exact Apollo free-plan monthly credit count, and whether people search (`mixed_people/search`) works on free keys, were not confirmed. Some sources say full API needs the Organization tier ($119/user/month). Test with a free key on day 1.
- Hunter's exact free monthly allowance (historically 25 searches + 50 verifications) was not confirmed from Hunter's site.
- Bright Data and Apify LinkedIn-scraper pricing were not researched in detail (deprioritized because of legal risk).
- The Apollo/Seamless/HeyReach enforcement items come from a vendor blog (Unipile, which sells a LinkedIn API), so treat them as secondary.

## 3. Job postings as signals (Greenhouse, Lever, Ashby, Adzuna, JSearch)

### Takeaway
Greenhouse, Lever and Ashby expose public, keyless JSON job-board endpoints per company. These give the most reliable, legal, free hiring signals, provided you know or can guess the company's board slug. Adzuna (free key, 2,500 calls/month) and JSearch (200 requests/month free) cover companies whose ATS is unknown.

### Cited Findings
- Greenhouse: "Job Board data is publicly available, so authentication is not required for any GET endpoints." `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs`; `content=true` adds full description, departments and offices. No rate limit is documented — [Greenhouse Job Board API docs](https://developers.greenhouse.io/job-board.html)
- Lever: `GET https://api.lever.co/v0/postings/{slug}?mode=json`, no auth. Ashby: `GET https://api.ashbyhq.com/posting-api/job-board/{name}?includeCompensation=true`, no auth — [Apify ATS actor docs](https://apify.com/oddsmith/ats-job-board.md)
- Lever has "no published GET limit" and Greenhouse "no published rate limit"; both need no signup — [Jobspipe, 2026](https://jobspipe.dev/blog/free-job-api)
- Adzuna: free registration, default 25 calls/min, 250/day, 1,000/week, 2,500/month — [Jobspipe](https://jobspipe.dev/blog/free-job-api)
- JSearch (RapidAPI, aggregates Google for Jobs): 200 requests/month free; Pro $25/month for 10,000 requests, then $0.003/request — [Jobspipe](https://jobspipe.dev/blog/free-job-api)

### Inferences
- Pipeline approach: fetch the company careers page (Jina/Firecrawl), regex for `boards.greenhouse.io/`, `jobs.lever.co/`, `jobs.ashbyhq.com/` to get the slug, then call the public API. Hiring for finance/AP/ops roles is a strong outreach hook for a finance-automation product like Zamp.
- Many Indian companies use other ATSs (Darwinbox, Keka, Zoho Recruit, Workday). There, fall back to JSearch, or to web search for "careers" + role.

### Gaps
- Adzuna India coverage was not confirmed in fetched sources. I believe Adzuna has an `in` country endpoint, but this is unverified.
- No official Lever/Ashby docs were fetched; endpoints are confirmed only through a third-party actor's docs.

## 4. Funding signals (Crunchbase, Tracxn, free alternatives)

### Takeaway
There is no good free funding API. Crunchbase's paid API starts at about $500/month, and its free Basic API has been gone since 2023. For a demo, take funding signals from news search (Tavily/Serper news queries like "<company> raises" / "Series") and let the LLM extract round, amount and date with citations. SEC EDGAR is free for US filings only. Indian startups need news (Inc42, Entrackr, YourStory) via search.

### Cited Findings
- Crunchbase free Basic API discontinued in 2023; paid starts at roughly $500/month — [The NextGen Nexus](https://thenextgennexus.com/2026/05/14/crunchbase-killed-its-free-api-heres-how-to-rebuild-it-2026/)
- Free substitutes for firmographics: WHOIS, DNS, crt.sh, GitHub org API, sitemap, OG metadata. SEC EDGAR is fully free. Private funding rounds otherwise "require Crunchbase, PitchBook, or a human research team" — [The NextGen Nexus](https://thenextgennexus.com/2026/05/14/crunchbase-killed-its-free-api-heres-how-to-rebuild-it-2026/)
- Alternatives roundups exist (Fundable, Fundz) — [Fundable](https://www.tryfundable.ai/blog/crunchbase-api-alternatives) (not fetched)

### Inferences
- Funding via news search plus LLM extraction is good enough for a demo, but it can mis-attribute rounds for companies with similar names. Filter by company domain and show the source URL in the UI.

### Gaps
- Tracxn API pricing and availability were not found (likely enterprise/sales-led). For Indian private companies, the MCA filings route (via paid aggregators such as Tofler) was not researched.

## 5. Company site scraping (Firecrawl, Jina Reader)

### Takeaway
Jina Reader (`https://r.jina.ai/<url>`) returns clean markdown with no key needed, at lower rate limits. That makes it the simplest zero-setup option. Firecrawl gives 1,000 free credits/month (2 concurrent requests) and handles crawl/map/extract. Use Jina as primary for single pages and Firecrawl for multi-page crawls or as fallback.

### Cited Findings
- Firecrawl: 1,000 credits/month free, no card, refreshed monthly; free tier limited to 2 concurrent requests; strongest at crawling/extraction — [Parallel.ai](https://parallel.ai/articles/best-free-web-search-api.md)
- Jina Reader works without an API key (free, lower rate limits); higher limits with a key; returns 429 with Retry-After — [Rhumb](https://rhumb.dev/service/jina-ai). Jina also has an `s.jina.ai` search-grounding endpoint — [Jina blog](https://jina.ai/news/jina-reader-for-search-grounding-to-improve-factuality-of-llms)

### Inferences
- Cache scraped pages (company homepage, /about, /careers, /blog, /press) on disk by URL and date. This avoids repeated calls during a live demo and protects against 429s.

### Gaps
- Exact Jina Reader RPM (keyless vs free key) and its free token grant could not be confirmed. Historically about 20 RPM keyless, about 200 RPM with a key, and 10M free tokens for new keys, all unverified for 2026.

## 6. LLM-native web search tools (OpenAI, Anthropic, Gemini grounding)

### Takeaway
All three major model APIs have built-in search at about $10-14 per 1,000 searches plus tokens for injected content. Gemini 3.x includes 5,000 free grounded prompts/month, so it is effectively free for a demo. These tools cut integration work (one call does search, reading and synthesis with citations), but you get less control over sources and query fan-out can multiply cost.

### Cited Findings
- Anthropic web search tool (`web_search_20250305`): $10 per 1,000 searches, plus tokens. It supports max uses per request, allowed/blocked domains and user location, and returns citations — [Simon Willison, May 2025](https://simonwillison.net/2025/May/7/anthropic-api-search)
- OpenAI web search tool: about $10 per 1,000 calls plus content-token charges. Gemini grounding with Google Search: Gemini 3.x gives 5,000 grounded prompts/month free, then about $14/1,000; Gemini 2.5 about $35/1,000. Real costs run higher because of query fan-out and injected-token charges — [API Serpent, Jun 8 2026](https://apiserpent.com/blog/reduce-llm-web-search-grounding-cost)
- Perplexity Sonar (search + answer in one call): see section 1 — [Puter](https://developer.puter.com/tutorials/perplexity-api-pricing/)

### Inferences
- For a 1-week demo, an explicit retrieval layer (Tavily/Serper + Jina) gives inspectable, cacheable evidence, so you can show "signal → source URL → line in email". That beats an opaque built-in search call for demonstrating trustworthiness. Built-in search (Claude/Gemini) works well as a fallback "research agent" step when the explicit sources return little.

### Gaps
- OpenAI pricing for reasoning-model web search versus non-reasoning was not confirmed (there is a community thread on the difference — [OpenAI forum](https://community.openai.com/t/web-search-pricing-for-reasoning-models/1377274)). Check Anthropic's current docs for any price change after May 2025.

## 7. Recommendation: most demo-reliable minimal stack

### Takeaway
Minimal stack:
- Tavily (primary search + news, free 1k credits/month). Fallback: Serper (Google SERP/news JSON) or Exa ($10 free monthly).
- Jina Reader (company pages). Fallback: Firecrawl.
- Greenhouse/Lever/Ashby public APIs (hiring signals). Fallback: JSearch.
- Apollo free API or PDL free 100 lookups (person/company firmographics). The user supplies the LinkedIn URL; never scrape LinkedIn.
- Funding from news search plus LLM extraction.
- An LLM with built-in search (Claude web search, or Gemini grounding with its 5k free/month) as a last-resort research step.
- A local cache (SQLite/JSON keyed by domain + source + date) and pre-warmed "golden" prospects for the live demo.

### Cited Findings
- Free allowances supporting the stack: Tavily 1,000 credits/month; Exa $10/month; Firecrawl 1,000 credits/month — [Parallel.ai](https://parallel.ai/articles/best-free-web-search-api.md); Gemini 3.x 5,000 grounded prompts/month — [API Serpent](https://apiserpent.com/blog/reduce-llm-web-search-grounding-cost); Apollo free 600 API calls/day — [Apollo docs](https://docs.apollo.io/reference/rate-limits.md); PDL 100 lookups/month — [Pin.com](https://pin.com/blog/best-people-search-apis); Greenhouse keyless GETs — [Greenhouse docs](https://developers.greenhouse.io/job-board.html)
- Sources to avoid or demote: Brave (no free tier since Feb 2026) — [Implicator](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/); NewsAPI/GNews (delayed, dev-only) — [SocialCrawl](https://www.socialcrawl.dev/blog/best-google-news-apis-2026.md); Proxycurl (defunct) — [Nubela](https://nubela.co/blog/goodbye-proxycurl/); Clearbit (sunset) — [Abmatic](https://abmatic.ai/blog/clearbit-enrichment-api-2026); Crunchbase (~$500/month) — [NextGen Nexus](https://thenextgennexus.com/2026/05/14/crunchbase-killed-its-free-api-heres-how-to-rebuild-it-2026/)

### Inferences
- Demo-reliability tactics: (1) pre-run and cache all demo prospects the night before; (2) run each source with a timeout of about 8s and degrade gracefully (skip a signal rather than fail the draft); (3) keep a provider-abstraction layer so you can swap Tavily and Serper with one env var; (4) store source URL + snippet + fetched_at for every signal and show them in the UI as evidence; (5) back off on 429s (Jina, Apollo); (6) keep API keys server-side.
- Compliance framing for the demo: use only public web pages, official/keyless APIs and licensed vendor APIs. Do no LinkedIn fetching and send no emails automatically (drafts only). Because the builder is in India, India's DPDP Act 2023 may apply to processing personal data of prospects. This is not researched here; flag it for the report-writer.

### Gaps
- No independent uptime/reliability statistics were found for any of these providers.
- India-specific payment friction (foreign card billing for Serper/SerpAPI/Brave) and DPDP Act applicability to B2B outreach data were not researched.
