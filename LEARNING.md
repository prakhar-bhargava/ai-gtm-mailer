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

### 2026-10-04: A denser, balanced dashboard
What: One 12-column grid with a shared card shell and one type scale, rows whose cards share a height, six tiles in a single row, the run table capped at 20 compact rows, and SVG charts drawn at 1:1 so their labels match the page. The page went from about 8,500 px tall to about 3,000. Desktop only, at the user's request.
Why it matters: Scaled SVGs had made chart text anywhere from 9 to 17 px; now every label is 10 to 11 px.

### 2026-10-04: "Ready to review" from 50, not 70
What: At the user's request, an angle of 50 or more can now be ready to review when every claim is backed and the check finds no issues. The dashboard's "Bring runs up to date" card re-checks flagged runs against the new rule (only runs that pass every check move) and can re-run flagged prospects with the current pipeline. Old runs whose claims weren't backed stay flagged: changing their result would misreport them.
Why it matters: The claim check and guardrails now carry the weight the higher score used to.
Interview line: "The score decides whether to write; the checks decide whether it's ready."

### 2026-10-04: Wider free search
What: Google News is searched twice (the name, and the name plus business-event words) and Bing News once, merged and de-duplicated. Job boards now include Lever, SmartRecruiters and Workable next to Greenhouse and Ashby. The links step reads the company's own RSS or Atom feed. Rep-pasted LinkedIn text becomes cited "profile" signals (authorship 10 of 10).
Why it matters: More real, dated facts for the one writing call, still with no keys and no tokens. Palantir drafted from 12 finance roles found on Lever.
Interview line: "More sources, same cost: every new source is free and keyless."

### 2026-10-04: Designed mails with React Email
What: Each draft can be laid out as Letter, Card (logo header, customer story as a callout, booking button) or Quote (story as a pull quote), rendered with React Email to table-based, inline-styled HTML and previewed live. Gmail's compose link is plain text, so the design reaches Gmail through the clipboard. Letter stays the default: heavy HTML on a first cold email can hurt inbox placement.
Why it matters: A well-designed mail without hand-written email HTML.
Source: lib/email/templates.tsx, docs/13-product-review.md

### 2026-10-04: One Gemini call per run
What: The run used 4 model calls (same-company news check, rank hooks, write, verify): about 3,200 tokens in and 430 out, plus thinking tokens, and up to 8 calls with format retries. All non-writing calls moved to code: a same-company check on headlines (lib/pipeline/same-company.ts), angle ranking from a lexicon built on the seller brief (config/hook-lexicon.json), and a claim check by numbers and word overlap (lib/pipeline/claim-check.ts). The one remaining call gets the top 3 angles and writes. Thinking is off. The 4-a-minute limiter now applies to the model only, and every run records its usage (lib/usage.ts), shown on the run page and the dashboard.
Why it matters: 75% fewer calls, a run is no longer stuck behind its own rate limiter, the ranking is the same every time, and the model can't overrate a weak signal (it had scored a revenue estimate 30 of 35 for relevance against its own instructions).
Interview line: "Everything I can check with a rule is a rule; the model does the one thing rules can't, which is write."
Source: docs/06-hook-rubric-and-writing-rules.md, docs/11-system-constraints.md

### 2026-10-04: Actionable subjects, a customer story in every mail, sourced figures only
What: At the user's request, subjects now name the company, the fact and the outcome (5 to 14 words), and the body runs greeting, premise, customer story, how Zamp helps, one question, 70 to 130 words and never under 50. Customer stories and figures come only from `proof` in the seller brief, each with a public source. Zamp publishes no effort or hours-saved percentage (checked zamp.ai on 2026-10-04: only "99%+ accuracy" and "live in four days", plus the Mindbody and Wio Bank quotes), so the app won't invent "Z% less effort"; a sourced figure can be added under `proof.impact`.
Why it matters: A longer, more concrete mail without a single made-up number.
Interview line: "If Zamp gives me a real hours-saved number, it goes in one config line; until then the mail only says what Zamp itself publishes."
Source: docs/09-mail-guardrails.md, https://zamp.ai

### 2026-10-04: A signature the rep owns, with the logo
What: Default signature Prakhar, +91 9899326396, Zamp, zamp.ai, with the Zamp logo; editable under any draft and stored in a `settings` table. Copy formatted carries the logo; the Gmail link can't.
Why it matters: Each rep sends as themselves without editing config files.
Interview line: "Set it once, and every draft and Outbox mail carries it."

