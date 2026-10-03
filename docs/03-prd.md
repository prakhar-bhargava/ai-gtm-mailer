# PRD: GTM Associate, prospect to reviewed draft

## Problem

An SDR working 200 prospects cannot spend 20 minutes researching each one, so they send messages with the company name swapped in and reply rates suffer. The signal needed for a good first line usually exists in public (news, hiring, funding, interviews), but finding it and judging which thread to pull takes time the rep does not have.

Today's AI SDR tools fill the gap with generated personalisation that reps cannot trust. 11x reportedly lost 70 to 80% of early customers, with staff saying output had to be checked by hand for hallucinations (TechCrunch, March 2025). Shallow "I saw your post" openers do worse than no personalisation (Instantly). The bottleneck is trust, not text.

## Users

- Primary: the SDR or AE at a B2B company (our demo seller is Zamp) who names prospects and approves drafts.
- Secondary: the sales manager who looks at the dashboard to see throughput and quality.
- Buyer persona for the interview pitch: a head of sales or RevOps who would roll this out to a team. Non-technical.

Job to be done: "When I have a list of target accounts, I want a first line for each that is true, relevant and recent, so I can send something I would put my name on without doing the research myself."

## Goals

1. A rep goes from a prospect name to a reviewable draft in under 60 seconds.
2. Every factual claim in the draft links to a dated public source.
3. The system says when it has nothing good to say instead of inventing a hook.
4. A rep can approve a good draft in under 30 seconds because the reasoning is on screen.

## Non-goals

Sending email, sequences, deliverability, CRM sync, LinkedIn scraping, reply tracking.

## Functional requirements

Inputs
- R1. Single prospect form: name, company (required); role, domain, LinkedIn URL, notes (optional).
- R2. Seller brief editable in settings (offer, ICP, pains, proof points, tone). Defaults to Zamp.
- R3. (Stretch) CSV upload for batch runs.

Run
- R4. Pipeline stages as in docs/02-process-map.md, each emitting events: started, progress note, finished or failed, duration, output summary.
- R5. Each external source has a timeout and fails soft. The run view shows which sources failed.
- R6. Identity ambiguity pauses the run and asks the rep to choose (run status `needs_input`).
- R7. Every signal stored with URL, published date and fetch date.
- R8. Sensitivity filter blocks a defined list of topics from being hooks, and shows what it blocked.
- R9. 3 to 5 candidate hooks, each scored with a visible breakdown. The winner's reasoning is shown in one sentence.
- R10. Abstain outcome when the top hook scores below 50: no personalised draft, a clear reason, and two options (value-led generic draft, or deprioritise).
- R11. Draft follows the writing rules; claim check and style lint run before the rep sees it.
- R12. Replay mode: re-run a cached prospect with the same stage timing for demos when an API is down. Labelled as replay in the UI.

Review
- R13. Draft view with claims highlighted and linked to sources, editable inline.
- R14. Approve, edit and approve, or reject with a reason code. Store the final text and edit distance.
- R15. Copy to clipboard. (Stretch: create Gmail draft.)

Dashboard
- R16. Table of runs: prospect, company, status, top hook type, score, duration, created at.
- R17. Summary metrics: runs, approval rate, abstain rate, median review time, average edit distance, source failure rate.
- R18. Click a run to open its full trace (every stage, every signal, blocked items, hooks, draft versions).

## UI

Three screens, plus settings.

1. New run: the input form and a list of saved demo prospects (one click to run).
2. Run view: a vertical stage timeline on the left that ticks through live (pending, running with spinner, done with duration, failed in amber, paused for input). On the right, the evolving result: identity card, signal list with dates and source chips, blocked signals greyed with reason, hook cards with score bars, then the draft with highlighted claims and the review actions.
3. Dashboard: metric tiles at top, runs table below, filters by status.

Design principles: show the evidence next to the claim; make "abstained" look like a good outcome, not an error; never hide a failed source.

## Success metrics (what we can measure in a week)

| Metric | Target | How |
|---|---|---|
| Claim accuracy | 95%+ of cited claims supported by their source | Manual check on 20 runs |
| Correct abstain | Abstains on the thin-signal test set, not on rich ones | Labelled test set of 10 to 15 prospects |
| Time to draft | Under 60 s median | Run logs |
| Reviewer approval | 70%+ approved with light edits | Self-review plus 2 or 3 friends who sell |
| Edit distance | Falls as rubric is tuned | Stored per run |

Reply rate is the real business metric; say so, and say it needs a live pilot.

## Assumptions (log new ones in LEARNING.md)

- The seller is Zamp and prospects are finance and ops leaders at companies with heavy AP or procurement work.
- Public web data is enough for most enterprise prospects; thin-footprint prospects are a minority.
- Reps want fewer, better drafts over more drafts.
- Rubric weights are hypotheses that reviewer reason codes will tune.

## Risks

| Risk | Mitigation |
|---|---|
| An API is down or rate limited during the live demo | Timeouts, fail soft, replay mode, demo prospects pre-cached the night before |
| LLM invents a fact | Claim check against snippets, citation required per claim, highlight unsupported text |
| Wrong person | Identity step with confidence and a pause for the rep |
| Creepy or insensitive hook | Sensitivity filter, prefer company-level hooks for executives |
| Free tier credits run out | Cache by prospect and source; track credit use |
