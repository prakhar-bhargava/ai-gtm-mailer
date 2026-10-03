# Learning log

A running record of what I learned while building this, the decisions I made and why, and the assumptions I'll need to defend in the interview. Newest entries at the top of each section. Claude adds to this as we work (see CLAUDE.md); I edit freely.

Entry format:

```
### YYYY-MM-DD: short title
What: the thing learned or decided.
Why it matters: how it changes the build or the pitch.
Interview line: one sentence I could say out loud.
Source: link or file, if any.
```

## Decisions

### 2026-10-03: Problem statement PS-3, personalised outreach
What: Chose PS-3 over invoice processing (PS-1) and vendor onboarding (PS-2).
Why it matters: GTM is the closest fit to a product and HCI background, and Zamp lists a "GTM Associate" among its own AI employees, so the build doubles as a demo of their product category.
Interview line: "I picked the problem where judgment about people matters most, because that's where automation usually breaks."

### 2026-10-03: Compete on trust, not on text
What: The differentiator is traceability (every claim cited), explicit hook ranking, abstaining when there's nothing good to say, and a sensitivity filter.
Why it matters: The documented failure of AI SDR tools is untrustworthy personalisation. None of the tools reviewed documents per-claim citations, explicit hook ranking or first-touch abstention.
Interview line: "Signals are cheap. A draft a rep can trust in ten seconds is the scarce thing."
Source: docs/research/zamp-outreach-research.md

### 2026-10-03: No LinkedIn scraping
What: Accept a LinkedIn URL as input only; never fetch linkedin.com. Use web search for posts and talks, licensed APIs for role data.
Why it matters: Proxycurl shut down in July 2025 after LinkedIn sued; LinkedIn v. ProAPIs ended in a consent judgment in September 2026; hiQ paid $500K and accepted an injunction. Scrapers also break live.
Interview line: "The best signal in the world is worthless if it gets my customer's account banned or breaks mid-demo."
Source: docs/research/notes/data_sources.md

### 2026-10-03: Proposed stack
What: Next.js + TypeScript on Vercel, Supabase Postgres, SSE for live stages, Tavily / Jina / public job board APIs / Apollo for signals, one LLM wrapper.
Why it matters: One codebase, a public link from day 2, persistence across runs for the dashboard.
Interview line: "I chose tools that let me ship a live link on day two and spend the rest of the week on judgment."
Source: docs/04-architecture.md

## Assumptions (to quote in the live pitch)

- The seller is Zamp; prospects are finance and ops leaders at companies with heavy AP or procurement volume.
- Drafts only. Sending, sequences and deliverability are out of scope.
- A rep prefers fewer, better drafts and an honest "nothing to say" over a weak personalised line.
- For director level and above, company-level hooks beat personal ones (Gong Labs).
- Rubric weights are starting hypotheses, to be tuned by reviewer reject reasons.
- Public web data is enough for most enterprise prospects.

## Decisions

### 2026-10-03: Run executes inside the stream request, no run store yet
What: The SSE route (GET /api/runs/[id]/stream) runs the whole pipeline and streams its events. There is no POST create route and no in-memory run store. The new-run form puts the prospect in the URL query.
Why it matters: Vercel serverless instances do not share memory, so a run created on one instance can't be read from another. Reloading the run page starts it again. Supabase in Day 2 replaces this with a stored run.
Interview line: "The first version has no state on the server, so there's nothing to lose when a function instance is recycled."
Source: docs/04-architecture.md (route list differs for now)

## Decisions

### 2026-10-03: Retries back off on 429 and 503, within one time budget
What: Transient errors (429, 503) retry at 2, 5 and 10 seconds (config/llm.json). The whole model call stops at 35 seconds, and the draft stage at 40. Schema failures still get one retry, with the problem described.
Why it matters: Retrying forever would push past the 60-second route limit on Vercel, so the budget is capped. Total time for a full run is roughly identity (under 1 s) + gather (under 2 s) + hooks (under 1 s) + draft (up to 40 s).
Interview line: "The retries have a budget, so a busy model slows a run down but can't hang it."
Source: docs/04-architecture.md (reliability rules)

## Things I learned

### 2026-10-03: Gemini model names and overloads
What: `gemini-2.5-flash` and `gemini-2.5-flash-lite` return 404 on this key, though they appear in the model list. `gemini-flash-latest` and `gemini-flash-lite-latest` work. Google also returns 503 "high demand" for minutes at a time, which is separate from the 429 rate limit.
Why it matters: the model name lives in config/llm.json, not code. Both 429 and 503 get one retry, and a busy model gets a plain message ("Try again in a minute") instead of a generic failure.
Interview line: "A model that's overloaded is a different failure from a rate limit, so the app tells the rep to wait rather than retrying forever."
Source: config/llm.json, lib/llm.ts

### 2026-10-03: SSE has to be closed by the client on error
What: EventSource reconnects automatically when the stream ends or errors. The run view closes the connection on the final `run` event and on error, so a finished run isn't replayed.
Why it matters: Without this, every finished run would start again.
Interview line: n/a.

