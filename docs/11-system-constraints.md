# System constraints

Every limit the system works under, where it is enforced, and what happens when it is hit. Keep this in step with the code and with `CLAUDE.md`. When a constraint changes, update the file named in the "Enforced in" column in the same change, and record the decision in LEARNING.md.

## 1. Product rules (never change without a decision)

| Constraint | Enforced in | What happens if broken |
|---|---|---|
| Nothing is emailed automatically. Saving to the Outbox is a human action | `app/api/runs/[id]/send`, `components/send-panel.tsx` | The send is refused, or the Outbox is the only destination |
| LinkedIn URLs are stored as references only. The app never fetches linkedin.com | `lib/sources/*` (no LinkedIn client exists), `lib/pipeline/links.ts` (LinkedIn links are recorded, not followed) | Not possible by design. A new LinkedIn source needs a decision first |
| Every fact in a draft comes from a source the app found, or the draft is flagged | `lib/pipeline/stages/verify.ts` | The draft is marked "Check before sending" |
| The app abstains rather than invents a reason to write | `lib/pipeline/index.ts` (no unblocked hook at 50 or above ends the run as abstained) | The run ends as "No good reason to write" |
| Only public information is used: public pages, public job boards, public news | `lib/sources/*`, `lib/pipeline/stages/discover.ts` | Pages behind a login are not read |
| Cookie, consent and privacy text is never used as a source, a description, or a link to follow | `config/sources.json` (`excludeTerms`), `lib/pipeline/links.ts` (`EXCLUDED_PATH`), `lib/pipeline/stages/company-site.ts`, `lib/pipeline/stages/news.ts` | Those pages and headlines are dropped |
| Sensitive topics (layoffs, lawsuits, health, family, politics and similar) cannot be a hook | `config/sensitive-topics.json`, `lib/pipeline/sensitivity.ts` | The hook is shown greyed out with the reason, and cannot win |

## 2. Requests and time

| Constraint | Value | Where set | Enforced in |
|---|---|---|---|
| Outside requests per minute, for every source and the model together | 4 | `config/pipeline.json` `maxRequestsPerMinute` | `lib/rate-limit.ts` |
| Timeout for one outside request | 8 s | `config/pipeline.json` `sourceTimeoutMs` | `lib/sources/http.ts` |
| Timeout for one model call | 30 s | `config/pipeline.json` `modelTimeoutMs` | `lib/llm.ts` |
| Timeout for one step, including any wait for a free request slot | 300 s | `config/pipeline.json` `stageTimeoutMs` | `lib/pipeline/stage.ts` |
| Retry after a rate limit (429) from a source | Once, after 2 s | `config/pipeline.json` `sourceRetryMs` | `lib/sources/http.ts` |
| Retry after a rate limit (429) or high demand (503) from the model | 3 retries, after 2, 5 and 10 s; the next model in the list is tried each time | `config/llm.json` | `lib/llm.ts` |
| A bad model answer (not JSON, or fails the schema) | One retry, with the problem described | `lib/llm.ts` | `lib/llm.ts` |
| Source and model answers cached | 24 hours | `config/pipeline.json` `cacheHours` | `lib/cache.ts` |
| A live connection with no new events | Gives up after 120 s | `app/api/runs/[id]/stream/route.ts` (`STALL_MS`) | Stops waiting; the run page shows it as interrupted |

A fresh company takes a few minutes at 4 requests a minute. A repeat search uses saved answers and finishes quickly.

## 3. Research depth and volume

| Constraint | Value | Enforced in |
|---|---|---|
| Company pages read when discovering links | At most 4 pages, at most 2 levels deep | `lib/pipeline/stages/discover.ts` (`MAX_PAGES`, `MAX_DEPTH`) |
| Which pages are followed | Only the company's own pages whose path contains about, news, newsroom, press, blog, careers, jobs, company, team or leadership | `lib/pipeline/links.ts` (`USEFUL_PATH`) |
| Headlines checked for the same company | At most 8 candidates | `lib/pipeline/stages/news.ts` |
| News window | 180 days | `config/sources.json` `newsDays` |
| Signals kept per source | 5 | `config/sources.json` `maxSignalsPerSource` |
| Hooks per run | 3 to 5 | `lib/types.ts` (`hookAnswerSchema`) |
| Social profile links kept per company | Profiles only; video, post and share links are dropped | `lib/pipeline/links.ts` |

## 4. Scoring and thresholds

