# Product review: what's worth improving, and what to build next

Written 2026-10-04, after the one-call pipeline, the wider free search and the Patterns dashboard shipped. Effort: S is under a day, M is one to three days, L is a week or more.

## Where it stands

The core loop works and is honest. A run reads the company's site, its feed, two news indexes and five job-board APIs for free, ranks angles in code, makes one Gemini call (about 1,300 to 1,800 tokens), and checks every claim in code. It abstains when there is nothing real to say. Live runs on Stripe, Notion and Palantir produced drafts that passed every check; Basecamp and Intel correctly produced no email.

Three things hold it back:

1. **The emails sound alike.** There is one approved customer story, one value line and two approved figures, so most drafts share a skeleton: "X is hiring N finance roles: an AI employee live in four days". A reviewer reading five in a row will notice.
2. **It knows the company, not the person.** Every signal is company-level unless the rep pastes LinkedIn text. The brief asks for "something real about that person".
3. **It handles one prospect at a time.** The brief's pain is an SDR with 200 prospects. One-at-a-time research doesn't touch that.

## What to improve, in priority order

### Now (before the demo)

| # | Improvement | Why | Effort |
|---|---|---|---|
| 1 | **More customer stories, matched by industry and angle.** Add 5 to 8 sourced stories to `proof.caselets` (Zamp case pages, press quotes, Wio Bank, procurement and compliance roles). Match on angle type and the prospect's sector. | The single biggest lift to email quality. Today every draft retells the Mindbody story. | S, needs sourcing |
| 2 | **Subject patterns.** Rotate 4 to 5 subject shapes ("Question about Stripe's AP hiring", "14 finance roles at Stripe", "Stripe + Zamp: AP in four days"), still checked for company and outcome. | Breaks the template feel without loosening the rules. | S |
| 3 | **Read the job descriptions, not only the titles.** Greenhouse and Lever return the posting text. Look for NetSuite, SAP, Coupa, "month-end close", "invoice volume", "3-way match". | Turns "hiring a Senior Accountant" into "hiring to run NetSuite close", which is far more specific, and still free. | M |
| 4 | **Check that a guessed job board is the right company.** A guessed slug can hit someone else's board (`example` on Greenhouse belongs to a different company). Compare the board's company name and links with the domain before using it. | Prevents a confident wrong fact, the worst failure for this product. | S |
| 5 | **One-click "write with angle 2".** The writer already sees three angles. Let the rep switch and re-write (one more call). | Reps disagree with the top angle sometimes. Today they can only edit by hand. | S |

### Next (the week after)

| # | Improvement | Why | Effort |
|---|---|---|---|
| 6 | **Batch mode.** Upload a CSV of prospects; runs queue one after another; a review inbox shows drafts ready, flagged and abstained, with keyboard shortcuts to approve, edit or skip. | This is the brief's actual problem (200 prospects). The re-run queue added today is the seed of it. | M |
| 7 | **Person signals that stay compliant.** Keep the paste box. Add an optional search-snippet lookup through a search API with a key (Brave Search has a free tier). It returns the public "Name, Title at Company" line without opening LinkedIn. Optional: People Data Labs or Apollo enrichment with the rep's own key. | Moves from company-level to person-level personalisation. | M |
| 8 | **SEC EDGAR for US public companies.** Free and keyless. 8-K item 5.02 (CFO or officer changes), acquisitions, new segments. | New finance leaders in their first 90 days are Zamp's best timing signal, and EDGAR states it as fact. | M |
| 9 | **Wikidata for identity.** Free. Resolves a company name to its official website, aliases, parent and industry. | A second, independent same-company check and a sector for matching stories. | S |
| 10 | **Real Gmail drafts through the Gmail API.** OAuth once; "Save to Gmail drafts" creates the draft with the designed HTML and the logo intact, in the rep's own Drafts. Still never sends. | Removes the paste step for designed mails. | M |
| 11 | **Follow-up drafts.** Day 3 and day 7 follow-ups that reuse the run's sources with a new angle each time. | Most replies come after the first email. | S |
| 12 | **Reviewer feedback loop.** Record approve, edit and reject, plus a reason, then show approval rate and edit distance per angle type. | The only way to tune the rubric weights with evidence instead of guesses. | M |

