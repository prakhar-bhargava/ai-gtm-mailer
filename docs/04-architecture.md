# Architecture

Status: proposed. Change anything here, but record the change and the reason in LEARNING.md under "Decisions".

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript | One codebase for UI and API routes; deploys to a public link in minutes. |
| UI | Tailwind + shadcn/ui | Good-looking run view and dashboard without design time. |
| Hosting | Vercel | The submission needs a live link. Set `maxDuration` on the run route (pipeline should finish in under 60 s). |
| Database | Supabase Postgres (free) | Runs, events, signals, drafts persist across deploys. SQLite files do not persist on Vercel. |
| Live updates | Server-Sent Events from the run route, plus events written to the DB | The run view streams stages; the dashboard and reloads read from the DB. |
| LLM | One wrapper (`lib/llm.ts`) over whichever provider you have a key for (Claude, Gemini or OpenAI). Structured output validated with zod. | Lets you swap models; Gemini's free tier helps if budget is tight. |
| Search and news | Tavily (1,000 free credits a month), fallback Serper or Exa | Returns snippets, URLs and often dates. |
| Page reading | Jina Reader (`https://r.jina.ai/<url>`), fallback Firecrawl | Clean markdown of company pages without a scraper. |
| Hiring | Greenhouse, Lever, Ashby public job board APIs (no key), fallback JSearch | Finance and ops hiring is a strong Zamp-relevant signal. |
| Firmographics | Apollo free API, fallback People Data Labs (100 lookups a month) | Size, industry, title confirmation. |
| Funding | News search plus LLM extraction | No useful free funding API (Crunchbase API is about $500 a month). |

Verify free-tier numbers on day 1; they come from 2026 comparison posts and change often (see docs/research/notes/data_sources.md).

Not used: LinkedIn scraping of any kind, Proxycurl (shut down July 2025), Brave free tier (ended Feb 2026), Clearbit free tools (ended 2025), NewsAPI/GNews free tiers (delayed, dev-only terms).

Python alternative if you prefer it: FastAPI + SSE backend, Streamlit or a small React front end. Same pipeline and data model.

## Folder layout

```
app/
  page.tsx                  # new run form + demo prospects
  runs/[id]/page.tsx        # live run view + review
  dashboard/page.tsx        # history and metrics
  settings/page.tsx         # seller brief
  api/runs/route.ts         # POST create run
  api/runs/[id]/stream/route.ts   # GET SSE: executes pipeline, streams events
  api/runs/[id]/resolve/route.ts  # POST rep picks entity (edge case 1)
  api/runs/[id]/review/route.ts   # POST approve / edit / reject
lib/
  pipeline/
    index.ts                # orchestrator: runs stages, emits events, handles pause
    resolve-identity.ts
    gather/
      news.ts  person-content.ts  jobs.ts  company-site.ts  firmographics.ts
    normalise.ts
    filter.ts               # entity match, freshness, sensitivity, role change
    hooks.ts                # generate candidates
    score.ts                # rubric
    draft.ts
    verify.ts               # claim check + style lint
  sources/                  # thin API clients with timeout + cache
  llm.ts
  cache.ts                  # key: source + query + date bucket
  db.ts
  types.ts                  # zod schemas shared by everything
config/
  seller-brief.zamp.json
  rubric.json               # weights and thresholds, tunable
  sensitive-topics.json
fixtures/
  demo-prospects.json       # golden prospects for happy path + edge cases
  replays/                  # cached runs for replay mode
docs/                       # this folder
```

## Data model

```
runs(id, prospect_name, company, role, domain, linkedin_url, notes,
     status, mode[live|replay], outcome[draft|draft_flagged|abstained|stopped],
     top_score, started_at, finished_at, duration_ms, error)

run_events(id, run_id, stage, status[started|progress|done|failed|paused],
           message, data_json, at)

signals(id, run_id, type, about[person|company], claim, snippet,
        source_url, source_name, published_at, fetched_at,
        entity_match, status[used|background|blocked|dropped], block_reason)

hooks(id, run_id, text, signal_ids[], pain, why_zamp, why_now,
      scores_json, total, rank, chosen bool, reject_reason)

drafts(id, run_id, version, subject, body, claims_json, lint_json,
       is_final bool, created_at)

reviews(id, run_id, action[approve|edit_approve|reject], reason_code,
        final_body, edit_distance, review_ms, at)
```

## Pipeline contract

Every stage is a function `(ctx) => Promise<StageResult>` and the orchestrator wraps it to:
1. emit `started`,
2. enforce a stage timeout,
3. catch errors and emit `failed` without killing the run when the stage is optional (all gather sources are optional; identity, hooks and draft are required),
4. emit `done` with a short human-readable summary ("Found 7 signals, 2 blocked as sensitive").

Event messages are written for the rep, not the developer. They are what the interviewers will read on screen.

## Reliability for the live demo

- Every source call: 8 s timeout, one retry with backoff on 429, cached by key.
- Pre-run all demo prospects the night before; the cache makes live runs fast and survivable.
- Replay mode replays a stored run's events with original timing. Labelled "replay" on screen. Use only if live fails, and say so.
- Health check page that pings each source and shows green or red. Open it before the interview.

## Environment variables

```
LLM_PROVIDER=anthropic|gemini|openai
ANTHROPIC_API_KEY= / GEMINI_API_KEY= / OPENAI_API_KEY=
TAVILY_API_KEY=
SERPER_API_KEY=        # fallback
APOLLO_API_KEY=
PDL_API_KEY=           # fallback
FIRECRAWL_API_KEY=     # fallback
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit `.env*`. Add them to Vercel project settings for the deployed link.
