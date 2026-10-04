# Mail guardrails

What every outreach email must look like, and which rules stop it being sent.

This document, `config/mail-rules.json` and `lib/mail-check.ts` describe the same rules. Change all three together. The writer prompt reads its numbers from the config, so the model is told the same limits the checks enforce. The figures and customer stories a mail may use live in `config/seller-brief.zamp.json` under `proof` (read through `lib/proof.ts`).

Two kinds of rule:
- **Must fix** (hard): blocks Send, both in the browser and on the server. An email that breaks one of these can't be saved to the Outbox.
- **Consider** (soft): shown as a warning. The rep can still send.

The draft is also checked by the pipeline's check step (no model call). Its findings appear on the draft and mark it as flagged. The Send step applies the same rules again, so an edited draft is always checked.

Changed on 2026-10-04 at the user's request: subjects are now actionable (company, the fact, the outcome) instead of 2 to 4 words, and every mail retells a sourced customer story. The earlier "short lowercase subject" rule came from open-rate research (Belkins); the new rule trades a little of that for a subject that says why the mail matters.

## Subject

| Rule | Kind | Why |
|---|---|---|
| 5 to 14 words | Must fix | Long enough to say what was seen and what changes; short enough to read in an inbox list. |
| Names the prospect's company | Must fix | Shows at a glance that the mail is about them. |
| Says what changes for them (an approved figure or words like "without adding headcount", "live in four days") | Consider | Actionable: the reader knows the outcome before opening. |
| No exclamation mark, no word in capitals (four or more letters) unless it is part of the company's name | Must fix | Shouting reads as marketing. |

Pattern: `<Company> is <the fact>: <outcome>`. Examples: "Northwind has 14 open finance roles: an AI employee live in four days", "Northwind is expanding to Brazil: scale AP without adding headcount". (Northwind is a made-up company used only in examples.)

## Length and paragraphs

| Rule | Kind | Why |
|---|---|---|
| 50 to 170 words | Must fix | Never under 50: the mail has to carry the fact, the story and the offer. |
| Aim for 70 to 130 words | Consider | Room for all five parts without turning into a brochure. |
| 4 to 6 short paragraphs | Consider | Greeting, premise, story, help, question. |
| No sentence over 32 words | Consider | Long sentences lose the reader. |

## Structure

Every email has these parts, in this order:

1. **Greeting**, on its own line: `Hi <first name>,`. Must fix.
2. **Premise**: the fact from the chosen angle (a cited signal), then the pain such a change usually brings a finance team. The pain is phrased as typical ("usually", "often"), never as a fact about them.
3. **Customer story (caselet)**: one or two sentences retelling a story from `proof.caselets`, close to its wording. Stories are anonymised ("a finance team at a fitness and wellness software company") unless `use_customer_names` is turned on. Each has a public source.
4. **How Zamp helps**: built on the approved value line, with at most the approved figures.
5. **Call to action**: one interest question, such as "Worth a short call next week?"
6. **Signature**: added by the app from the rep's saved signature (default: Prakhar, +91 9899326396, Zamp, with the Zamp logo). The rep edits it once with "Edit signature" under any draft.

## Figures: what "Z% less effort" may say

Only figures listed under `proof.approved_figures` or `proof.impact.effortReduction` may appear. Today that is "99%+ accuracy" and "live in four days", both from zamp.ai. Zamp publishes no hours-saved or effort-reduction percentage, so the app does not invent one. To use one, set `proof.impact.effortReduction` (for example "60% fewer manual hours on invoice entry") and its `source`; the writer and the checks then accept it.

| Rule | Kind |
|---|---|
| Any other result figure ("2x faster", "30% less") | Must fix |
| Any number in the body that is in neither a cited source nor the approved list | Consider (listed by the check step) |

## Formatting

| Rule | Kind |
|---|---|
| Plain text only. No markdown: no bold, headings, bullet points, backticks or quote marks used as formatting | Must fix |
| No links in the body. The signature carries the website | Must fix |
| No emoji | Must fix |
| No exclamation marks | Must fix |

The Gmail compose link carries plain text only, so the logo and styled signature come through "Copy formatted" (HTML on the clipboard, pasted into Gmail).

## Wording

| Rule | Kind | Why |
|---|---|---|
| No stock openers or stock phrases ("I noticed you recently", "I hope this finds you well", "touch base", and the rest of the list in the config) | Must fix | They read as automated (docs/06). |
| Do not say how the information was found ("I saw on LinkedIn", "your profile") | Must fix | Lead with the company fact instead. |
| At most one question, and it is the call to action | Must fix | One clear ask. |
| No flattery ("amazing", "impressive", "love", "excited") | Consider | State the fact; drop the praise. |
| Every sentence about the prospect's company is a cited fact | Checked by the check step | Claims must be traceable to a source. |

## How it is enforced

| Where | What it does |
|---|---|
| Writer prompt (`lib/pipeline/prompts.ts`) | Gives the model the structure, the limits, the approved figures and one story per angle. |
| Writer schema (`lib/types.ts`, `writerAnswerSchema`) | Rejects a subject outside 5 to 14 words or without the company, and a body outside 50 to 170 words; retries once with the reason. |
| Check step (`lib/pipeline/stages/verify.ts`, `lib/pipeline/claim-check.ts`) | Claims against sources by numbers and word overlap, uncited sentences about the company, stray numbers, then `checkMail`. Any finding flags the draft. |
| Send panel (`components/send-panel.tsx`) | Shows the checks while the rep edits. Send is disabled while a must-fix rule fails. |
| Send API (`app/api/runs/[id]/send/route.ts`) | Refuses a mail with a must-fix rule (HTTP 422). This is the final check. |

## Checklist before pressing Send

- [ ] Subject names the company, the fact and the outcome, 5 to 14 words
- [ ] Greeting, premise, customer story, how Zamp helps, one question
- [ ] 70 to 130 words, never under 50
- [ ] Every fact about the company comes from a source shown on the draft
- [ ] Only approved figures; no invented percentages
- [ ] No links, no emoji, no markdown; nothing says how the information was found
