"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type Tab = "how" | "faq" | "stack";

const TABS: { id: Tab; label: string; dot: string }[] = [
  { id: "how", label: "How I work", dot: "bg-lavender" },
  { id: "stack", label: "What I read", dot: "bg-series-2" },
  { id: "faq", label: "FAQs", dot: "bg-pink" },
];

const STEPS = [
  ["Confirm the company", "Open the website you gave me in a real browser and check it is the right company."],
  ["Read the website", "Home, about, careers, newsroom and blog pages, up to eight. I skip anything robots.txt asks me not to read."],
  ["Follow the links", "Job boards, social profiles and dated posts found on the site itself. LinkedIn is recorded as a link, never opened."],
  ["Check news and open roles", "Recent headlines that are about this company, not one with the same name, and open finance and ops roles."],
  ["Pick the best reason to write", "Three to five possible angles, each scored out of 100 on fit, recency, specificity, seniority and source."],
  ["Write the email", "Premise, value, one question. 50 to 100 words. Every fact is tagged with the source it came from."],
  ["Check every claim", "Each sourced sentence is checked against its source. Anything unsupported is highlighted for you."],
  ["Hand it to you", "You review, edit and open it in Gmail. Nothing is sent without you."],
];

const SOURCES = [
  ["Company website", "Headless browser (Playwright). Titles, descriptions, headings, dated posts, structured data, links."],
  ["Google News", "Headlines from the last 180 days, checked against the company's own description."],
  ["Greenhouse and Ashby", "Public job-board APIs, no key needed. Finance and ops roles are counted separately."],
  ["Your notes", "Role, LinkedIn link and anything you already know. LinkedIn is never fetched."],
  ["A language model", "Only to rank angles, write the email and check claims. Reading the web costs no tokens."],
];

const FAQS = [
  ["Is this just a chatbot with a template?", "No. It reads the company's public footprint itself, ranks several possible reasons to write with a visible score, and links every sentence of the email to the source it came from. A template has none of that."],
  ["What happens when there is nothing worth saying?", "It says so. If no angle scores 50 or more, it writes no personalised email and offers three plain templates instead. A made-up reason does more harm than no personalisation."],
  ["Will it use bad news as an opener?", "No. Layoffs, lawsuits, investigations, health, family and politics are blocked as hooks. You still see them, so you have the context."],
  ["Does it scrape LinkedIn?", "No. LinkedIn has sued scrapers and won; Proxycurl shut down in July 2025. A LinkedIn link is stored as a reference and never opened."],
  ["Does it send emails by itself?", "Never. You open the draft in Gmail and send it yourself. Every email also lands in the app's Outbox, so there is a record."],
  ["What does a run cost?", "Reading websites, news and job boards is free. The model is called three times per prospect: rank, write and check."],
];

export function AboutCard() {
  const [tab, setTab] = useState<Tab>("how");
  return (
    <div className="grid overflow-hidden rounded-2xl border border-line bg-card md:grid-cols-[220px_1fr]">
      <div className="flex flex-col justify-between gap-6 border-b border-line p-5 md:border-r md:border-b-0">
        <p className="text-[13px] text-foreground/80">About me</p>
        <div role="tablist" aria-label="About GTM Associate" className="flex gap-2 overflow-x-auto md:flex-col">
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[12px] whitespace-nowrap transition-colors ${
                tab === item.id ? "bg-white shadow-[0_0_0_1px_var(--line)]" : "text-foreground/70 hover:bg-white/60"
              }`}
            >
              <span aria-hidden className={`size-2 rounded-full ${item.dot}`} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div id={`panel-${tab}`} role="tabpanel" className="min-h-[420px] p-5 sm:p-8">
        {tab === "how" && (
          <>
            <p className="mb-6 border-l-2 border-foreground pl-3 text-[15px]">Every run follows the same eight steps, and you can watch each one happen.</p>
            <ol className="grid gap-0 divide-y divide-line">
              {STEPS.map(([title, body], index) => (
                <li key={title} className="grid grid-cols-[2rem_1fr] gap-x-3 py-3 sm:grid-cols-[2rem_14rem_1fr]">
                  <span className="font-mono text-[12px] text-foreground/50 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[14px] font-medium">{title}</span>
                  <span className="col-start-2 text-[13px] text-muted-foreground sm:col-start-3">{body}</span>
                </li>
              ))}
            </ol>
          </>
        )}
        {tab === "stack" && (
          <>
            <p className="mb-6 border-l-2 border-foreground pl-3 text-[15px]">Public sources only. Each fact keeps its link and its date.</p>
            <dl className="grid divide-y divide-line">
              {SOURCES.map(([name, body]) => (
                <div key={name} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                  <dt className="text-[14px] font-medium">{name}</dt>
                  <dd className="text-[13px] text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
        {tab === "faq" && (
          <>
            <p className="mb-4 border-l-2 border-foreground pl-3 text-[15px]">What people ask before they trust me with a first email.</p>
            <div className="grid divide-y divide-line">
              {FAQS.map(([question, answer], index) => (
                <details key={question} className="group py-3" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown className="size-4 shrink-0 text-foreground/50 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-2 max-w-[62ch] border-l border-line pl-3 text-[13px] leading-6 text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