### Later

| # | Improvement | Why | Effort |
|---|---|---|---|
| 13 | **Watchlist alerts.** Re-run saved accounts weekly. Notify when a new finance role, feed post or 8-K appears. | Turns research into timing, the "why now". | M |
| 14 | **CRM hand-off.** Push the draft, sources and angle to HubSpot or Salesforce as an activity. | Where reps actually work. | M |
| 15 | **Hosted and multi-rep.** Postgres, sign-in, per-rep signatures and quotas, a job queue instead of in-process runs. | Needed before anyone but you uses it. | L |
| 16 | **Eval set and nightly regression.** 20 fixed prospects with expected outcomes; run nightly; chart claim accuracy and abstain rate over time. | Catches regressions such as today's robots.txt bug before a demo does. | M |

## Things found during this review

- **The robots.txt parser treated `Disallow: /*/invite/` as "block everything"**, so Notion and Ramp were unreadable. Fixed.
- **News that only mentions a company became a fact about it** ("Intel recently raised 85 million"). Fixed: the company must be the headline's subject.
- **flash-lite rejects `thinkingBudget: 0`**, so the fallback model failed every time. Fixed.
- **Guessed job-board slugs can belong to another company.** Not fixed yet (item 4).
- **Older runs were recorded before angle types existed.** The dashboard now infers them from the same lexicon.

## Mail design

React Email (`@react-email/components`) now renders three designs for every draft: Letter, Card and Quote. The words are the same in each; only the layout changes. The designs are table-based and inline-styled, which is what Gmail and Outlook render reliably, and they reach Gmail through the clipboard ("Copy formatted", or automatically with "Open in Gmail").

A caution for the pitch: on a first cold email, heavy HTML and images can lower inbox placement and read as marketing. Letter is the default for that reason. Card suits a warm follow-up or a reply.

Alternatives considered:
- **MJML.** A markup language that compiles to responsive email HTML. It's mature, but a second templating language next to React.
- **Unlayer or Beefree.** Drag-and-drop editors you can embed. Good for marketing teams, too much for a sales draft.
- **Gmail API drafts.** The best delivery path for designed mails (item 10).

## LinkedIn

The app does not fetch linkedin.com. Scraping breaks LinkedIn's terms, LinkedIn has sued scrapers (Proxycurl shut down in July 2025), and LinkedIn has no official API for reading other people's profiles. Compliant ways to get person-level context:

1. **The rep pastes it.** Built: headline, About or a recent post become cited, ranked, checked signals.
2. **Search-engine snippets** through a search API with a key: the public title line for "name + company", without opening LinkedIn.
3. **Licensed people-data providers** (People Data Labs, Apollo, Coresignal) with the rep's own key. They source the data under their own terms.
4. **The person's own words elsewhere**: podcast and conference talks, company blog author pages, press quotes. All public, all citable, and the "premise first" research says these work best.

## Dashboard

Added a Patterns section with seven new views:
- How runs end, one square each: the last 100 runs; click a square to open that run.
- Cost of a draft: a gauge of tokens per draft against the old four-call pipeline.
- From source to result: a flow from the winning angle's source, to its type, to the run's result.
- What a winning angle is made of: a radar of the six score parts, drafted runs against abstained runs.
- When you research: a weekday-by-hour heatmap.
- Words the subject lines lean on.
- Most researched: a leaderboard of companies.

Next charts worth adding once the data exists:
- Approval rate and edit distance by angle type (needs item 12).
- Reply rate by angle (needs sending and tracking, out of scope today).
- Signal freshness: a strip plot of signal age at run time.
- Story usage: how often each customer story is used, to spot repetition (item 1).