### 2026-10-03: Next 16 route params are a Promise
What: `params` and `searchParams` must be awaited in route handlers and pages. Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md.
Why it matters: Copying older examples gives a type error or undefined values.
Interview line: n/a.

### 2026-10-03: Toolchain is newer than expected
What: Scaffold landed on Next.js 16.3 (Turbopack default), React 19.2, Tailwind 4, Node 24 LTS, npm 11. npm 11 blocks package install scripts unless approved, so esbuild (needed by tsx) and unrs-resolver (ESLint) had to be approved with `npm approve-scripts`. Next 16 ships its own docs in node_modules/next/dist/docs; read those before writing route code (see AGENTS.md).
Why it matters: Older Next.js tutorials may not match; a silently skipped postinstall would break the test runner.
Interview line: n/a.

### 2026-10-03: What the brief actually grades
What: It runs live; the judgment behind choices; the UI (live run view and dashboard are named explicitly); explaining to a non-technical buyer; demo composure. A process that runs on the happy path beats one that's 80% built.
Interview line: n/a, this shapes the plan.
Source: docs/01-assignment-breakdown.md

### 2026-10-03: Evidence on cold outreach is mostly vendor correlation
What: Personalised cold emails reply around 7% vs 3% for generic (Belkins, 5.5M emails). Length barely matters (Hunter: 3.4 to 4.5% across all lengths). Interest CTAs beat meeting asks (Gong, 304k emails). 58% of replies come on the first email (Instantly). Unjustified personalisation backfires (2008 Marketing Letters "boomerang effect"). No controlled study ranks signal types.
Why it matters: The rubric is a hypothesis; say so and show the feedback loop that would tune it.
Interview line: "Most numbers in this space are vendor correlations, so I built the rubric to be tuned, not trusted."
Source: docs/research/notes/outreach_evidence.md

### 2026-10-03: Who Zamp is
What: zamp.ai, founded 2022 by Amit Jain (ex Sequoia India, ex Uber APAC). Started in crypto banking, now sells "AI employees" for finance and ops; invoice processing is the main proof point. Customers on the site include Uber, DoorDash, Noon, Mindbody, Wio Bank. Not zamp.com (a sales tax company). There is no public "AI Solutions Associate" posting; the closest is AI Solutions Analyst (requirements to workflow spec, test, rollout, ROI).
Interview line: "I framed the build the way your Solutions team works: spec, test, roll out, measure."
Source: docs/research/notes/zamp_company.md

### 2026-10-03: How incumbents structure it
What: Three patterns. Table builders (Clay, Apollo AI Research) where each research step is a column; chat-first agents (11x Alice, Regie, Artisan); CRM-embedded agents (Agentforce SDR, HubSpot Breeze) with review on the lead timeline. Lavender scores drafts instead of writing them.
Worth borrowing: preview a few rows before a full run (Apollo), manual review before auto-send (Breeze), a positioning step before writing (11x).
Source: docs/research/notes/competitor_tools.md

## Glossary

- Signal: a dated, sourced fact about a person or company (a hire, a round, a quote).
- Hook: the premise of the email; one signal tied to a pain the seller solves.
- Abstain: deliberately produce no personalised draft because no hook clears the bar.
- Entity resolution: deciding that the "Rahul Sharma" in a source is the same person the rep meant.
- Grounding: making the model's claims depend on retrieved sources rather than its memory.
- SSE (Server-Sent Events): a one-way stream from server to browser; how the run view updates live.
- Edit distance: how many characters the rep changed before approving; a proxy for draft quality.
- Fail soft: a failed step degrades the output instead of stopping the run.

## Test results

Live runs on the local app, real public companies, keyless sources and Gemini. Run on 2026-10-03.

| Case | Input | What happened | Result |
|---|---|---|---|
| Happy path | Stripe, stripe.com | 70 finance or ops roles found; news found; top hook 61/100 (sales hiring) | Pass: draft flagged, claim check caught an overstated "multiple" roles claim |
| Sensitive gate | Stripe (earlier run) | One hook blocked, shown greyed with reason | Pass: blocked hook never ranked first |
| Same-name news | Basecamp | Headlines named a different company with the same name (biotech); the same-company check removed it | Pass after fix. Before the fix, a wrong-company claim passed the claim check |
| Thin signals | Intel, Basecamp | Hooks scored 52 to 57; below 70, so drafts flagged | Pass as flagged. Abstain (below 50) not yet hit on a live company |
| Abstain | none yet | — | Not tested live |
| Identity ambiguity (edge case 1) | — | Not built | Not tested |
| Role change (edge case 4) | — | Not built | Not tested |

Known gaps from these runs:
- Relevance scores come from the model, so a sales-hiring hook can still score 61. The prompt now says sales hiring is not a finance pain; it's a hypothesis to tune.
- Drafts run short (36 to 45 words) and the style lint flags them. The hard limit is 35 to 130 words; the target is 50 to 100.
- Google's model returned "high demand" often. The app retries and falls back to a second model.

| Date | Change | Happy path | EC1 | EC2 | EC3 | EC4 | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Feedback from real people

(Reactions from salespeople who look at drafts, with date.)