### 2026-10-04: Landing page and a Zamp-inspired visual language
What: A landing page at / with the trial CTA, features, a comparison table, the research synthesis, and the Beta and rolling-out list from config/features.json. The app moved to /app. Grey canvas, black ink, black pill buttons with monospace labels, electric blue, generated pixel-dither art. No Zamp logo, wordmark or customer logos, and the footer says it is not affiliated.
Why it matters: The interviewers see their own design language applied with judgment, not copied.
Interview line: "I borrowed the grammar of your brand, not the words."

### 2026-10-04: Read websites with a headless browser, not an AI reader
What: lib/sources/crawler.ts drives Playwright Chromium: up to 8 pages, robots.txt respected, images and fonts skipped, data read straight from the DOM (title, description, headings, dated posts, schema.org facts, links). A plain-HTML fallback runs when the browser isn't installed. It replaced Jina Reader.
Why it matters: No tokens or rate-limited requests for reading, much more data per page, and it renders JavaScript sites. Intel answers a plain fetch with 403 but loads in the browser (133 links).
Interview line: "Reading the web costs nothing now; the model only ranks, writes and checks."

### 2026-10-04: Show the working while it runs
What: A step graph, a live feed of every page and finding, and a compose window that writes itself in a purple-pink gradient, following the latest finding, then the top angle, then the real draft.
Why it matters: Trust comes from seeing the evidence arrive, and a 30-second wait feels like work being done, not a spinner.
Interview line: "You can watch it read before you trust what it writes."

### 2026-10-04: Gmail compose link as the send step
What: Open in Gmail opens compose with the recipient, subject, paragraphs and signature filled in, and records the email in the Outbox. Copy formatted puts an HTML version on the clipboard. Name, organisation, website and recipient email are now required on the New run form.
Why it matters: The human still presses Send, in their own mailbox, with no OAuth app to build or verify.
Interview line: "The last click is always the rep's."

### 2026-10-04: Animated replays for demos
What: /replay/<name>?live=1 plays a recorded run step by step at about half a minute, with no model or network calls. Recorded runs were enriched with a real crawl of each company's site (scripts/enrich-replays.ts); recorded signals, angles and drafts were not touched.
Why it matters: The live demo survives a missing key, a rate limit or bad Wi-Fi.

### 2026-10-03: Screens redesigned around one job each
What: One top bar (New run, Runs, Outbox, Accounts). New run asks only for name and company; the rest is optional and hidden. The run page shows the steps while running, then puts the email first as a letter: sourced sentences underlined and numbered, notes underneath, teal when the source supports the sentence and amber when it doesn't. Reasoning and sources sit on the right; steps fold into one line. Runs page: four numbers, filter tabs with counts, one table, then a short reliability section.
Why it matters: The rep's decision is "can I send this?", so the draft and its evidence lead. Colour only means something (blue for actions, teal for checked, amber for look at this). Details in docs/10-screens.md.
Interview line: "Every screen has one job, and the claim and its source are always side by side."

### 2026-10-03: Mail guardrails as hard and soft rules
What: One rule set (config/mail-rules.json, docs/09-mail-guardrails.md, lib/mail-check.ts). Hard rules (length, plain text, no links or emoji, no ROI figures, no stock phrases, no "how I found this") block Send on the server and in the browser. Soft rules (target length, greeting, flattery) are warnings.
Why it matters: A mail that breaks a hard rule can't reach the Outbox, so a rep can't send something the app already knows is wrong. Soft rules keep the rep in charge of tone.
Interview line: "The model writes the draft, but the rules decide what can be sent."
Source: docs/06-hook-rubric-and-writing-rules.md, docs/09-mail-guardrails.md

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

### 2026-10-04: First live runs of the one-call pipeline
What: Stripe (CFO) and Notion (VP Finance) each drafted in one Gemini call, about 1,250 to 1,520 tokens in and 240 to 260 out, no thinking tokens, every claim and guardrail passing. The old four-call run used about 3,200 in and 430 out plus thinking. Basecamp now abstains: 34 headlines carried the name, none about the company.
Why it matters: Roughly half the tokens and a quarter of the calls per draft, with the same checks.
Interview line: "A draft costs one model call of about 1,800 tokens; the research around it is free."

