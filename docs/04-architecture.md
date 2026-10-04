# Architecture

Status: as built on 2026-10-03, with the planned pieces marked. Change anything here, and record the change and the reason in LEARNING.md under "Decisions".

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router) + TypeScript, strict | One codebase for the UI and the API routes. |
| UI | Tailwind 4 + shadcn/ui, one shared `Section` panel | One look across screens. |
| Runtime | Runs locally with `npm run dev` or `npm start` | Decided 2026-10-03: local only for now. Public access by tunnel is decided later. Vercel is not used. |
| Database | Local SQLite file `data/app.db` through Node's built-in `node:sqlite` | No install and no hosted account. Git ignores the file. |
| Live updates | Server-Sent Events from the stream route; events are saved to the DB first | A reload or a second tab replays the saved run and follows it while it runs. |
| LLM | Gemini through `@google/genai`, model list in `config/llm.json` | Structured output checked by zod. Busy and rate-limited responses retry and switch model. |
| Company website | A local headless browser (Playwright, `lib/sources/crawler.ts`), with a plain-HTML fallback when the browser isn't installed | No key and no model tokens. Up to 8 pages per company (home, about, careers, newsroom, blog), robots.txt respected, images and fonts skipped. Each page's title, description, headings, dated posts, structured data and links are read from the DOM and streamed to the run's feed. |
| News | Google News RSS (keyless) | Matches words, so a model check confirms each headline is about this company. |
| Hiring | Greenhouse and Ashby public job board APIs (keyless). Board names come from the site's own links first, then guesses. | Finance and ops hiring is a strong signal for Zamp. |
| Social and LinkedIn | Stored as references only, never fetched | The project rule. LinkedIn is never fetched or scraped. |
| Rate limit | One limiter for every outside request: 4 per minute (`config/pipeline.json`) | Keeps the model and the sources within free-tier limits. |

Not used: LinkedIn scraping of any kind, Proxycurl (shut down July 2025), paid search tiers, Supabase (see Decisions).

Planned, not built: Apollo or People Data Labs for firmographics, Tavily or Serper as search fallbacks, Firecrawl as a page-reading fallback.

## Folder layout

```
app/
  page.tsx                          new run form, recent searches
  runs/[id]/page.tsx                run view, draft and Send panel
  dashboard/page.tsx                searches, filters, analytics
  accounts/page.tsx                 companies and people, with LinkedIn references
  outbox/page.tsx                   sent mails
  outbox/[id]/page.tsx              one mail, shown exactly as stored
  not-found.tsx
  api/runs/route.ts                 POST create a search, GET list
  api/runs/[id]/stream/route.ts     GET SSE: runs a new search, or follows a saved one
  api/runs/[id]/send/route.ts       POST save a reviewed draft to the Outbox
components/
  run-form.tsx  run-view.tsx  send-panel.tsx  analytics-section.tsx  section.tsx
  ui/                               shadcn components
lib/
  pipeline/
    index.ts                        orchestrator: order of stages, outcome
    stage.ts                        runs one stage: timeout, events, shared context
    stages/                         one file per stage (see Pipeline)
    prompts.ts                      prompts for hooks, draft and claim check
    score-hooks.ts                  rubric scoring, code side
    sensitivity.ts  lint.ts  links.ts  domain.ts
  sources/                          http.ts (timeout, 429 retry, cache), google-news.ts,
                                    job-boards.ts, crawler.ts
  llm.ts                            model client: rate limit, retries, schema check, answer cache
  rate-limit.ts                     the shared request limiter
  trail.ts                          notes from inside a step, without passing a logger
  cache.ts                          source and answer cache in the DB
  db.ts                             schema and migration
  runs.ts  accounts.ts  outbox.ts  analytics.ts  signature.ts
  types.ts                          zod schemas shared by everything
config/
  pipeline.json                     rate limit, timeouts, cache hours
  llm.json                          model list, retry delays
  rubric.json                       weights, bands, thresholds, banned phrases
  sensitive-topics.json
  sources.json                      news window, news and role keywords
  seller-brief.zamp.json            what Zamp sells, pains, value line, tone
  sender.json                       sender name, company and sign-off (fill in)
fixtures/
  demo-prospects.json               sample prospects for testing drafts and sending
data/                               app.db (git-ignored)
docs/                               this folder
```

