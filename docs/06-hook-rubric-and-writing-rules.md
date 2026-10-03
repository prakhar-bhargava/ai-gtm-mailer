# Hook rubric and writing rules

Weights and thresholds live in `config/rubric.json` so they can be tuned without code changes. Treat them as hypotheses. Most outreach statistics are vendor correlations, and the signal-ranking and freshness rules are practitioner heuristics (sources in docs/research/). Say that in the interview; it reads as judgment, not weakness.

## Scoring a candidate hook (0 to 100)

| Criterion | Weight | Scored by | What earns full marks |
|---|---|---|---|
| Relevance to the seller's offer | 35 | LLM, with the seller brief | The signal implies a finance or ops pain Zamp's AI employees address (AP volume, close speed, procurement, compliance, hiring ops staff). |
| Recency | 20 | Code | Under 14 days: 20. 15 to 45 days: 14. 46 to 90: 8. 91 to 180: 3. Older or undated: 0, and cannot be the top hook. |
| Specificity | 15 | LLM | About this person or this company in particular, not the industry. |
| Seniority fit | 10 | Code + LLM | For director level and above, company-level hooks score higher; for managers, personal content scores higher. (Gong Labs: company-level personalisation tripled replies from directors and above.) |
| Verifiability | 10 | Code | Has URL, date, and a snippet that supports the claim; named publication or the company's own site scores highest. |
| Source authorship | 10 | Code | Ranked after Becc Holland's "premise first" order: something the person wrote or said > something they engaged with > how they describe themselves > company news > other. |
| Safety gate | pass/fail | Code + LLM | Not in the sensitive list. A fail removes the hook regardless of score. |

Thresholds:
- 70 and above: personalised draft.
- 50 to 69: draft with a "check this hook" flag.
- Below 50, or no hook passes the safety gate: abstain.

The UI shows the breakdown bar for every candidate and one sentence on why the winner beat the runner-up.

## Sensitive topics (blocked as hooks)

Layoffs and restructuring, lawsuits and regulatory action, investigations or fraud, executive departures and firings, missed earnings or down rounds, health, death and bereavement, family, religion, politics, personal life posts, rumours or unconfirmed reports, anything older than 180 days presented as news.

## Writing rules for the draft

Structure, after Holland's three lines:
1. Premise: the hook, one sentence, factual, cited.
2. Value: the pain it implies and what Zamp does about it, one or two sentences, no feature lists.
3. CTA: an interest question ("Worth a look?", "Open to comparing notes?"). Gong's data (304k emails) found interest CTAs beat meeting requests at the cold stage.

Limits:
- Body 50 to 100 words. Hunter's data shows length matters little on its own (3.4 to 4.5% replies across lengths), so shorter costs nothing and reads faster.
- Subject 2 to 4 words, lowercase is fine, no clickbait. (Belkins: 2 to 4 words had the best open rate.)
- No ROI multipliers ("2x faster"). Gong found them associated with lower success.
- No stock openers: "I noticed you recently", "I came across your profile", "I hope this finds you well", "I wanted to reach out".
- No flattery, no exclamation marks, no emoji.
- One question at most.
- Do not mention how the information was found ("I saw on LinkedIn that...").
- Every factual phrase carries a `[s:<signal_id>]` tag in the model output; tags are rendered as highlights in the UI and stripped on copy.

## Verify step

1. Parse the draft's claim tags. Any sentence with a factual assertion and no tag is flagged.
2. For each tag, ask the LLM a narrow yes/no: "Does this snippet support this sentence? Answer with the supporting quote or NO."
3. Any NO triggers one rewrite with the failing sentence named. A second failure highlights the sentence in red for the reviewer.
4. Lint: word count, banned phrases, numbers that look like ROI claims, question count.
