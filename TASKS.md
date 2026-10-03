# Tasks

Day 1 is the day the case study arrived. Fill in real dates once you know the deadline. Tick items as they finish; add new ones at the bottom of the day they belong to.

Deadline (day 7): ____

## Day 1: choose and map
- [ ] Email the hiring coordinator. Subject: `ASA Case Study — Prakhar Bhargava — PS-3`
- [ ] Read docs/01 to docs/06 and change anything you disagree with (log it in LEARNING.md)
- [ ] Sign up and get keys: LLM provider, Tavily, Apollo, Supabase. Check each free tier's real limits and note them in LEARNING.md
- [ ] Pick 5 happy path prospects and 2 or 3 per edge case. Verify each by hand. Save to `fixtures/demo-prospects.json`

## Day 2: skeleton that runs
- [ ] Scaffold Next.js + Tailwind + shadcn, deploy an empty page to Vercel (prove the live link works on day 2, not day 7)
- [ ] Supabase tables from docs/04-architecture.md
- [x] Orchestrator with stage events streamed over SSE; stub stages that return fake data
- [x] Run view showing the stage timeline ticking live (checked by curl on the stream; visual check in browser still to do)

## Day 3: happy path for real
- [ ] Identity resolution (search + domain match)
- [ ] Gather: news, company site, jobs, firmographics, person content (each with timeout, cache)
- [ ] Normalise, hooks, scoring, draft, verify (draft uses Gemini with sample signals; hooks, verify and real signals still to do)
- [ ] One real prospect end to end on the deployed link. This is the checkpoint: if it is not working tonight, cut scope

## Day 4: edge cases
- [ ] Edge case 2 (abstain), then 3 (sensitive filter), then 1 (identity pause and resume), then 4 (role change)
- [ ] Run the full test set; record pass/fail in LEARNING.md

## Day 5: review and dashboard
- [ ] Review panel: highlighted claims with sources, edit, approve, reject with reason
- [ ] Dashboard: metric tiles and runs table, run trace page
- [ ] Health check page, replay mode
- [ ] Show 3 drafts to someone who sells; note their reactions in LEARNING.md

## Day 6: polish and rehearse
- [ ] UI pass: empty states, loading states, failed-source styling, abstain styling
- [ ] Fill the cost per prospect table in docs/07
- [ ] Rehearse the live run order three times
- [ ] Write a short README for the interviewers (what it is, how to run a prospect)

## Day 7: submit
- [ ] Warm the cache on all demo prospects
- [ ] Record the 5 minute video (script in docs/07)
- [ ] Send the coordinator both links
- [ ] If anything is unfinished, say so in the email and list what's next

## Interview day
- [ ] Re-warm cache, open health check, rehearse once