## Pipeline

Order, from `lib/pipeline/index.ts`:

1. **identity** (required). Checks the company's website answers. A typed website is trusted; a guessed one is labelled as a guess. Also saves the company to the accounts list.
2. **company_site** (optional). Reads the about page, falling back to the homepage. Its first sentence is the company description, used to tell same-name companies apart. Cookie text is skipped.
3. **discover** (optional). Reads the company's own HTML, then follows its useful pages (about, news, press, blog, careers, team) up to 2 levels deep and 4 pages in total. Records social profiles (not fetched), job-board links (used by the jobs step), and the company's LinkedIn page as a reference.
4. **news** and **jobs** (optional, run in parallel). News: headlines that name the company and read like business news, then a model check that each one is about this company. Jobs: open finance and ops roles on Greenhouse or Ashby.
5. **hooks** (required). The model proposes 3 to 5 hooks citing signal IDs. Code scores them with the rubric (recency, verifiability, authorship and seniority are scored in code; relevance and specificity come from the model). Sensitive topics block a hook; blocked hooks stay on screen.
6. **Decision.** If no unblocked hook scores at least 50, the run ends as **abstained**: no draft, and two options are shown.
7. **draft** (required). Writes subject and body from the best hook, citing only its signals. The seller's approved value line is used as written.
8. **verify** (optional). Checks each claim against its signal, asks whether the body states any uncited fact about the prospect, and lints the style. A failed check or a score under 70 makes the draft **flagged**; otherwise it is **draft**.

Outcomes: `draft`, `flagged`, `abstained`, `stopped` (a required step failed).

Every step emits `started`, then zero or more `progress` notes (requests made, waits for a free slot, saved copies used), then `done` or `failed`. The final `run` event carries the outcome. Messages are written for the rep.

## Data model

Tables in `data/app.db`:

```
runs(id, prospect_json, status[new|running|finished], outcome, created_at, finished_at)

run_events(id, run_id, stage, status[started|progress|done|failed], message,
           duration_ms, payload_json, at)
  payload_json holds, when present: domain, signals[], hooks[], draft, outcome.
  Signals keep source_url, published_at (null = undated) and fetched_at.

cache(key, body, stored_at)          source pages, feeds and model answers, 24 h

companies(id, name, domain, job_board, social_json, company_linkedin_url, updated_at)
people(id, name, role, company_id, linkedin_url, updated_at)

outbox(id, run_id, to_name, to_company, subject, body, sent_at)
  body is the mail exactly as sent, signature included.
```

Planned, not built: `signals`, `hooks` and `drafts` as their own tables (today they live inside `run_events.payload_json`), `reviews` (approve, edit, reject with reason, edit distance, review time).

Old saved data stays readable: defaults are used for fields added later, and an event that no longer matches the schema keeps its message but drops its payload.

## Reliability

- Every outside call goes through `takeSlot()` (4 per minute) and has an 8 s timeout. Source calls retry once after 429. Model calls retry on 429 and 503 with delays 2, 5 and 10 s, switching to the second model in the list.
- Every answer is cached by its exact prompt for 24 h, so a repeat search costs no model calls.
- Each model answer is checked against its schema; a bad answer is retried once with the problem described.
- A run that crashes still ends as `stopped`. A live connection gives up after 2 minutes without new events.
- A search that is already running or finished never runs again: its page replays the saved events.

Planned, not built: a replay mode that re-runs a stored search with original timing, labelled "replay", and a health check page that pings each source. Both are needed for the interview.

## Environment variables

```
LLM_PROVIDER=gemini                    # only gemini is wired up
GEMINI_API_KEY=                        # in .env.local only
```

Planned, not wired: `TAVILY_API_KEY`, `SERPER_API_KEY`, `APOLLO_API_KEY`, `PDL_API_KEY`, `FIRECRAWL_API_KEY`.

Never commit `.env*` (git ignores them). `data/` is also git-ignored.
