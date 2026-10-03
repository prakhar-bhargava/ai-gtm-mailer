# Edge cases

The brief asks for 2 to 4 non-trivial edge cases where the process behaves differently from the happy path. We build four, in priority order. If time runs short, ship 1 to 3 and keep 4 as "next".

Each one maps to a real failure mode of AI outreach tools (see docs/research/zamp-outreach-research.md), which is the story to tell: these are the ways a rep loses trust in a tool.

Pick real demo prospects for each and record them in `fixtures/demo-prospects.json`. Verify every fact by hand before the interview. Do not pick anyone whose sensitive news is personal (health, family); company-level events only.

## Happy path (baseline)

- Input: a finance leader (CFO, VP Finance, Controller, Head of AP) at a mid to large company with public news in the last 90 days and open finance or ops roles.
- Expected: identity resolves with high confidence, 6 to 12 signals, 3 to 5 hooks, top hook scores 70+, a 50 to 100 word draft where every claim links to a source, review in under 30 s.
- Good hooks for Zamp: hiring several AP or finance ops roles, an ERP migration, expansion into new countries or entities, a recent funding round that implies scaling finance ops, the exec talking publicly about close speed or automation.

## Edge case 1: ambiguous identity

Scenario: the company name or person name matches more than one real entity. Example of the problem from our own research: "Zamp" is both zamp.ai (AI employees) and zamp.com (sales tax). A rep types "Rahul Sharma, Head of Finance, Noon"; search returns several Rahul Sharmas.

Why it matters: personalising on the wrong person or company is the most embarrassing mistake an outreach tool can make, and it is invisible in the draft.

Expected behaviour:
- Identity stage finds two or more candidates and computes a confidence for each from domain match, role match and co-occurrence in sources.
- If the top confidence is below 0.75 or the gap to the second is small, the run pauses with status `needs_input` and shows candidate cards (name, company, domain, one-line evidence, source link).
- The rep picks one; the run resumes and filters out signals belonging to the other entity (shown greyed: "dropped, different entity").
- If the rep supplied a domain, use it and skip the pause.

Demo line: "It stopped and asked me, because guessing here is how you email the wrong person."

## Edge case 2: no usable signal

Scenario: a real prospect at a private, quiet company. No news in a year, no interviews, no open roles on a public board, a thin website.

Why it matters: this is where tools invent things or fall back to "I noticed your company is growing". Research shows generic or shallow openers do worse than no personalisation.

Expected behaviour:
- Gather finds few or only old signals. Hooks that exist score below 50 (old, unverifiable, not specific).
- Outcome `abstained`. The UI says plainly: "No hook strong enough to personalise on. Here is what I found and why each was rejected."
- Two options for the rep: generate a short value-led draft clearly labelled "not personalised", or mark the prospect "deprioritise / research manually".
- Abstained runs count in the dashboard as a correct outcome, not a failure.

Demo line: "The right output here is to say nothing personal. Faking it is worse than not trying."

## Edge case 3: the freshest signal is sensitive

Scenario: the most recent news about the company is a layoff round, a regulatory probe, a lawsuit, a failed deal or a CFO departure. A naive system picks it because it is the newest and most specific.

Why it matters: using a layoff as an opener ("saw you're cutting costs, we can help!") burns the relationship and the seller's brand. Practitioner guidance and a 2008 Marketing Letters study both find personalisation without a clear justification backfires (the "boomerang effect").

Expected behaviour:
- Sensitivity filter tags the signal with a category from `config/sensitive-topics.json` and blocks it as a hook.
- The UI shows it under "Blocked" with the reason, so the rep knows it exists (useful context) but the draft does not mention it.
- The pipeline picks the next safe hook if one clears the threshold; otherwise abstains.
- Optional nuance worth mentioning in the interview: some sensitive events are legitimate context for timing (a cost-cutting mandate makes automation relevant), but the tool leaves that call to the human and never names the event in a first touch.

Demo line: "It found the layoff, kept it as context for me, and wrote around it."

## Edge case 4: the prospect has moved on

Scenario: the rep's list is stale. News from two months ago announces a new CFO at the company, or the person is now quoted with a different employer.

Why it matters: lists decay. Writing a personalised email to someone who left is wasted effort at best.

Expected behaviour:
- Filter stage detects a role change signal (successor appointed, "former CFO of", a new employer in a recent byline).
- Run stops with outcome `stopped` and the message: "Contact may be outdated. [Source, date]. Suggested: re-target to the new [role], [name]." with a one-click button to start a run on the successor.

Demo line: "Before writing anything it noticed she left in August and pointed me at her replacement."

## Robustness behaviours (every run, not counted as edge cases)

- A source times out or returns 429: marked failed in amber, run continues, the draft notes reduced coverage.
- LLM returns invalid JSON: one retry with the validation error, then fail the stage with a readable message.
- A claim in the draft is not supported by its cited snippet: one rewrite, then highlight for the reviewer.

## Test set

Build a labelled set of 10 to 15 prospects in `fixtures/demo-prospects.json`: 5 happy path, and 2 or 3 for each edge case, each with the expected outcome. Run the whole set after every meaningful change and record pass/fail in LEARNING.md. This is the evidence for "I tested it", and it is what you show if asked how you know it works.
