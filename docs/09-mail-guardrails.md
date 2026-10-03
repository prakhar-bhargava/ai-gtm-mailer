# Mail guardrails

What every outreach email must look like, and which rules stop it being sent.

This document, `config/mail-rules.json` and `lib/mail-check.ts` describe the same rules. Change all three together. The draft prompt reads its numbers from the config, so the model is told the same limits the checks enforce.

Two kinds of rule:
- **Must fix** (hard): blocks Send, both in the browser and on the server. An email that breaks one of these can't be saved to the Outbox.
- **Consider** (soft): shown as a warning. The rep can still send.

The draft is also checked by the pipeline's verify step. Its findings appear on the draft as style checks and can mark the draft as flagged. The Send step applies the same rules again, so an edited draft is always checked.

## Subject

| Rule | Kind | Why |
|---|---|---|
| 2 to 4 words | Must fix | Short subjects get more opens (Belkins). |
| No exclamation mark, and no word in capitals (four or more letters) | Must fix | Shouting reads as marketing. Short acronyms such as AP are fine. |
| Lowercase is fine, and encouraged | Guidance | Reads like a colleague, not a campaign. |
| No clickbait, no question marks | Guidance | Keep it a plain statement of what the email is about. |

## Length and paragraphs

| Rule | Kind | Why |
|---|---|---|
| 40 to 130 words | Must fix | The hard limits. Outside them the email is too thin or too long to read. |
| Aim for 50 to 100 words | Consider | Target from docs/06. Length matters little on its own (Hunter), so shorter costs nothing. |
| 2 to 4 short paragraphs | Consider | Premise, value, call to action. |
| No sentence over 30 words | Consider | Long sentences lose the reader. |

## Structure

Every email has three parts, in this order:

1. **Greeting**, on its own line: `Hi <first name>,`. Consider if missing.
2. **Premise**: one factual sentence about the company, taken from a cited signal.
3. **Value**: one or two sentences on the pain it implies and what Zamp does about it. Use the approved value line from `config/seller-brief.zamp.json`; do not add features that are not in the seller brief.
4. **Call to action**: one interest question, such as "Worth a look?" Interest questions beat meeting requests at first contact (Gong).
5. **Sign-off**: from `config/sender.json`, added by the app. The rep does not type it.

## Formatting

| Rule | Kind |
|---|---|
| Plain text only. No markdown: no bold, headings, bullet points, backticks or quote marks used as formatting | Must fix |
| No links in the body. The signature has the company website as plain text | Must fix |
| No emoji | Must fix |
| No exclamation marks | Must fix |
| No HTML | Must fix (plain text is stored and shown as it is written) |

## Wording

| Rule | Kind | Why |
|---|---|---|
| No stock openers or stock phrases ("I noticed you recently", "I hope this finds you well", "touch base", and the rest of the list in the config) | Must fix | They read as automated (docs/06). |
| Do not say how the information was found ("I saw on LinkedIn", "I noticed your post", "your profile") | Must fix | Pointing at a person's social activity reads as creepy. Lead with the company fact instead (docs/06). |
| At most one question, and it is the call to action | Must fix | One clear ask. |
| No ROI figures or multipliers ("2x faster", "30% less") | Must fix | Associated with lower reply rates (Gong), and the app cannot prove them. |
| No flattery ("amazing", "impressive", "love", "excited") | Consider | State the fact; drop the praise. |
| No invented facts. Every sentence about the prospect's company is a fact from a cited signal | Checked by the verify step | Claims must be traceable to a source (priority 3 in CLAUDE.md). |
| Do not name customers in a draft | Manual | The app cannot check this by rule. The rep checks it. |

## Tone

Plain, peer to peer, and short. No hype words. The rep is writing to a peer, not a campaign. Tone is set in `config/seller-brief.zamp.json`.

## How it is enforced

| Where | What it does |
|---|---|
| Draft prompt (`lib/pipeline/prompts.ts`) | Gives the model the limits from the config. |
| Draft schema (`lib/types.ts`) | Rejects a body under 35 words or over 130, and retries once. |
| Verify step (`lib/pipeline/stages/verify.ts`) | Runs `checkMail` on the draft. Findings appear on the draft; any finding makes it flagged. |
| Send panel (`components/send-panel.tsx`) | Shows the checks while the rep edits. Send is disabled while a must-fix rule fails. |
| Send API (`app/api/runs/[id]/send/route.ts`) | Refuses a mail with a must-fix rule (HTTP 422). This is the final check. |

## Checklist before pressing Send

- [ ] Subject is 2 to 4 words, no shouting, no exclamation mark
- [ ] Body is 50 to 100 words, 2 to 4 paragraphs
- [ ] Greeting, premise, value, one question, sign-off
- [ ] Every fact about the company comes from a source shown on the draft
- [ ] No customer names, no links, no emoji, no markdown
- [ ] Nothing says how the information was found
