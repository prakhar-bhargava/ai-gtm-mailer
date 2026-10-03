# Process map

Guidance step 1 in the brief: map every step on paper before touching tools. This is that map. Each stage lists its input, what it does, its decision point, and its output. Every stage writes a step event (status, timing, output summary) so the live run view can show it.

```
 [0 Input] -> [1 Resolve identity] --ambiguous--> PAUSE: rep picks the right entity
                     |
                     v
 [2 Gather signals (parallel, each with timeout)] -> [3 Normalise + date + cite]
                     |
                     v
 [4 Filter: entity match, freshness, sensitivity] --> blocked signals kept for display
                     |
                     v
 [5 Generate 3-5 candidate hooks] -> [6 Score against rubric]
                     |
          +----------+-----------+------------------+
          | score >= 70          | 50 to 69          | < 50 or no hooks
          v                      v                   v
   personalised draft     draft + "check this"   ABSTAIN: no personal hook.
                              flag                  Offer value-led draft or
                                                    recommend deprioritise
          |                      |                   |
          +----------+-----------+-------------------+
                     v
 [7 Draft (premise, value, CTA)] -> [8 Verify claims + style lint] --fail--> one rewrite, then flag
                     |
                     v
 [9 Review queue: approve / edit / reject with reason]  (nothing sends)
                     |
                     v
 [10 Dashboard: run history, status, scores, outcomes]
```

## Stage by stage

### 0. Input
- Required: person name, company name.
- Optional: role/title, company domain, LinkedIn URL (stored as a reference only, never fetched), rep notes.
- Seller brief: loaded from config (what Zamp sells, to whom, pains it solves, proof points). This is the "brief it once" part.
- Also accepts a CSV of prospects for batch runs (stretch).

### 1. Resolve identity
- Find the company's domain and a one-line description. Find evidence that the person holds the role at that company.
- Decision: if two or more plausible entities exist (two companies with the name, or the person's name matches people at different companies) and confidence is below threshold, pause the run and ask the rep to choose. This is edge case 1.
- Output: `{company_domain, company_summary, person_role, identity_confidence, evidence_urls}`.

### 2. Gather signals
Run these in parallel. Each has an 8 second timeout. A failed source is marked failed in the run view and skipped; the run continues.
- News and press about the company (last 12 months), filtered by domain.
- Person's public content: interviews, podcasts, talks, articles, quotes in press.
- Hiring: open roles from Greenhouse, Lever or Ashby boards, or job search fallback. Finance and ops roles matter most for Zamp.
- Company site: about, newsroom, blog.
- Firmographics: size, industry, location (Apollo free tier or PDL).
- Funding: extracted from news results, not a paid API.

### 3. Normalise
Every signal becomes one record:
`{id, type, claim, snippet, source_url, source_name, published_at, fetched_at, about: person|company, entity_match: 0-1}`.
A signal without a URL or a date is dropped or marked "undated" (scored down).

### 4. Filter
- Entity match below threshold: dropped (shown greyed out with reason).
- Older than 180 days: kept as background only, cannot be the hook.
- Sensitivity classifier: layoffs, lawsuits, investigations, health, death, family, politics, personal life posts, exec departures, missed earnings. Blocked from being a hook; shown in the UI with a "blocked: sensitive" label. Edge case 3.
- Role change detection: a signal saying the person has left or a successor was named stops the run with "contact may be outdated". Edge case 4.

### 5. Candidate hooks
LLM proposes 3 to 5 hooks. Each hook must cite one or more signal ids and fill in: the signal, the inferred pain or priority for this person, why Zamp is relevant to that pain, and why now.

### 6. Score
Rubric in docs/06-hook-rubric-and-writing-rules.md. Part deterministic (recency, verifiability, sensitivity gate), part LLM-judged (relevance to Zamp's offer, specificity, seniority fit). Show the score breakdown for every candidate and say why the winner won.

### 7. Draft
Premise, value, CTA. 50 to 100 words. Subject 2 to 4 words. Interest CTA ("worth a look?"), not a meeting ask. No ROI numbers. Every factual phrase carries a citation tag back to a signal id.

### 8. Verify
- Claim check: each factual sentence must map to a cited signal and be supported by its snippet. Unsupported claims trigger one rewrite; if still unsupported, the sentence is highlighted for the reviewer.
- Style lint: word count, banned openers ("I noticed you recently", "I hope this finds you well"), ROI numbers, exclamation marks.

### 9. Review
The rep sees the draft with highlighted claims linked to sources, the chosen hook and the rejected ones, and can approve, edit or reject with a reason code (wrong person, weak hook, tone, factual error, sensitive, other). Approved drafts can be copied (stretch: saved as a Gmail draft). Nothing sends automatically.

### 10. Dashboard
All runs with status (running, needs input, ready for review, approved, rejected, abstained, failed), hook score, time taken, sources used and failed. Summary numbers at the top: runs, approval rate, abstain rate, median review time, average edit distance.
