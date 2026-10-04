# Demo video script

AI-narrated walkthrough of the PS-3 outreach build. Length 5:11. Voice: Piper (open-source text to speech), voice en_US ryan, slowed to about 145 words a minute. Captions are burned into the video and also provided as captions.srt.

| Time | Section | On screen |
|---|---|---|
| 0:00 | Title card | "From a prospect to a draft worth reviewing" |
| 0:04 | What this is | Landing page: the hero and the 'About me' card. |
| 0:28 | The thinking behind it | Landing page: 'Why it's different' comparison table, then the research section. |
| 1:02 | Starting a run | New run page: name, company, website and recipient filled in; optional details opened; recorded cases below. |
| 1:24 | Reading the website | Live run (recorded Stripe case): the step graph and the findings feed as pages are read. |
| 1:47 | News and hiring | Findings feed: news headlines and open roles arriving; the email writes itself on the right. |
| 2:18 | Ranking the angles | Angles scored; the writing preview switches to the top angle. |
| 2:38 | One model call, checked in code | The finished draft: underlined, numbered claims; recipient added; 'What this run used' panel. |
| 3:14 | Design and hand-off | Mail design: Card and Quote previews; the Open in Gmail button. |
| 3:32 | Edge case: only mentioned | Edge case (recorded Intel case): headlines only mention Intel, so the run abstains and offers templates. |
| 3:54 | Dashboard | Dashboard: results, funnel and score charts, then the Patterns section. |
| 4:13 | How it was optimised | Architecture and logic diagrams. |
| 4:56 | What's next | Back to the top of the diagrams page, then the end card. |
| 5:06 | End card | "Research in code. One call to write." |

## Narration

### 0:04 What this is

*On screen: Landing page: the hero and the 'About me' card.*

This is a build for Zamp's case study, problem statement three: personalised outreach. A sales rep names a prospect. The app researches public signals, picks the best reason to get in touch, and writes a draft for a person to review. Nothing is ever sent on its own. In the next five minutes, we'll watch a real run, and look at the tech and the choices behind it.

### 0:28 The thinking behind it

*On screen: Landing page: 'Why it's different' comparison table, then the research section.*

The starting point was research. AI sales tools rarely fail for lack of text. They fail on trust. Reps get generic lines, and facts they have to check by hand. So the build follows three rules. First, every claim in an email links to a dated source. Second, the app says so when there is nothing worth saying. Third, anything a rule can check is checked in code, not by a model. Code is cheaper, faster, and gives the same answer every time.

### 1:02 Starting a run

*On screen: New run page: name, company, website and recipient filled in; optional details opened; recorded cases below.*

A run needs four things: the person, the company, its website, and the recipient's email. Text pasted from LinkedIn is optional. The app never opens LinkedIn itself, because that breaks LinkedIn's terms. Recorded cases sit below the form, so a demo never depends on the network.

### 1:24 Reading the website

*On screen: Live run (recorded Stripe case): the step graph and the findings feed as pages are read.*

Each step appears as it happens. First, the app confirms the website. Then it reads the site with Playwright, a real headless browser. No AI reads the pages, so this costs no tokens. It respects robots dot t x t, and follows up to eight useful pages, like careers, newsroom, and the company's own news feed.

### 1:47 News and hiring

*On screen: Findings feed: news headlines and open roles arriving; the email writes itself on the right.*

At the same time, it searches news and hiring, all for free. News comes from Google News, searched twice, and from Bing News. Google News matches words, not companies. So a check in code drops headlines about a different company with the same name, and stories where the company is only mentioned. Hiring comes from five public job boards, including Greenhouse and Lever. Here, it finds fourteen open finance roles at Stripe.

### 2:18 Ranking the angles

*On screen: Angles scored; the writing preview switches to the top angle.*

Next, it scores each possible angle out of one hundred. Finance hiring and finance system changes score highest. Recent, verifiable sources score higher. Sensitive topics, like layoffs, are blocked. On the right, the email is being written as the findings come in.

### 2:38 One model call, checked in code

*On screen: The finished draft: underlined, numbered claims; recipient added; 'What this run used' panel.*

Here is the draft. Each sourced sentence is underlined and numbered. This is the run's only Gemini call. It gets the top three angles, a matching customer story, and the only figures it may use. It picks one angle, and says why. Then code checks every claim. The numbers must appear in the source. Most of the words must match. And the company must be the subject of the story. The panel on the right shows the cost: one model call, about eighteen hundred tokens. Everything else was free.

### 3:14 Design and hand-off

*On screen: Mail design: Card and Quote previews; the Open in Gmail button.*

The rep can edit the draft, and pick a design: a plain letter, a card, or a quote. These are built with React Email, so they look right in Gmail. Open in Gmail fills in the message. The rep presses send. The app never does.

### 3:32 Edge case: only mentioned

*On screen: Edge case (recorded Intel case): headlines only mention Intel, so the run abstains and offers templates.*

Now an edge case. Intel has many headlines, but in each one, Intel is only mentioned, or the headline is a guess about the future. Those can't support an email. So the app writes nothing, explains why, and offers plain templates. A wrong fact about a prospect is worse than no email.

### 3:54 Dashboard

*On screen: Dashboard: results, funnel and score charts, then the Patterns section.*

The dashboard keeps only what a rep needs: results over time, where runs drop off, and where the facts come from. Below that are patterns: every recent run as a square, the cost per draft against the first version, a flow from source to result, and what a winning angle is made of.

### 4:13 How it was optimised

*On screen: Architecture and logic diagrams.*

Under the hood, it's one Next js app with a local SQLite database. Every step is saved, then streamed to the browser, so a reload replays the run exactly. Pages, feeds and answers are cached for a day, so a repeat run costs almost nothing. The biggest optimisation was cutting model calls. The first version used four Gemini calls per run: to check the news, rank the angles, write, and verify. Now everything except writing happens in code, and thinking tokens are switched off. A draft went from about thirty six hundred tokens to under two thousand, and the ranking is now the same every time.

### 4:56 What's next

*On screen: Back to the top of the diagrams page, then the end card.*

Next: batch mode for many prospects, more customer stories, and reading job descriptions for tools like NetSuite. Thanks for watching.
