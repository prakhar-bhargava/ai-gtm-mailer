# Screens and visual design

Two parts: a landing page that explains and sells, and the app where the work happens. Each app screen has one job, and the rep's next action is always the most visible thing on it.

## Screens

| Screen | Path | Job | Main action |
|---|---|---|---|
| Landing | `/` | Explain what it does, why it's different, the research behind it, and what's coming | Start free trial (goes to `/app?welcome=1`) |
| New run | `/app` | Name a prospect: name, organisation, website, recipient email (all required). Role, LinkedIn and notes are optional and folded | Research and draft |
| Run | `/runs/[id]` | While running: watch the steps, the findings feed and the email writing itself. When done: review the email | Open in Gmail |
| Dashboard | `/dashboard` | How the research is going, in charts, then every run in a table | Open a run |
| Search | `/search?q=` | Runs and accounts that match, from the search bar in the top bar | Open a result |
| Outbox | `/outbox`, `/outbox/[id]` | Every approved email, exactly as sent | Open in Gmail, copy |
| Accounts | `/accounts` | Companies and people researched, with links found on each company's site | Add details |

## Landing page sections

Hero (wordmark, machine-voice note, trial CTA), sources strip, "About me" tabbed card (how I work, what I read, FAQs), what's new (feature tiles), mail rules, why it's different (comparison table against table builders, autonomous AI SDRs and CRM agents, with "not documented" where no public documentation was found), research (secondary stats with links, primary test runs, stakeholder review, synthesis), beta and rolling out (from `config/features.json`, field `status`), closing CTA, footer. The footer says it is a case-study prototype not affiliated with Zamp.

## New run page

Stats strip (runs, drafts to review, share that produced a draft, median run) above a four-field form. Under the form, "Try a case" in two groups:

- Happy paths: Stripe (recorded: 14 finance roles, passes every check), Notion (live: five finance roles on its Ashby board).
- Cases to look at: Ripik AI (abstains), Intel (recorded: only mentioned in the news, so no email), and the two planned edge cases (same-name company, prospect changed jobs), shown dashed as "Planned".
- Older recordings made before the one-call pipeline are kept in `fixtures/replays-archive/` and are not shown.

Each case can be watched as a recorded replay ("Watch it run") or used to fill the form for a live run ("Use these details"). The recipient email is left for the rep; sample contacts are placeholders.

## Run screen

- Step graph: eight nodes in pipeline order. Done is black with a tick, running pulses blue, failed is amber. The running step's latest note sits underneath in monospace.
- While running, two columns. Left: "What I'm finding", newest first: each page the crawler read (title, path, description, headings, browser time), links and posts found on the site, news and job signals, scored angles, failed steps. Request notes are hidden behind a toggle. Right: a compose window whose text writes itself in a purple-to-pink gradient. It follows the latest finding, switches to the top angle once angles are scored, then types the real draft. Changed text is backspaced and retyped.
- Under the letter, "Mail design" picks Letter, Card or Quote (React Email, `lib/email/templates.tsx`) with a live preview of the real email HTML. The chosen design is what Copy formatted and Open in Gmail put on the clipboard.
- When the draft has finished typing, the letter view replaces the preview: sourced sentences underlined and numbered, notes underneath (teal: supported; amber: check). Actions: Open in Gmail (blue, primary), Copy formatted, Save to Outbox only, Edit.
- Right column after the run: why this angle, sources, website pages read, steps summary. The full feed stays available under "Research log".
- Abstained: no email, the reason, what to do, and three templates. Stopped: names the failed step and its error.

## Gmail hand-off

`lib/gmail.ts` opens `https://mail.google.com/mail/?view=cm&fs=1&to=…&su=…&body=…` in a new tab, from inside the click so it isn't blocked. Gmail's compose link takes plain text only, so formatting is carried by line breaks: one blank line between paragraphs, then the signature. "Copy formatted" puts an HTML version on the clipboard (paragraphs, grey signature) that pastes into Gmail with its styling. Opening in Gmail also records the email in the Outbox.

## Visual system

| Token | Value | Used for |
|---|---|---|
| Canvas | `#ececec` | Page background |
| Card | `#f8f8f8` / white | Panels, letter, compose |
| Ink | `#0d0d0d` | Text, primary buttons, done steps |
| Line | `#d8d8d8` | Borders, dividers, hairline grids |
| Electric blue | `#1a54ff` | Links, running step, Gmail button, charts, footer |
| Pink, lavender, teal, navy | `#f39bdc`, `#b8a8ff`, `#8fdccf`, `#0b1638` | Pixel art and the AI writing gradient only |
| Verified | `#0e7c6b` | Claim backed, step done, ready |
| Caution | `#9a5700` | Check this, step failed, flagged |
| Chart series | `#1a54ff`, `#1e9c84`, `#d94fd5`, `#c77800` | Categorical; checked for colour-blind separation with the dataviz validator |

Type: Inter Tight for interface and headlines (light weights for large headings), IBM Plex Mono for the machine voice (buttons, labels, notes), IBM Plex Serif only for the email. Buttons are pills with monospace labels. Pixel art (`components/art.tsx`) is generated in the browser with value noise and an ordered dither, so nothing is copied from anywhere; it respects reduced motion.

## Charts (dashboard)

Built in `components/charts.tsx`, no chart library. Tiles with a sparkline; runs per day stacked by result; results ring; funnel from runs started to approved by a rep, with big drops in amber; best-angle score histogram with the 50 and 70 thresholds; signals by source; median time per step; source reliability. Every chart has a hover tooltip, a legend when it has more than one series, and values in text colours.

## Patterns (dashboard, second half)

`components/patterns.tsx` and `components/fun-charts.tsx`, data from `lib/fun-analytics.ts`: streak, busiest hour, tokens saved and companies tiles; a waffle of the last 100 runs (click a square to open it); a token gauge against the old four-call pipeline; a source → angle type → result flow; a radar of the six score parts for drafted against abstained runs; a weekday-by-hour heatmap; subject-line words; a most-researched leaderboard. Above them, "Bring runs up to date" appears while any run is flagged.

## Shared pieces

- `components/brand.tsx`: mark, logo, pill buttons, monospace note, kicker label.
- `components/app-nav.tsx`: top bar with search.
- `components/status-pill.tsx`: run status words and colours, the same everywhere.
- `components/run/*`: step graph, live feed, writing preview.
- `components/send-panel.tsx`: letter view, editor, checks, Gmail and Outbox actions.
- `lib/format.ts`, `lib/gmail.ts`.