### 2026-10-04: A headline that names the company isn't always about it
What: "India's Ultraviolette taps Intel CEO as adviser, raises $85 million" became "Intel recently raised 85 million", and the word-overlap claim check passed it. Now a news headline must have the company as its subject (it opens the headline, or a verb follows the name closely; a role word like "CEO" right after it means a person). Mentions, questions ("Can Intel's ... benefit the stock?") and predictions are ranked as eventless: they can support an email but are capped below the 50 bar, and the claim check rejects them as sources for what the company did.
Why it matters: The worst failure for this product is a confident, wrong fact about the prospect. Intel is now the "only mentioned in the news" case.
Interview line: "Matching the name is easy; checking the company is the subject of the sentence is what stops a wrong email."

### 2026-10-04: robots.txt wildcards read as "Disallow everything"
What: The crawler cut each rule at its first "*", so Notion's "Disallow: /*/invite/" became "Disallow: /" and Ramp and Notion looked closed to crawlers. The parser now handles groups of User-agent lines, Allow and Disallow, "*" and "$", and the longest matching rule wins (Allow on a tie), as Google reads robots.txt.
Why it matters: Big sites were silently stopping at the first step.
Source: lib/sources/crawler.ts (parseRobots, allowedByRobots)

### 2026-10-04: gemini-flash-lite-latest refuses thinkingBudget 0
What: Flash-lite answers a plain 400 INVALID_ARGUMENT to thinkingBudget 0, without naming the setting; gemini-flash-latest accepts it (167 thinking tokens saved on a tiny prompt). On a 400 the call is repeated once without the budget and that model is remembered. Model errors now carry a short reason instead of "the model service returned an error".
Why it matters: A busy flash-latest falls back to flash-lite, and that fallback was failing every time.

### 2026-10-04: Same-name companies are the norm, not the edge case
What: A live news search for "Basecamp" returned Basecamp Research (a biotech that raised $140M), a $10M "Basecamp" development in Peoria and the Ford Bronco Basecamp, and almost nothing about Basecamp the software company. "Ramp" returned Rivian's "Production Ramp". Three rules catch them without a model: the name must be capitalised, a capitalised word next to it that isn't ordinary headline English or on the company's own site makes it a different name, and a headline sharing a figure ("$140M") with one of those is the same story.
Why it matters: This is edge case 1 happening on a famous company, and the run shows each dropped headline with its reason.
Interview line: "Google News matches words, not companies, so I check the words around the name."

### 2026-10-04: Every job signal had the same id
What: runStage numbered new signals with the context length before any were added, so all five jobs in a step became s2. Hooks citing "s2" cited all of them. Fixed by adding the index.
Why it matters: Citations pointed at the wrong source on runs with several signals from one step.

### 2026-10-04: Gemini reports tokens per call
What: response.usageMetadata has promptTokenCount, candidatesTokenCount and thoughtsTokenCount. Flash models think by default, and thinking tokens are billed as output; thinkingConfig.thinkingBudget 0 switches it off.
Why it matters: The usage meter shows real numbers, and a writing task with the facts already chosen doesn't need thinking.

### 2026-10-04: page.evaluate and bundled functions
What: Passing a TypeScript function to Playwright's page.evaluate failed with "__name is not defined": the bundler wraps functions in a helper that doesn't exist inside the page. Passing the extraction as plain script text fixed it.
Why it matters: Anything that runs inside the browser page must be self-contained.

### 2026-10-04: SQLite rows can't go straight to client components
What: node:sqlite returns rows with a null prototype, and Next refuses to pass them to a client component. A JSON round trip makes them plain objects.

### 2026-10-04: Gmail's compose link is plain text only
What: The view=cm link takes to, su and body, all URL-encoded. Line breaks survive; HTML does not. For styled paste, write text/html to the clipboard with ClipboardItem. Open the tab inside the click handler, before any await, or the browser blocks it.

### 2026-10-03: The font never loaded
What: globals.css had `--font-sans: var(--font-sans)`, a variable pointing at itself, so the browser fell back to its default serif. Fixed by pointing it at the font loaded in layout.tsx (now IBM Plex Sans).
Why it matters: A CSS variable that refers to itself is invalid and silently ignored; check computed styles when a font looks wrong.

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
- Headless browser: a real browser with no window, driven by code (here Playwright with Chromium).
- robots.txt: a site's file listing pages it asks crawlers not to read.
- Compose deep link: a URL that opens Gmail's new-message window with fields filled in.
- Replay: a recorded run played back step by step, with no model or network calls.

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

