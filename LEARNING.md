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

## Things I learned

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

| Date | Change | Happy path | EC1 | EC2 | EC3 | EC4 | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Feedback from real people

(Reactions from salespeople who look at drafts, with date.)