| Constraint | Value | Where set |
|---|---|---|
| Hook score, out of 100 | Relevance 35, recency 20, specificity 15, seniority 10, verifiability 10, source type 10 | `config/rubric.json` |
| Hook is "personalised" (no warning) | 70 or more | `config/rubric.json` `thresholds.personalised` |
| Hook is "flagged" (draft with a check warning) | 50 to 69 | `config/rubric.json` `thresholds.flagged` |
| Hook abstains | Below 50, or no hook passes the sensitivity check | `lib/pipeline/index.ts` |
| Recency points | 20 up to 14 days, 14 up to 45, 8 up to 90, 3 up to 180, 0 after or undated | `config/rubric.json` `recencyBands` |

The weights and thresholds are hypotheses. Tune them from reviewer feedback, not from one run.

## 5. Mail

The full rules are in `docs/09-mail-guardrails.md`. The limits, as enforced:

| Constraint | Value | Blocks Send? |
|---|---|---|
| Subject length | 2 to 4 words | Yes |
| Body length | 40 to 130 words (target 50 to 100) | Yes (the target is a warning) |
| Recipient | A valid email address | Yes |
| Plain text, no links, no emoji, no exclamation marks | Required | Yes |
| Questions in the body | At most 1 | Yes |
| Stock phrases, mention of how the information was found, ROI figures | Not allowed | Yes |
| Paragraphs, sentence length, flattering words, greeting | Warnings | No |

Enforced in `config/mail-rules.json`, `lib/mail-check.ts`, the Send panel, and the Send endpoint.

## 6. Data

| Constraint | Detail | Where |
|---|---|---|
| Storage is one local SQLite file | `data/app.db`, created on first use | `lib/db.ts` |
| The file is not committed | `data/` is in `.gitignore` | `.gitignore` |
| Single user, single machine | No accounts, no sync, no backup. Deleting the file deletes every search, account and outbox mail | Architecture |
| Saved searches stay readable after a change to the format | Defaults for new fields; events that cannot be read keep their message and lose their data | `lib/runs.ts`, `lib/types.ts` |
| Schema changes are applied on start | Added columns are checked and added if missing | `lib/db.ts` `migrate` |
| Personal data | Names, roles, emails and LinkedIn references are stored locally only and never sent to a third party except the words of a prompt | `lib/accounts.ts`, `lib/llm.ts` |

Note on personal data in prompts: the model receives the prospect's name, role, company, and the public signals. It does not receive emails or LinkedIn references.

## 7. Secrets and logging

| Constraint | Where |
|---|---|
| The Gemini key is kept in `.env.local` only, which git ignores | `.gitignore`, `.env.example` (placeholder only) |
| The key is never printed or stored in a database or an error message | `lib/llm.ts` |
| Errors shown to the rep say what failed in plain words, not the raw provider response | `lib/llm.ts` (`LlmError`) |

## 8. Platform

| Constraint | Detail |
|---|---|
| Runtime | Node 24 LTS. The built-in `node:sqlite` module is used (no native install) |
| Operating system | Developed and tested on Windows 11. Paths and the build folder are Windows-safe |
| Serving | Local only (`npm run dev` or `npm start`). No public host. A public link is a later decision |
| Next.js | 16. `params` and `searchParams` are Promises and must be awaited |
| Dynamic pages | Pages that read the database are `force-dynamic`, so they never show a build-time copy |
| Stream length | Route limit `maxDuration` is 60 s, which only matters on a public host |

## 9. Interface

| Constraint | Detail | Where |
|---|---|---|
| Sentence case for labels | Applies to every label | `docs/10-screens.md` |
| Colour carries meaning only | Ink blue for actions, teal for checked, amber for look at this | `app/globals.css`, `docs/10-screens.md` |
| Text for a sales rep, not a developer | Stage messages and errors | `lib/pipeline/*`, `components/*` |
| Plain-language scores | Breakdown is hidden behind "How this was scored" | `components/run-view.tsx` |
| Email body is shown exactly as stored | No re-formatting in the Outbox | `app/outbox/[id]/page.tsx` |

## 10. Out of scope

| Item | Why |
|---|---|
| Sending email automatically | Project rule |
| Fetching or scraping LinkedIn, or using logged-in scraping services | Project rule, and legal risk (see `docs/research/notes/data_sources.md`) |
| Multiple users, teams, roles, sharing | One user today |
| CRM sync | Needs a paid connection per customer |
| Bulk upload | Locked: the free request limit makes a batch impractical (`config/features.json`) |

## 11. Open decisions

| Decision | Options | Needed from |
|---|---|---|
| Send from the user's real mailbox | Gmail or Outlook. Creating a draft in the mailbox keeps the human send step. Direct sending is the other option | Owner: which account, and an OAuth app set up for it |
| Search by meaning across accounts | Elasticsearch (needs a hosted cluster) or keep text matching | Owner: budget for a cluster |
| Pricing and plans | Names and prices in `config/features.json` are placeholders | Owner |
| Public link for the interview | Tunnel or hosted deploy | Owner |
