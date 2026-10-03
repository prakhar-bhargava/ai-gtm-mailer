# Demo video and interview prep

## 5 minute video script

Record in one take with the app already open and the health check green. Speak to a head of sales, not an engineer.

| Time | Screen | What to say (rough) |
|---|---|---|
| 0:00 to 0:30 | New run page | Who this is for and the problem: an SDR with 200 prospects can't research each, so messages go out generic. Today's AI tools fill the gap with personalisation reps can't trust. This is a GTM Associate that researches, picks a hook, explains why, and hands the rep a draft they can approve in seconds. Nothing sends without a human. |
| 0:30 to 2:30 | Run view, happy path | Run a real finance leader live. Narrate stages as they tick: confirming it's the right person; pulling news, hiring, company site in parallel; dating and citing every signal; scoring hooks. Stop on the hook cards: why this one won, why the others lost. Show the draft, hover a highlighted claim to show its source. Approve with a small edit. |
| 2:30 to 3:45 | Run view, edge cases | Run edge case 2 (no signal, abstains) and either 1 (pause to confirm identity) or 3 (sensitive news blocked). Say why each matters to a rep's reputation. |
| 3:45 to 4:30 | Dashboard | History, statuses, approval and abstain rates, a failed source still producing a draft. Mention the test set and what passed. |
| 4:30 to 5:00 | Settings or a run trace | Two build decisions worth defending (no LinkedIn scraping; abstain as a feature) and what you'd build next (learn rubric weights from reviewer reject reasons, CRM sync, sending with approval). |

## Live interview run order

1. Open the health check. If a source is red, say so and continue; the run fails soft.
2. Happy path, a prospect not shown in the video if possible (proves it is not canned).
3. Edge case 1, 2, 3, 4 in that order, each from the demo prospects list.
4. Invite them to type a prospect. Have three backup suggestions ready in case they ask you to pick.
5. Dashboard, then open the trace of the run they chose.

Rehearse the full order at least three times on day 6, and once on the morning of the interview. Pre-run all demo prospects the night before to warm the cache.

## Questions to prepare answers for

Design
- Why these four edge cases and not others?
- How do you decide which hook is most relevant? What if the rubric is wrong?
- Why not let the LLM do everything in one call with web search?
- Why abstain instead of always producing something?
- How do you stop hallucinations? What is your claim accuracy and how did you measure it?
- Why no LinkedIn? Isn't that where the best signal is?

Product and business
- Who buys this, and what would they pay for? How would you measure success in a pilot?
- How does this scale from 1 prospect to 200? Cost per prospect?
- What would a rep's day look like with this?
- How would this become part of Zamp's own GTM Associate?

Build
- Walk through what happens when a source times out.
- What would you change with another week?
- Where did AI tools help you build, and where did they get in the way?

Keep answers to the decision, the reason, and the trade-off. Assumptions you made are in LEARNING.md; quote them.

## Cost per prospect (fill in from real runs)

| Item | Calls per prospect | Unit cost | Cost |
|---|---|---|---|
| Search (Tavily) | | | |
| Page reads (Jina) | | | |
| Firmographics | | | |
| LLM tokens | | | |
| Total | | | |
