# Screens and visual design

One job per screen, and the rep's next action is always the most visible thing on it.

## Screens

| Screen | Path | Job | Main action |
|---|---|---|---|
| New run | `/` | Name a prospect | Research (name and company only; role, website, LinkedIn and notes sit behind "Add role, website or notes"). Sample prospects start a run in one click, for demos. |
| Run | `/runs/[id]` | While running: watch the steps. When done: review the email. | Save to Outbox |
| Runs | `/dashboard` | See every run and how the process is doing | Open a run |
| Outbox | `/outbox`, `/outbox/[id]` | Read and copy approved emails | Copy email |
| Accounts | `/accounts` | Companies and people researched so far | None (reference) |

## Run screen states

- Running: a single centred list of the eight steps with a progress bar. The running step shows its latest note and a live timer. Nothing else competes for attention.
- Draft ready or flagged: the email takes the main column, laid out as a letter. Each sentence that comes from a source is underlined and numbered; the numbers match source notes under the letter. Teal underline: the source supports it. Amber highlight: the source doesn't fully back it. The right column explains the choice (Why this angle, with the score and the other angles considered), lists the sources, and collapses the steps to one line.
- No good reason to write (abstained): the main column says plainly that no email was written and why, with three things the rep can do. The right column shows the best angle found and why it fell short.
- Stopped: names the step that failed and its error, and keeps what was found before it stopped.
- Interrupted: a saved run that never finished shows a banner and an "Interrupted" label, not a spinner that never ends.

Edit mode swaps the letter for subject and message fields. Checks run as you type: anything that blocks saving is red, anything worth a second look is amber, and "Passes every check" in teal when clean. "Undo my edits" restores the generated draft.

## Visual system

| Token | Value | Used for |
|---|---|---|
| Page | `#f5f6f8` | Background behind panels |
| Card | `#ffffff` | Panels, table, letter |
| Ink | `#18212f` | Text |
| Muted | `#5b6573` | Secondary text |
| Line | `#e2e5ea` | Borders and dividers |
| Primary (ink blue) | `#233d91` | Buttons, links, active nav, progress, scores |
| Verified (teal) | `#0e7c6b` | Claim matches its source, step done, ready |
| Caution (amber) | `#9a5700` | Check this, step failed, flagged |

Colour carries meaning only: ink blue for actions, teal for "checked", amber for "look at this". Tokens live in `app/globals.css` and are used as Tailwind classes (`bg-verified-soft`, `text-caution`, and so on).

Type: IBM Plex Sans for the interface, IBM Plex Serif only for the email, so the draft reads as a letter and not as UI. One status vocabulary everywhere (`components/status-pill.tsx`): Ready to review, Check before sending, No good reason to write, Stopped, Running, Interrupted.

## Shared pieces

- `components/app-nav.tsx`: the one top bar (New run, Runs, Outbox, Accounts).
- `components/page-header.tsx`: page title, one line of description, optional action.
- `components/status-pill.tsx`: run status words and colours.
- `components/send-panel.tsx`: the letter view, editor, checks and Save to Outbox (`DraftEditor`).
- `lib/format.ts`: dates, "5 min ago", durations, hosts.
