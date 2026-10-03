# CLAUDE.md

Project guide for coding sessions in this folder. Read this first, every session.

## What this project is

A take-home build for Zamp's AI Solutions Associate case study, problem PS-3 (personalised outreach). A rep enters a prospect; the app researches public signals, ranks candidate hooks, and produces a cited outreach draft for human review. Nothing is ever sent automatically. It must run live on a public link and in the interview.

Read before changing behaviour:
- docs/01-assignment-breakdown.md: what is graded and the deliverables
- docs/02-process-map.md: the pipeline stages
- docs/03-prd.md: requirements R1 to R18
- docs/04-architecture.md: stack, folders, data model, reliability rules
- docs/05-edge-cases.md: the four edge cases and expected behaviour
- docs/06-hook-rubric-and-writing-rules.md: scoring and draft rules
- docs/08-seller-brief-zamp.md: what the seller sells

Current plan and progress: TASKS.md. Decisions, assumptions, learnings: LEARNING.md.

## Priorities, in order

1. It runs end to end on the deployed link. Never leave main in a state that does not run.
2. Happy path before edge cases; edge cases one at a time, each tested.
3. Every claim traceable to a source; abstain rather than invent.
4. Live run view and dashboard look clean and readable to a non-technical person.
5. Everything else.

If a task threatens priority 1 late in the week, stop and say so.

## Hard rules

- Never fetch or scrape linkedin.com, and never use logged-in scraping actors. A LinkedIn URL is stored as a reference only.
- Never auto-send email. Drafts only; any "send" path stays behind an explicit human action and is out of scope unless asked.
- Every external call goes through `lib/sources/*` with a timeout (8 s default), one retry on 429, and the cache.
- Every signal stores `source_url`, `published_at` (or null, marked undated) and `fetched_at`.
- Optional stages fail soft: emit a `failed` event with a readable message and continue.
- LLM outputs are parsed with zod schemas from `lib/types.ts`; on parse failure retry once with the error, then fail the stage.
- Rubric weights, thresholds and sensitive topics live in `config/`, not hard-coded.
- Stage event messages are written for a sales rep ("Found 3 open AP roles on Greenhouse"), not for a developer.
- Secrets only in `.env.local` and Vercel settings. Never commit them; never print them in logs.
- Do not invent facts about real people or companies in fixtures, seed data or examples. Use real, checked data or clearly fake names.

## Conventions

- TypeScript strict. Small files, one stage per file.
- Server code in `lib/`, UI in `app/` and `components/`.
- shadcn/ui components; Tailwind for layout. Sentence case for UI labels.
- Commit after each working step with a message that says what now works.

## Working with me

- I'm a product person with an HCI background; explain non-obvious engineering choices in a sentence or two, and tell me the trade-off.
- Before a large change, give a 3 to 5 line plan and wait for a yes. Small fixes, just do them.
- After finishing a task, tick it in TASKS.md.
- Maintain LEARNING.md: when we make a design decision, discover how an API really behaves (limits, quirks, failures), hit and fix a notable bug, or learn a concept I should be able to explain in the interview, add a dated entry in the right section using the format at the top of the file. Keep entries short. Add new terms to the glossary. Record test-set results in the table.
- When a decision changes something in docs/, update that doc in the same change.

## Commands

Fill in once the app is scaffolded.

```
npm install
npm run dev        # local at http://localhost:3000
npm run lint
npm run test       # runs fixtures/demo-prospects.json through the pipeline
vercel --prod      # deploy
```
