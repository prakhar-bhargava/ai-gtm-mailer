# Hook rubric and writing rules

Weights and thresholds live in `config/rubric.json` so they can be tuned without code changes. Treat them as hypotheses. Most outreach statistics are vendor correlations, and the signal-ranking and freshness rules are practitioner heuristics (sources in docs/research/). Say that in the interview; it reads as judgment, not weakness.

## Scoring a candidate hook (0 to 100)

| Criterion | Weight | Scored by | What earns full marks |
|---|---|---|---|
| Relevance to the seller's offer | 35 | Code, from `config/hook-lexicon.json` | The category the signal matches: finance hiring 32 (+1 per extra role, up to +3), finance system change 30, expansion or acquisition 26, funding 24, compliance 20, growth figures 16, partnership 8, hiring outside finance 6, other news 5, company description 2. |
| Recency | 20 | Code | Under 14 days: 20. 15 to 45 days: 14. 46 to 90: 8. 91 to 180: 3. Older or undated: 0, and cannot be the top hook. |
| Specificity | 15 | Code | Starts at 6; +3 for a number, +3 for two or more other names, +3 for several signals in one angle. |
| Seniority fit | 10 | Code | Director level and above: 10; others: 6. (Gong Labs: company-level personalisation tripled replies from directors and above.) |
| Verifiability | 10 | Code | Has URL, date, and a snippet that supports the claim; named publication or the company's own site scores highest. |
| Source authorship | 10 | Code | Ranked after Becc Holland's "premise first" order: something the person wrote or said > something they engaged with > how they describe themselves > company news > other. |
| Safety gate | pass/fail | Code | Not in the sensitive list. A fail removes the hook regardless of score. |

Until 2026-10-04 the model proposed hooks and scored relevance and specificity. It is now all code, for three reasons: it saves two model calls per run, the same signals always rank the same way, and the scores can't be talked up (the model had given a revenue estimate 30 of 35 for relevance although the prompt said growth figures alone earn 0 to 15). The trade-off: the lexicon only knows the words it lists, so an unusual phrasing falls into "other news" until the lexicon is extended. The writer still sees the top three angles and can pick the second or third if it is clearly more specific; it says why.

Thresholds:
- 50 and above: a personalised draft. It is "Ready to review" when every claim is backed and every guardrail passes, otherwise "Check before sending". (Until 2026-10-04 a draft also needed 70 to count as ready; lowered at the user's request, since the claim check and guardrails now carry that weight.)
- Below 50, or no hook passes the safety gate: abstain.

The UI shows the breakdown bar for every candidate and one sentence on why the winner beat the runner-up.

### Eventless angles are capped below 50

A news headline only counts as an event at the company when the company is its subject: it opens the headline (after a label such as "Exclusive:"), or a verb follows the name closely ("... Now Stripe Is Buying It"). A role word right after the name ("Intel CEO") means the story is about a person. Headlines that only mention the company, and questions or predictions ("Can Intel's ... benefit the stock?"), score relevance 3 and, like the company's own description, are capped at 49: they can support an email but never justify writing one. The claim check also refuses them as sources for what the company did. Code: `companyIsSubject` and `isSpeculation` in `lib/pipeline/hook-candidates.ts`.

## Sensitive topics (blocked as hooks)

Layoffs and restructuring, lawsuits and regulatory action, investigations or fraud, executive departures and firings, missed earnings or down rounds, health, death and bereavement, family, religion, politics, personal life posts, rumours or unconfirmed reports, anything older than 180 days presented as news.

## Writing rules for the draft

The full, current rules are in docs/09-mail-guardrails.md. In short (changed 2026-10-04 at the user's request):
1. Greeting on its own line.
2. Premise: the fact, cited, and the pain such a change usually brings.
3. Customer story: a sourced caselet from the seller brief, anonymised by default.
4. How Zamp helps: the value line, with approved figures only.
5. CTA: an interest question ("Worth a short call next week?"). Gong's data (304k emails) found interest CTAs beat meeting requests at the cold stage.

Limits:
- Body 70 to 130 words, never under 50. Hunter's data shows length matters little on its own (3.4 to 4.5% replies across lengths), so the extra room for a customer story costs little.
- Subject 5 to 14 words: the company, the fact, the outcome ("Stripe has 14 open finance roles: an AI employee live in four days"). This replaces the earlier 2 to 4 word rule (Belkins open-rate data); an actionable subject trades a little open rate for relevance.
- Only approved, sourced figures. No invented ROI or effort percentages. Gong found ROI multipliers associated with lower success, and the app can't prove them.
- No stock openers: "I noticed you recently", "I came across your profile", "I hope this finds you well", "I wanted to reach out".
- No flattery, no exclamation marks, no emoji.
- One question at most.
- Do not mention how the information was found ("I saw on LinkedIn that...").
- Every factual sentence about the company is returned as a claim with its signal id; claims are underlined and numbered in the UI.

## Verify step (code, no model call)

1. Each claim: every number in it must appear in the cited signal, and at least 60% of its content words (by stem, company and seller names ignored). Otherwise it is marked "check" with the reason.
2. Each sentence of the body that names the company, isn't a claim, and isn't the customer story or the value line, is listed as "states a fact with no source".
3. Any number that is in neither a source nor the approved figures is listed.
4. The mail guardrails (`lib/mail-check.ts`).

Trade-off against the earlier model check: word overlap can't judge a paraphrase. A faithful rewording that shares under 60% of the words is flagged for a human look (a false alarm), while a sentence that copies the source's words but changes the meaning would pass. The writer is told to keep claims close to the signal's wording, which keeps false alarms rare.
