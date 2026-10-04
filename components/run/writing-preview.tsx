"use client";

import { useEffect, useRef, useState } from "react";
import type { CrawlPage, Draft, Hook, ProspectInput, Signal } from "@/lib/types";

// A compose window whose text writes itself while the research runs. It shows real progress: the
// opening line follows the latest thing found, switches to the top-ranked angle once angles are scored,
// and is replaced by the actual draft when it's written. Text that changes is backspaced and retyped,
// so you can see the thinking move. It's a preview; the checked email appears when the run finishes.

type Props = {
  prospect: ProspectInput;
  pages: CrawlPage[];
  signals: Signal[];
  hooks: Hook[];
  draft: Draft | null;
  finished: boolean;
  onSettled?: () => void; // called once the final draft has finished typing
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function lowerFirst(text: string) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

// The text the window is working toward right now.
function targetFor({ prospect, pages, signals, hooks, draft }: Props): { subject: string; body: string } {
  if (draft) return { subject: draft.subject, body: draft.body };
  const greeting = `Hi ${firstName(prospect.name)},\n\n`;
  const top = hooks.filter((hook) => !hook.blockedReason).sort((a, b) => b.scores.total - a.scores.total)[0];
  if (top) return { subject: "", body: `${greeting}${top.text.replace(/\.$/, "")}, so ` };
  const latest = signals[signals.length - 1];
  if (latest) {
    const claim = latest.claim.replace(/^The company describes itself: /, "").replace(/^"|"$/g, "").replace(/\.$/, "");
    return { subject: "", body: `${greeting}Noticed ${lowerFirst(claim).slice(0, 140)}` };
  }
  const page = pages[pages.length - 1];
  if (page) return { subject: "", body: `${greeting}Reading ${page.title.slice(0, 80)}` };
  return { subject: "", body: greeting };
}

// Moves `shown` one step toward `target`: delete back to the shared start, then type forward.
function step(shown: string, target: string): string {
  let common = 0;
  while (common < shown.length && common < target.length && shown[common] === target[common]) common++;
  if (shown.length > common) return shown.slice(0, Math.max(common, shown.length - 3)); // backspace, a few at a time
  if (shown.length < target.length) return target.slice(0, shown.length + 1);
  return shown;
}

export function WritingPreview(props: Props) {
  const { prospect, signals, hooks, draft, finished, onSettled } = props;
  const target = targetFor(props);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  });
  const settledRef = useRef(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const goal = targetRef.current;
      if (reduce.current) {
        setBody(goal.body);
        setSubject(goal.subject);
      } else {
        setBody((shown) => step(shown, goal.body));
        setSubject((shown) => step(shown, goal.subject));
      }
      // Type faster once the real draft exists, so the finished email doesn't keep the rep waiting.
      const fast = Boolean(draft);
      timer = setTimeout(tick, fast ? 9 + Math.random() * 10 : 28 + Math.random() * 40);
    };
    timer = setTimeout(tick, 200);
    return () => clearTimeout(timer);
  }, [draft]);

  const done = Boolean(draft) && body === target.body && subject === target.subject;
  useEffect(() => {
    if (done && finished && !settledRef.current) {
      settledRef.current = true;
      const timer = setTimeout(() => onSettled?.(), 900);
      return () => clearTimeout(timer);
    }
  }, [done, finished, onSettled]);

  const status = draft
    ? done
      ? "Draft written. Checking each claim against its source."
      : "Writing the draft"
    : hooks.length
      ? `Scored ${hooks.length} angles. Leading with the strongest`
      : signals.length
        ? `Drafting from ${signals.length} source${signals.length === 1 ? "" : "s"} so far`
        : "Reading before writing";

  return (
    <section aria-label="Draft preview" className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-b border-line bg-card px-4 py-2.5">
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff6fb1]" />
          <span className="size-2.5 rounded-full bg-[#c04fd8]" />
          <span className="size-2.5 rounded-full bg-[#7b5cff]" />
        </span>
        <span className="font-mono text-[11px] text-foreground/60">New message</span>
        <span className="w-10" />
      </div>
      <dl className="grid grid-cols-[4.5rem_1fr] border-b border-line text-[15px]">
        <dt className="px-4 py-2 text-foreground/50">To</dt>
        <dd className="truncate py-2 pr-4">
          {prospect.name}
          {prospect.email ? <span className="font-mono text-[12px] text-foreground/55"> &lt;{prospect.email}&gt;</span> : null}
        </dd>
        <dt className="border-t border-line px-4 py-2 text-foreground/50">Subject</dt>
        <dd className="min-h-[37px] border-t border-line py-2 pr-4">
          {subject ? <span className={done ? "" : "ai-ink"}>{subject}</span> : <span className="text-foreground/30">Waiting for the angle</span>}
        </dd>
      </dl>
      <div className="min-h-[360px] px-6 py-6 font-serif text-[19px] leading-[1.7] whitespace-pre-wrap sm:px-8 sm:text-[20px]" aria-live="off">
        <span className={done ? "text-foreground transition-colors duration-700" : "ai-ink"}>{body}</span>
        {!done && <span className="ai-caret" aria-hidden />}
      </div>
      <p className="flex items-center gap-2 border-t border-line bg-card px-4 py-2.5 font-mono text-[11px] text-foreground/60" role="status">
        <span aria-hidden className={`size-1.5 rounded-full ${done ? "bg-verified" : "animate-pulse bg-[#c04fd8]"}`} />
        {status}
      </p>
    </section>
  );
}
