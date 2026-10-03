# 16-minds review (light mode)

Question put to all 16 personality types: what should the build prioritise, which edge cases matter, and what will impress the interviewers? Each scored the approach "research, pick hook, draft, human review" from 1 to 5.

| Type | Score | Stance | Main concern |
|---|---|---|---|
| INTJ | 4 | The skeleton is right; the product is the judgment layer: provenance, an explainable hook score, and a "no good hook, don't send" outcome. | A slick demo that misattributes signals or breaks on LinkedIn scraping. |
| INTP | 4 | Only if "relevant hook" has a precise, inspectable definition with provenance, recency and confidence per hook. | Without a rubric and a refusal threshold it is an LLM making a confident guess. |
| ENTJ | 4 | Spend the first 3 days making one path run reliably on 10 real prospects, then dashboard and edge cases. | LinkedIn scraping is fragile and against its terms. |
| ENTP | 4 | The pipeline is table stakes; win on edge cases where the honest output is "don't send". | Reads as a ChatGPT wrapper with a nice UI. |
| INFJ | 4 | Centre the evidence and reasoning behind each draft, not the polish of the prose. | A week spent on UI while the hook choice stays unexplained. |
| INFP | 4 | Care most about the review step; personalisation must not feel like surveillance. | A creepy flattery machine mining personal posts. |
| ENFJ | 4 | Frame it around the rep: "why this, why now" on every hook, edit and reject in review. | API calls with a pretty dashboard and no visible judgment. |
| ENFP | 4 | The wow is showing why the hook was chosen and which alternatives were rejected. | Feature excitement eats the week and the happy path stays fragile. |
| ISTJ | 4 | Reliability first: runs every time, logs every source, keeps the approval gate. | Live scraping fails in the interview. |
| ISFJ | 4 | One flow that never breaks; every hook links to its source. | An invented or stale signal reaches a draft untraceable. |
| ESTJ | 4 | Lock a working slice by day 3; every stage has a success criterion. | A source with no fallback. |
| ESFJ | 4 | Respect the prospect's dignity; show the rep why each hook was chosen. | No visible rule for what the system chooses not to use. |
| ISTP | 4 | One real prospect end to end by day 2, then edge cases. | The LLM papers over missing data with a confident fake hook. |
| ISFP | 4 | Put the source articles next to the draft so it reads as written for that person. | Drafts that list researched facts and feel creepy ("I listened to your podcast last month!"). |
| ESTP | 4 | Thin end-to-end run by day 2, then demo reliability and on-camera edge cases. | APIs rate-limit mid-demo without cached fallbacks. |
| ESFP | 4 | Make the live demo the main thing: streaming stages, hook card with "why", one-click approve. | Drafts sound like generic AI; test them on real reps early. |

## What they agreed on

All 16 scored 4. No one argued against the pipeline shape; the disagreement was only about emphasis.

- Every hook must trace to a dated, cited source. (Nearly all.)
- The system should be able to say "no good hook" and abstain. (A clear majority; the rest named "no signal" as an edge case without saying how to handle it.)
- Do not depend on LinkedIn scraping; add cached fallbacks for the live demo. (About ten of the sixteen.)
- Most-named edge cases: wrong person or same name, no or stale signal, sensitive news such as layoffs, source failure mid-run.

## Where they differed

- Reliability first (ENTJ, ESTJ, ISTJ, ISTP, ESTP) versus judgment first (INTJ, INTP, ENTP, INFJ). Resolution: a thin working path by day 3, then the judgment layer, then polish.
- Logic of the rubric (INTP, INTJ) versus how the recipient feels (INFP, ESFJ, ISFP). Resolution: the sensitivity filter and company-level hooks for executives cover the second without weakening the first.

## Points few types raised

- ESFP: test drafts on real salespeople early in the week, not the night before.
- ISFP: a draft can be accurate and still creepy if it lists what was researched. Hence the "never say how you found it" writing rule.
- ENFP: show the rejected hooks too, so the reviewer chooses from options.
