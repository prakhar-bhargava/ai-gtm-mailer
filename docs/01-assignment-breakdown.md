# Assignment breakdown: Zamp ASA case study, PS-3 personalised outreach

Source: `ASA Case Study — Candidate Guide` (Zamp, 2026, 7 pages). The company is zamp.ai (AI employees for finance and ops), not zamp.com (sales tax).

## What they are actually testing

The guide asks one core question: given a real operational problem, a week, and any AI tools, can you build a process that actually runs, handles real inputs, and deals with edge cases gracefully?

Read every line of the guide and five things get graded, roughly in this order of weight:

1. It runs. Live, end to end, on real input. "Not just look like it does." A process that only handles the happy path but runs beats one that is 80% built.
2. Judgment. Why each stage exists, why each tool is there, why the edge cases you picked are the ones that matter. "The edge cases you choose tell us how well you understand the problem."
3. The UI. This is graded explicitly: "an intuitive, well-designed interface with a live run view (showing each stage as it executes) and a dashboard (showing history, status, and outputs across runs)." The FAQ softens it ("a clean console output is fine") but the deliverable section says it is part of the grade. Build the real UI.
4. Explaining it to a non-technical buyer. In the video and in the interview.
5. Demo composure. "A demo that breaks live, even on a minor thing, is hard to recover from."

## The schedule

| Day | What the guide asks | What it means for us |
|---|---|---|
| 1 | Pick a problem, email the coordinator | Subject line: `ASA Case Study — Prakhar Bhargava — PS-3`. Send it today. Also: map the process on paper (docs/02-process-map.md). |
| 2 to 6 | Build | Happy path first (by end of day 3), then edge cases one at a time, then UI polish, then rehearsal. See TASKS.md. |
| 7 | Submit | Two links: the live process, and a 5 minute video. |
| After | Interview with live demo | Run the happy path and your prepared edge cases live. No slides. Then a conversation about your decisions. |

## Deliverable 1: a working automated process, live and runnable

Requirements pulled from the guide:

- Accepts a real input. For PS-3 that is a prospect: a name plus a company, optionally a role, domain or LinkedIn URL.
- Runs through your logic and produces a real output: a personalised outreach draft grounded in something real about that person.
- The draft is for a human to review. "The human stays in the loop before anything sends." Nothing auto-sends.
- Any stack is allowed (n8n, Make, Zapier, Cursor, Lovable, Python, anything). Zamp's own product is not allowed.
- UI with two required views:
  - Live run view: each stage visible as it executes.
  - Dashboard: history, status and outputs across runs.
- Must be reachable as a link on day 7 and must run live in the interview.

PS-3 specifics, quoted from the brief so we keep them in front of us:

- "A rep names a target. The process does the research, identifies the most relevant hook, and surfaces a draft that's actually worth reviewing, not just a template with the name filled in."
- "You decide how to find signal, how to judge what's relevant, and how to turn it into a message worth sending."
- Signal sources they name: LinkedIn activity, company news, job postings, funding announcements, executive interviews, recent press.
- The pain they describe: an SDR with 200 prospects cannot spend 20 minutes researching each, so they send generic messages and reply rates suffer.

## Deliverable 2: a 5 minute demo video

- Loom or any screen recording. No editing, no slides.
- Show the happy path running live, then at least one edge case.
- Narrate what the process does at each step, the decisions it makes, and anything interesting about how you built it.
- Five minutes maximum. Script in docs/07-demo-and-interview-prep.md.

## Deliverable 3 (implied): the live interview demo

Not submitted, but prepared during the week:

- A happy path plus the 2 to 4 edge cases you designed, run live in real time.
- Test inputs ready and rehearsed, run order fixed.
- A notes file of assumptions you made, so you can reference them ("treat ambiguity as part of the exercise. Make an assumption, note it somewhere you can reference in the live pitch"). That file is LEARNING.md, section "Assumptions".

## Edge cases: 2 to 4, defined by us

The guide's wording: realistic scenarios where the process has to behave differently from the happy path, which reveal how flexible and deliberate the logic is. "Don't pick trivial ones." Our four are in docs/05-edge-cases.md:

1. Ambiguous identity (wrong person or wrong company with the same name).
2. No usable signal (thin footprint), where the honest output is to abstain.
3. The freshest signal is sensitive (layoffs, a lawsuit, an exec exit) and must not be used as a hook.
4. The signal says the prospect has moved on (stale role, successor announced).

Source failure (an API timing out mid-run) is handled as a robustness feature in every run, not as one of the four.

## Constraints and rules we are taking from the guide

- Inputs can be real public information about real companies, or plausible invented ones. We use real public companies so the research is meaningful.
- Use AI tools freely, but be able to say why each one is there.
- If short on time, email the coordinator before the deadline. Do not go silent.
- Submit something that runs even if it is not perfect.

## Our framing in one paragraph

Zamp sells "AI employees" that "own the job end to end", and its own catalogue lists a GTM Associate. So the build is pitched as a GTM Associate for a Zamp seller: brief it once with what Zamp sells, give it a prospect, and it returns a draft a rep can approve in seconds because every claim links to a dated source, the hook choice is explained, and it says so when there is nothing worth saying. The research (docs/research/) shows the weak point of today's AI SDR tools is untrustworthy personalisation, not missing personalisation. That is where we compete.

## What we are not building (and will say so)

- Sending email, sequences, follow-ups or deliverability. Drafts only; a Gmail draft export is a stretch goal.
- LinkedIn scraping. LinkedIn URL is accepted as an input; we never fetch linkedin.com. (Legal history in docs/research/.)
- Reply-rate measurement. Impossible in a week. We measure what we can: claim accuracy, abstain rate, reviewer approval and edit distance.
