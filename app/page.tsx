import { ArrowRight, ArrowUpRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import { DitherField, DotWordmark } from "@/components/art";
import { Kicker, Logo, MonoNote, PillLink } from "@/components/brand";
import { AboutCard } from "@/components/landing/about-card";
import features from "@/config/features.json";

// The landing page. Every claim about the product is something the app does today; every number about the
// market comes from the research notes in docs/research, with its source linked.

const NAV = [
  ["How it works", "#how"],
  ["What's new", "#features"],
  ["Why it's different", "#why"],
  ["Research", "#research"],
  ["Beta", "#beta"],
];

const TRIAL_HREF = "/app?welcome=1";
const DEMO_HREF = "/replay/stripe-clean-draft?live=1";

export default function Landing() {
  return (
    <div className="relative overflow-x-clip">
      <header className="relative z-20 mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Sections" className="hidden items-center gap-6 text-[13px] text-foreground/80 lg:flex">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className="hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <PillLink href="/app" tone="light" size="sm">
              Open the app
            </PillLink>
          </span>
          <PillLink href={TRIAL_HREF} size="sm">
            Start free trial
          </PillLink>
        </div>
      </header>

      <Hero />
      <SourcesStrip />

      <section id="how" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-20 sm:px-6">
        <AboutCard />
        <div className="mt-8 flex justify-center">
          <PillLink href={TRIAL_HREF}>Start free trial</PillLink>
        </div>
      </section>

      <Features />
      <Guardrails />
      <WhyDifferent />
      <Research />
      <Beta />
      <Closing />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 pt-6 pb-14 sm:px-6">
      <DitherField variant="cloud" palette="dawn" pixel={5} seed={11} animate className="pointer-events-none absolute top-0 right-[-8%] h-[440px] w-[78%] opacity-50 sm:right-0 sm:opacity-90" />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="grid content-end gap-6 pt-24 sm:pt-36">
          <h1 className="font-sans text-[22vw] leading-[0.8] font-semibold tracking-[-0.06em] sm:text-[17vw] lg:text-[200px]">associate</h1>
          <p className="max-w-xl text-[20px] font-medium tracking-tight sm:text-[24px]">First emails worth reading. Researched, sourced and ready to send.</p>
          <div className="flex flex-wrap items-center gap-3">
            <PillLink href={TRIAL_HREF} size="lg">
              Start free trial
            </PillLink>
            <PillLink href={DEMO_HREF} tone="light" size="lg">
              Watch a live run
            </PillLink>
            <span className="font-mono text-[11px] text-foreground/60">No card. Runs on your machine.</span>
          </div>
        </div>
        <MonoNote className="h-fit max-w-sm self-start lg:mt-6">
          <p>Hi, I&apos;m your GTM Associate, an AI employee for outbound.</p>
          <p className="mt-3">Give me a name, a company and a website. I&apos;ll read what&apos;s public, pick the one reason worth writing about, and draft the email.</p>
          <p className="mt-3">Every fact links to where I found it. If there&apos;s nothing worth saying, I&apos;ll tell you. You decide what gets sent.</p>
        </MonoNote>
      </div>
    </section>
  );
}

function SourcesStrip() {
  const items = ["Company websites", "Google News", "Greenhouse", "Ashby", "schema.org data", "Gmail"];
  return (
    <section aria-label="What it works with" className="border-y border-line">
      <ul className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-6 font-mono text-[12px] text-foreground/55 sm:px-6">
        <li className="text-foreground/80">Reads and works with</li>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

const FEATURES: { title: string; body: string; tone: "white" | "pink" | "olive" | "blue" | "grey" | "lavender"; span?: string; kicker: string }[] = [
  {
    kicker: "Claim check",
    title: "Every sentence has a source.",
    body: "Each fact in the email is underlined and numbered, with the link and date underneath. A second pass checks each one against its source and highlights anything that isn't fully backed.",
    tone: "white",
    span: "md:col-span-2 md:row-span-2",
  },
  { kicker: "Abstains", title: "Knows when to stay quiet", body: "No angle above 50 out of 100 means no personalised email. You get three plain templates instead of a made-up reason.", tone: "pink" },
  { kicker: "Playwright crawler", title: "Reads sites with a real browser", body: "Up to eight pages per company, robots.txt respected, no tokens spent on reading.", tone: "blue", span: "md:row-span-2" },
  { kicker: "Sensitivity gate", title: "Won't open with bad news", body: "Layoffs, lawsuits, health and politics are blocked as hooks, and shown to you as context.", tone: "olive" },
  { kicker: "Ranked angles", title: "Shows its reasoning", body: "Three to five angles, each scored on fit, recency, specificity, seniority and source. You see why the winner won.", tone: "grey" },
  { kicker: "Gmail", title: "Opens in Gmail, ready to send", body: "One click opens Gmail compose with the recipient, subject, paragraphs and signature in place.", tone: "grey" },
  {
    kicker: "Live research feed",
    title: "Watch it work",
    body: "Every page read, link found and headline checked appears as it happens, while the email writes itself beside it.",
    tone: "lavender",
    span: "md:col-span-2",
  },
];

const MORE = [
  ["Same-name check", "Headlines about a different company with the same name are dropped before they become a hook."],
  ["Mail guardrails", "Subject length, word count, one question, no links or ROI claims. Hard rules block sending; soft ones warn."],
  ["LinkedIn as a reference", "Profile links are saved for you and never opened, so there is no scraping risk."],
  ["Accounts and search", "Every company and person you research, with local full-text search across them."],
  ["Recorded test flows", "Replay a real run step by step without a model key, for demos and testing."],
  ["Outbox", "A record of every email you approved, exactly as sent."],
];

function Features() {
  const tone = {
    white: "bg-white text-foreground",
    pink: "bg-gradient-to-br from-[#f7b3e6] via-[#f39bdc] to-[#c9a8ff] text-foreground",
    olive: "bg-olive text-white",
    blue: "bg-electric text-white",
    grey: "bg-card text-foreground",
    lavender: "bg-gradient-to-r from-[#d9d0ff] via-[#e9e2ff] to-[#ffd6f2] text-foreground",
  };
  return (
    <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mb-10 grid gap-3 text-center">
        <Kicker className="justify-self-center">What&apos;s new</Kicker>
        <h2 className="text-[34px] leading-tight font-normal tracking-tight sm:text-[44px]">Built for the first email, not the hundredth</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-4 md:grid-rows-[repeat(3,minmax(180px,auto))]">
        {FEATURES.map((feature) => (
          <article key={feature.title} className={`relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-line p-5 ${tone[feature.tone]} ${feature.span ?? ""}`}>
            {feature.tone === "blue" && <DitherField variant="cloud" palette="cool" pixel={5} seed={4} className="absolute inset-x-0 top-12 h-[48%] w-full" />}
            <Kicker className={feature.tone === "olive" || feature.tone === "blue" ? "relative text-white/80" : "relative"}>{feature.kicker}</Kicker>
            <div className="relative grid gap-2">
              <h3 className={feature.span?.includes("col-span-2") ? "max-w-md text-[30px] leading-[1.1] tracking-tight" : "text-[19px] leading-snug font-medium tracking-tight"}>{feature.title}</h3>
              <p className={`text-[13px] leading-6 ${feature.tone === "olive" || feature.tone === "blue" ? "text-white/85" : "text-foreground/70"}`}>{feature.body}</p>
            </div>
            {feature.kicker === "Claim check" && <SampleLetter />}
            {feature.kicker === "Live research feed" && <SampleFeed />}
            {feature.kicker === "Ranked angles" && <SampleScores />}
            {feature.kicker === "Gmail" && <SampleCompose />}
          </article>
        ))}
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MORE.map(([title, body]) => (
          <li key={title} className="grid gap-1 rounded-2xl border border-line bg-card p-5">
            <span className="text-[15px] font-medium">{title}</span>
            <span className="text-[13px] leading-6 text-muted-foreground">{body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Illustrations inside the feature tiles. They show the real interface patterns with sample content.
function SampleFeed() {
  const rows = [
    ["Read /careers", "browser, 2.1 s"],
    ["Found 12 open finance roles", "Greenhouse"],
    ["Skipped a same-name headline", "news check"],
  ];
  return (
    <div aria-hidden className="relative grid gap-3 sm:grid-cols-[1fr_1.1fr]">
      <ul className="grid gap-1.5">
        {rows.map(([label, meta]) => (
          <li key={label} className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-[12px]">
            <span>{label}</span>
            <span className="font-mono text-[10px] text-foreground/50">{meta}</span>
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-white/80 p-3 font-serif text-[16px] leading-7">
        <span className="ai-ink">Hi Dana, Northwind opened four accounts payable roles this month, so</span>
        <span className="ai-caret" />
      </p>
    </div>
  );
}

function SampleScores() {
  const rows: [string, number][] = [
    ["Hiring four AP roles", 78],
    ["New CFO in seat", 61],
    ["Office move", 34],
  ];
  return (
    <ul aria-hidden className="grid gap-2">
      {rows.map(([label, score], index) => (
        <li key={label} className="grid gap-1 text-[11px]">
          <span className="flex justify-between">
            <span>{label}</span>
            <span className="font-mono tabular-nums">{score}</span>
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
            <span className={`block h-full rounded-full ${index === 0 ? "bg-electric" : "bg-foreground/25"}`} style={{ width: `${score}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function SampleCompose() {
  return (
    <div aria-hidden className="grid gap-1 rounded-lg border border-line bg-white p-3 text-[11px]">
      <span className="flex justify-between border-b border-line pb-1.5 font-medium">
        New message <span className="text-foreground/40">_ ×</span>
      </span>
      <span className="border-b border-line py-1 text-foreground/60">To dana@northwind.com</span>
      <span className="border-b border-line py-1">four ap roles</span>
      <span className="pt-1 leading-4 text-foreground/70">Hi Dana, Northwind opened four accounts payable roles...</span>
    </div>
  );
}

// A small illustration of the letter view: a sourced sentence, its number, and the note beneath.
function SampleLetter() {
  return (
    <div aria-hidden className="relative grid gap-2 rounded-xl border border-line bg-[#fbfbfb] p-5 font-serif text-[17px] leading-8">
      <p>
        Hi Dana,{" "}
        <span className="underline decoration-verified/50 decoration-2 underline-offset-4">
          Northwind opened four accounts payable roles this month
          <sup className="ml-0.5 font-sans text-[10px] text-verified">1</sup>
        </span>
        . An AI employee can take the routine invoice queue so the new team starts on exceptions. Worth a look?
      </p>
      <p className="border-t border-line pt-2 font-sans text-[11px] text-muted-foreground">
        <span className="text-verified">1</span> Greenhouse job board, 12 days ago. Matches the source.
      </p>
    </div>
  );
}

const RULES = [
  ["Subject of 2 to 4 words", "Blocks sending"],
  ["Body of 40 to 130 words, aiming for 50 to 100", "Blocks sending"],
  ["One question at most, no links, no exclamation marks", "Blocks sending"],
  ["No stock openers, ROI figures or 'I saw on LinkedIn'", "Blocks sending"],
  ["A valid recipient email", "Blocks sending"],
  ["Greeting, paragraph length, flattering words", "Warns"],
];

function Guardrails() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
      <h3 className="mb-2 text-[15px]">Mail rules, checked as you type</h3>
      <ul className="border-t border-foreground/80">
        {RULES.map(([rule, effect]) => (
          <li key={rule} className="flex items-center justify-between gap-4 border-b border-foreground/80 py-2 text-[13px]">
            <span>{rule}</span>
            <span className="flex items-center gap-2 font-mono text-[11px] text-foreground/60">
              {effect}
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Cell = "yes" | "partial" | "no" | "unknown";
const COLUMNS = ["GTM Associate", "Table builders (Clay, Apollo)", "Autonomous AI SDRs (11x, Artisan)", "CRM agents (Agentforce, Breeze)"];
const ROWS: { row: string; cells: [Cell, string][] }[] = [
  { row: "Links each sentence of the email to its source", cells: [["yes", ""], ["partial", "Citations for the research, opt-in"], ["unknown", ""], ["unknown", ""]] },
  { row: "Ranks several angles and explains the winner", cells: [["yes", ""], ["unknown", ""], ["partial", "A positioning step before writing"], ["unknown", ""]] },
  { row: "Declines to write when there is no good reason", cells: [["yes", ""], ["no", ""], ["unknown", ""], ["partial", "Only when replying"]] },
  { row: "Blocks sensitive news as an opener", cells: [["yes", ""], ["unknown", ""], ["unknown", ""], ["unknown", ""]] },
  { row: "A person approves every email", cells: [["yes", ""], ["partial", "Optional"], ["partial", "Optional"], ["partial", "Manual or auto-send"]] },
  { row: "Reads websites without spending model tokens", cells: [["yes", ""], ["partial", "Per-row agent credits"], ["unknown", ""], ["unknown", ""]] },
];

function CellMark({ value, note }: { value: Cell; note: string }) {
  const label = { yes: "Yes", partial: "Partly", no: "No", unknown: "Not documented" }[value];
  return (
    <span className="grid gap-0.5">
      <span className="flex items-center gap-1.5">
        {value === "yes" ? (
          <Check className="size-4 text-verified" aria-hidden />
        ) : value === "no" ? (
          <Minus className="size-4 text-destructive" aria-hidden />
        ) : (
          <span aria-hidden className={`size-2 rounded-full ${value === "partial" ? "bg-series-4" : "bg-foreground/25"}`} />
        )}
        <span className={value === "unknown" ? "text-foreground/50" : ""}>{label}</span>
      </span>
      {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
    </span>
  );
}

const BENEFITS = [
  ["For the rep", "The research an SDR can't spare 20 minutes for, done for them, and a draft they can approve quickly because the evidence is on screen."],
  ["For the prospect", "No made-up facts, no creepy personal details, no layoffs as openers. An email that is about them and true."],
  ["For the manager", "Every run, source failure and outcome on one dashboard. Abstains are counted, not hidden."],
];

function WhyDifferent() {
  return (
    <section id="why" className="scroll-mt-20 border-y border-line bg-white/50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6">
        <div className="grid max-w-2xl gap-3">
          <Kicker>Why it&apos;s different</Kicker>
          <h2 className="text-[34px] leading-tight font-normal tracking-tight sm:text-[44px]">Other tools write more emails. This one writes emails you can trust.</h2>
          <p className="text-[15px] leading-7 text-muted-foreground">
            The weak point of AI outreach today is personalisation reps can&apos;t trust. TechCrunch reported in March 2025 that 11x lost 70 to 80% of early
            customers, with staff saying output had to be checked by hand. So the build competes on traceability, judgment and restraint.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <caption className="sr-only">How GTM Associate compares with other kinds of outreach tools</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="w-[28%] p-4 font-normal text-muted-foreground">Capability</th>
                {COLUMNS.map((column, index) => (
                  <th key={column} scope="col" className={`p-4 font-medium ${index === 0 ? "bg-foreground text-background" : ""}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROWS.map(({ row, cells }) => (
                <tr key={row}>
                  <th scope="row" className="p-4 font-normal">{row}</th>
                  {cells.map(([value, note], index) => (
                    <td key={index} className={`p-4 align-top ${index === 0 ? "bg-foreground/[0.04]" : ""}`}>
                      <CellMark value={value} note={note} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line p-4 text-[11px] text-muted-foreground">
            Based on each vendor&apos;s public documentation reviewed in October 2026. &ldquo;Not documented&rdquo; means we found no mention, not that the
            feature cannot exist. Sources in docs/research/notes/competitor_tools.md.
          </p>
        </div>

        <ul className="grid gap-3 md:grid-cols-3">
          {BENEFITS.map(([who, body]) => (
            <li key={who} className="grid gap-2 rounded-2xl border border-line bg-card p-5">
              <span className="font-mono text-[12px] text-foreground/60">{who}</span>
              <span className="text-[15px] leading-7">{body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STATS: { value: string; label: string; source: string; href: string }[] = [
  { value: "7% vs 3%", label: "Reply rate of personalised vs generic cold email, across 5.5 million sends", source: "Belkins, 2024", href: "https://belkins.io/blog/b2b-cold-email-subject-line-statistics" },
  { value: "3x", label: "More replies from directors and above when the personalisation is about their company", source: "Gong Labs", href: "https://www.gong.io/resources/labs/4-data-backed-ways-to-increase-your-email-reply-rate-and-book-that-meeting/" },
  { value: "3.4 to 4.5%", label: "Reply rates barely move with length; relevance matters more than word count", source: "Hunter, 34 million emails", href: "https://hunter.io/blog/cold-email-word-count" },
  { value: "58%", label: "Of replies come from the first email in a sequence", source: "Instantly, 2026", href: "https://instantly.ai/blog/email-sequence-benchmarks-2026-whats-a-good-open-rate-reply-rate-and-cost-per-meeting/" },
  { value: "15%", label: "Lower success for emails that make ROI claims like \"2x\"; interest questions beat meeting asks", source: "Gong, 304,000 emails", href: "https://www.gong.io/blog/sales-email-statistics" },
  { value: "July 2025", label: "Proxycurl shut down after LinkedIn sued it. Scraping LinkedIn is a legal and reliability risk", source: "Nubela", href: "https://nubela.co/blog/goodbye-proxycurl/" },
];

const PRIMARY = [
  ["Stripe", "Read 8 pages and found 14 open finance roles on its own job board. One model call wrote a 93-word email; every claim and guardrail passed.", "Draft passes"],
  ["Notion", "Five finance roles on the Ashby board linked from its site. Same result: one call, every check passed.", "Draft passes"],
  ["Basecamp", "34 headlines carried the name, none about the company (one was a clinical trial called Basecamp). Nothing left to write about.", "No email"],
  ["Intel", "Headlines only mentioned Intel or predicted; one was a startup raising $85M with Intel's CEO as adviser. Not used as an Intel event.", "No email"],
  ["Ripik AI", "Only a cookie banner and a thin footprint. The best angle scored 30, so it abstained.", "No email"],
];

const INSIGHTS: [string, string][] = [
  ["Personalisation works only when it is true and relevant", "Every sentence links to a source, and a claim check runs before you see the draft."],
  ["Executives respond to company news, not personal trivia", "The rubric scores seniority fit and prefers company-level hooks for directors and above."],
  ["A weak hook is worse than none", "Below 50 out of 100 it abstains and offers plain templates."],
  ["Live demos fail on fragile sources", "A local browser crawler, a 24-hour cache, timeouts, and recorded replays for demos."],
];

function Research() {
  return (
    <section id="research" className="mx-auto grid w-full max-w-6xl scroll-mt-20 gap-12 px-4 py-20 sm:px-6">
      <div className="grid max-w-2xl gap-3">
        <Kicker>Research</Kicker>
        <h2 className="text-[34px] leading-tight font-normal tracking-tight sm:text-[44px]">What the evidence says, and what we built from it</h2>
      </div>

      <div className="grid gap-4">
        <h3 className="text-[15px] font-medium">Secondary research</h3>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((stat) => (
            <li key={stat.value} className="grid content-between gap-6 rounded-2xl border border-line bg-card p-5">
              <span className="text-[40px] leading-none font-light tracking-tight">{stat.value}</span>
              <span className="grid gap-2">
                <span className="text-[13px] leading-6">{stat.label}</span>
                <a href={stat.href} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1 font-mono text-[11px] text-foreground/55 hover:text-foreground">
                  {stat.source}
                  <ArrowUpRight className="size-3" aria-hidden />
                </a>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-muted-foreground">Most reply-rate figures come from vendors analysing their own customers&apos; sends, so they show correlation. The rubric weights are tunable for that reason.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-4">
          <h3 className="text-[15px] font-medium">Primary research: our own test runs</h3>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
            {PRIMARY.map(([company, finding, result]) => (
              <li key={company} className="grid gap-1 p-4 sm:grid-cols-[7rem_1fr_auto] sm:gap-4">
                <span className="text-[14px] font-medium">{company}</span>
                <span className="text-[13px] leading-6 text-muted-foreground">{finding}</span>
                <span className="font-mono text-[11px] whitespace-nowrap text-foreground/70">{result}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid content-start gap-4">
          <h3 className="text-[15px] font-medium">Primary research: stakeholder review</h3>
          <div className="grid gap-3 rounded-2xl border border-line bg-card p-5 text-[13px] leading-6">
            <p>
              Sixteen perspectives, from strategist to operator to empath, reviewed the plan. All sixteen scored it 4 out of 5, and they agreed on
              the same three conditions:
            </p>
            <ul className="grid gap-1.5">
              <li className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 bg-foreground" />every hook traceable to a dated source;</li>
              <li className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 bg-foreground" />say &ldquo;no good hook&rdquo; instead of inventing one;</li>
              <li className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 bg-foreground" />no LinkedIn scraping, and fallbacks for the live demo.</li>
            </ul>
            <p className="text-[12px] text-muted-foreground">A structured simulation, not interviews. Conversations with working SDRs are the next step.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-[15px] font-medium">Synthesis</h3>
        <ol className="grid gap-3 md:grid-cols-2">
          {INSIGHTS.map(([insight, decision], index) => (
            <li key={insight} className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-2 rounded-2xl border border-line bg-card p-5">
              <span className="font-mono text-[12px] text-foreground/50">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-[15px] font-medium">{insight}</span>
              <span className="col-start-2 flex gap-2 text-[13px] leading-6 text-muted-foreground">
                <ArrowRight className="mt-1 size-3.5 shrink-0" aria-hidden />
                {decision}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Beta() {
  return (
    <section id="beta" className="scroll-mt-20 border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-20 sm:px-6">
        <div className="grid max-w-2xl gap-3">
          <Kicker>Beta and rolling out</Kicker>
          <h2 className="text-[34px] leading-tight font-normal tracking-tight sm:text-[44px]">What&apos;s coming next</h2>
          <p className="text-[15px] leading-7 text-muted-foreground">Each one names the real limit it is waiting on.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.locked.map((feature) => {
            const beta = feature.status === "Beta";
            return (
              <li key={feature.id} className={`grid content-start gap-3 rounded-2xl border p-5 ${beta ? "border-electric/40 bg-white" : "border-dashed border-foreground/25 bg-transparent"}`}>
                <span className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${beta ? "bg-electric text-white" : "bg-foreground/[0.07] text-foreground/70"}`}>{feature.status}</span>
                  <span className="font-mono text-[11px] text-foreground/50">{feature.plan} plan</span>
                </span>
                <span className="text-[17px] font-medium tracking-tight">{feature.title}</span>
                <span className="text-[13px] leading-6 text-muted-foreground">{feature.description}</span>
                {"today" in feature && feature.today && <span className="text-[13px] leading-6 text-verified">{feature.today}</span>}
                <span className="border-t border-line pt-3 text-[12px] leading-5 text-muted-foreground">Waiting on: {feature.why}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="relative isolate overflow-hidden pt-24">
      <div className="relative z-10 mx-auto grid max-w-2xl justify-items-center gap-6 px-4 text-center">
        <h2 className="text-[36px] leading-[1.08] font-normal tracking-tight sm:text-[52px]">What if every first email were worth reading?</h2>
        <PillLink href={TRIAL_HREF}>Start free trial</PillLink>
      </div>
      <DitherField variant="mountain" palette="dawn" pixel={7} seed={23} className="mt-[-40px] h-[360px] w-full" />
    </section>
  );
}

function Footer() {
  const columns: [string, [string, string][]][] = [
    ["Product", [["Open the app", "/app"], ["Runs", "/dashboard"], ["Outbox", "/outbox"], ["Accounts", "/accounts"]]],
    ["Learn", [["How it works", "#how"], ["Research", "#research"], ["Beta", "#beta"]]],
    ["Try", [["Watch a live run", DEMO_HREF], ["A case with no email", "/replay/ripik-abstain?live=1"], ["Only mentioned in the news", "/replay/intel-mentions-only?live=1"]]],
  ];
  return (
    <footer className="bg-navy px-2 pb-2 sm:px-4 sm:pb-4">
      <div className="rounded-2xl bg-electric px-6 pt-10 pb-6 text-white sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div className="grid content-start gap-3">
            <Kicker className="text-white/90">Write less. Say something real.</Kicker>
            <p className="max-w-xs text-[13px] text-white/80">Hand the research to an AI employee that shows its sources.</p>
            <Link href={TRIAL_HREF} className="flex w-fit items-center gap-6 border-b border-white/60 pb-1 font-mono text-[12px]">
              Start free trial <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map(([title, links]) => (
              <div key={title} className="grid content-start gap-2">
                <Kicker className="text-white/90">{title}</Kicker>
                {links.map(([label, href]) => (
                  <Link key={label} href={href} className="flex items-center justify-between gap-4 text-[13px] text-white/85 hover:text-white">
                    {label}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <DotWordmark text="associate" className="mt-10 h-[22vw] max-h-[240px] w-full" />
        <p className="mt-4 font-mono text-[10px] text-white/60">
          A case-study prototype for the AI Solutions Associate role. Inspired by Zamp&apos;s AI-employee model; not affiliated with or endorsed by Zamp.
        </p>
      </div>
    </footer>
  );
}
