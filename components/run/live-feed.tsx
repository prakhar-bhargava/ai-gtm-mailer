"use client";

import { ArrowUpRight, Briefcase, FileText, Globe, Link2, Newspaper, Sparkles, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { STEP_LABEL } from "@/components/run/steps";
import { formatDate, hostOf } from "@/lib/format";
import type { CrawlPage, Finding, Hook, Signal, StageEvent } from "@/lib/types";

// Everything the run finds, the moment it finds it: pages read, links and dated posts, news and roles,
// scored angles, and anything that failed. Newest first. This is the "show your working" view.

type Item =
  | { kind: "page"; key: string; at: string; page: CrawlPage }
  | { kind: "findings"; key: string; at: string; findings: Finding[]; stage: string }
  | { kind: "signal"; key: string; at: string; signal: Signal }
  | { kind: "hooks"; key: string; at: string; hooks: Hook[] }
  | { kind: "failed"; key: string; at: string; stage: string; message: string }
  | { kind: "note"; key: string; at: string; stage: string; message: string };

export function feedItems(events: StageEvent[]): Item[] {
  const items: Item[] = [];
  events.forEach((event, index) => {
    const key = `${index}-${event.stage}-${event.status}`;
    if (event.stage === "run") return;
    if (event.payload?.crawl) items.push({ kind: "page", key, at: event.at, page: event.payload.crawl });
    else if (event.payload?.findings?.length) items.push({ kind: "findings", key, at: event.at, findings: event.payload.findings, stage: event.stage });
    (event.payload?.signals ?? []).forEach((signal, position) =>
      items.push({ kind: "signal", key: `${key}-${position}-${signal.id}`, at: event.at, signal }),
    );
    if (event.payload?.hooks?.length) items.push({ kind: "hooks", key, at: event.at, hooks: event.payload.hooks });
    if (event.status === "failed") items.push({ kind: "failed", key, at: event.at, stage: event.stage, message: event.message });
    if (event.status === "progress" && !event.payload) items.push({ kind: "note", key, at: event.at, stage: event.stage, message: event.message });
  });
  return items.reverse();
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function LiveFeed({ events, compact = false }: { events: StageEvent[]; compact?: boolean }) {
  const [showNotes, setShowNotes] = useState(false);
  const all = feedItems(events);
  const items = showNotes ? all : all.filter((item) => item.kind !== "note");
  const counts = {
    pages: all.filter((item) => item.kind === "page").length,
    signals: all.filter((item) => item.kind === "signal").length,
    notes: all.filter((item) => item.kind === "note").length,
  };

  return (
    <section aria-label="Research feed" className="grid content-start gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-medium">What I&apos;m finding</h2>
        <span className="flex items-center gap-3 font-mono text-[11px] text-foreground/60">
          <span>{counts.pages} pages</span>
          <span>{counts.signals} sources</span>
          <button type="button" onClick={() => setShowNotes((value) => !value)} className="underline decoration-line underline-offset-2 hover:text-foreground" aria-pressed={showNotes}>
            {showNotes ? "Hide" : "Show"} {counts.notes} request notes
          </button>
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-[13px] text-muted-foreground">Starting. The first page appears here in a few seconds.</p>
      ) : (
        <ol className={`grid gap-2 ${compact ? "max-h-[640px] overflow-y-auto pr-1" : ""}`}>
          {items.map((item) => (
            <li key={item.key} className="feed-in">
              <FeedItem item={item} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Card({ icon, meta, at, children, tone = "default" }: { icon: ReactNode; meta: ReactNode; at: string; children: ReactNode; tone?: "default" | "caution" | "quiet" }) {
  return (
    <article
      className={`grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 overflow-hidden rounded-xl border p-3 ${
        tone === "caution" ? "border-caution/30 bg-caution-soft" : tone === "quiet" ? "border-transparent bg-transparent py-1.5" : "border-line bg-white"
      }`}
    >
      <span aria-hidden className={`grid size-7 place-items-center rounded-lg ${tone === "caution" ? "bg-white/70 text-caution" : "bg-page text-foreground/70"}`}>
        {icon}
      </span>
      <div className="grid min-w-0 gap-1">
        <div className="flex items-center justify-between gap-2 font-mono text-[10.5px] text-foreground/55">
          <span className="truncate">{meta}</span>
          <span className="shrink-0 tabular-nums">{time(at)}</span>
        </div>
        {children}
      </div>
    </article>
  );
}

function FeedItem({ item }: { item: Item }) {
  switch (item.kind) {
    case "page": {
      const { page } = item;
      return (
        <Card icon={<Globe className="size-3.5" />} at={item.at} meta={`${page.via === "browser" ? "Browser" : "HTML"} read, ${(page.ms / 1000).toFixed(1)} s, ${page.linkCount} links`}>
          <a href={page.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-1 text-[13px] font-medium hover:underline">
            <span className="line-clamp-2">{page.title}</span>
            <ArrowUpRight className="mt-0.5 size-3 shrink-0 opacity-50 group-hover:opacity-100" aria-hidden />
          </a>
          <span className="font-mono text-[11px] text-electric">
            {hostOf(page.url)}
            {new URL(page.url).pathname === "/" ? "" : new URL(page.url).pathname}
          </span>
          {(page.description || page.excerpt) && <p className="line-clamp-3 text-[12.5px] leading-5 text-muted-foreground">{page.description ?? page.excerpt}</p>}
          {page.headings.length > 0 && (
            <ul className="flex min-w-0 flex-wrap gap-1 pt-0.5">
              {page.headings.slice(0, 4).map((heading, index) => (
                <li key={`${index}-${heading}`} className="block max-w-full truncate rounded-md bg-page px-1.5 py-0.5 text-[11px] text-foreground/70">
                  {heading}
                </li>
              ))}
            </ul>
          )}
        </Card>
      );
    }
    case "findings": {
      const icon = item.findings[0]?.kind === "page_skipped" ? <TriangleAlert className="size-3.5" /> : <Link2 className="size-3.5" />;
      return (
        <Card icon={icon} at={item.at} meta={`Found on the site (${item.findings.length})`} tone={item.findings[0]?.kind === "page_skipped" ? "quiet" : "default"}>
          <ul className="flex flex-wrap gap-1">
            {item.findings.slice(0, 12).map((finding, index) => (
              <li key={`${index}-${finding.kind}-${finding.label}`} className="max-w-full">
                {finding.url ? (
                  <a href={finding.url} target="_blank" rel="noopener noreferrer" className={`inline-block max-w-full truncate rounded-md px-1.5 py-0.5 text-[11px] hover:underline ${chip(finding)}`}>
                    {finding.label}
                  </a>
                ) : (
                  <span className={`inline-block max-w-full truncate rounded-md px-1.5 py-0.5 text-[11px] ${chip(finding)}`}>{finding.label}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      );
    }
    case "signal": {
      const { signal } = item;
      const icon = signal.type === "news" ? <Newspaper className="size-3.5" /> : signal.type === "job" ? <Briefcase className="size-3.5" /> : <FileText className="size-3.5" />;
      const label = signal.type === "news" ? "News" : signal.type === "job" ? "Open role" : "Company website";
      return (
        <Card icon={icon} at={item.at} meta={`${label}, ${formatDate(signal.publishedAt)}`}>
          <p className="text-[13px] leading-5">{signal.claim}</p>
          <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="w-fit font-mono text-[11px] text-electric hover:underline">
            {signal.sourceName || hostOf(signal.sourceUrl)}
          </a>
        </Card>
      );
    }
    case "hooks": {
      const sorted = [...item.hooks].sort((a, b) => b.scores.total - a.scores.total);
      return (
        <Card icon={<Sparkles className="size-3.5" />} at={item.at} meta={`${item.hooks.length} angles scored`}>
          <ul className="grid gap-1.5">
            {sorted.map((hook) => (
              <li key={hook.id} className="grid gap-0.5">
                <span className={`text-[12.5px] leading-5 ${hook.blockedReason ? "text-foreground/45 line-through" : ""}`}>{hook.text}</span>
                {hook.blockedReason ? (
                  <span className="text-[11px] text-caution">Blocked: {hook.blockedReason}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-page">
                      <span className="block h-full rounded-full bg-electric" style={{ width: `${hook.scores.total}%` }} />
                    </span>
                    <span className="font-mono text-[10.5px] tabular-nums">{hook.scores.total}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      );
    }
    case "failed":
      return (
        <Card icon={<TriangleAlert className="size-3.5" />} at={item.at} meta={STEP_LABEL[item.stage] ?? item.stage} tone="caution">
          <p className="text-[12.5px] leading-5 text-caution">{item.message}</p>
        </Card>
      );
    case "note":
      return (
        <p className="flex gap-2 px-3 font-mono text-[10.5px] text-foreground/50">
          <span className="tabular-nums">{time(item.at)}</span>
          <span className="truncate">{item.message}</span>
        </p>
      );
  }
}

function chip(finding: Finding) {
  switch (finding.kind) {
    case "dated_item":
      return finding.label.includes("not used") ? "bg-page text-foreground/50" : "bg-verified-soft text-verified";
    case "job_board":
      return "bg-electric/10 text-electric";
    case "fact":
      return "bg-[#f3e9ff] text-[#6b3fc0]";
    case "tech":
      return "bg-page text-foreground/70";
    case "page_skipped":
      return "bg-caution-soft text-caution";
    default:
      return "bg-page text-foreground/80";
  }
}
