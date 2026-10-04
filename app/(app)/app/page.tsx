import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MonoNote } from "@/components/brand";
import { RunForm, type CaseCard } from "@/components/run-form";
import { StatusPill } from "@/components/status-pill";
import features from "@/config/features.json";
import fixtures from "@/fixtures/demo-prospects.json";
import { getAnalytics } from "@/lib/analytics";
import { formatSeconds, timeAgo } from "@/lib/format";
import { listReplays } from "@/lib/replay";
import { countRuns, listRuns } from "@/lib/runs";

// Read the saved runs on every request, not at build time.
export const dynamic = "force-dynamic";

const inputFor = (id: string) => {
  const prospect = fixtures.prospects.find((item) => item.id === id);
  if (!prospect) return null;
  return Object.fromEntries(Object.entries(prospect.input).filter(([, value]) => value)) as Record<string, string>;
};

// The cases under the form: recorded runs first (safe to demo), then live-only and planned cases.
function buildCases(): CaseCard[] {
  const replays = new Map(listReplays().map((replay) => [replay.name, replay]));
  const fromReplay = (name: string, group: CaseCard["group"], fixture: string, title: string): CaseCard | null => {
    const replay = replays.get(name);
    if (!replay) return null;
    return { id: name, group, company: replay.prospect.company, title, why: replay.why, expected: replay.outcome, replay: name, input: inputFor(fixture) };
  };
  const cases: (CaseCard | null)[] = [
    fromReplay("basecamp-clean-draft", "happy", "basecamp-thin", "A draft that passes every check"),
    fromReplay("stripe-flagged", "happy", "stripe-happy", "Strong signals, one claim to check"),
    fromReplay("ripik-abstain", "look", "abstain-candidate", "Thin footprint: no email written"),
    {
      id: "intel",
      group: "look",
      company: "Intel",
      title: "Leadership news, no job board",
      why: "No public job board to read. The premise rests on one headline and gets flagged.",
      expected: "flagged",
      replay: null,
      input: inputFor("intel-leadership"),
    },
    {
      id: "same-name",
      group: "look",
      company: "Edge case 1",
      title: "Two companies with the same name",
      why: "Should pause and ask you which company you meant before reading anything else.",
      expected: null,
      replay: null,
      input: null,
    },
    {
      id: "moved-on",
      group: "look",
      company: "Edge case 4",
      title: "The prospect has changed jobs",
      why: "Should stop and point to their successor instead of writing to someone who left.",
      expected: null,
      replay: null,
      input: null,
    },
  ];
  return cases.filter((card): card is CaseCard => card !== null);
}

export default async function NewRunPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const counts = countRuns();
  const analytics = getAnalytics();
  const recent = listRuns(3);
  const toReview = (counts.byOutcome.draft ?? 0) + (counts.byOutcome.flagged ?? 0);

  const stats = [
    ["Runs", String(counts.total)],
    ["Drafts to review", String(toReview)],
    ["Produced a draft", `${Math.round(analytics.readyRate * 100)}%`],
    ["Median run", formatSeconds(analytics.medianSeconds)],
  ];

  return (
    <main className="grid gap-10">
      {welcome && (
        <MonoNote className="max-w-2xl">
          Your trial is on. Watch a recorded case first to see what a run looks like, then research someone real. Nothing is sent without you.
        </MonoNote>
      )}

      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-2">
          <h1 className="text-[34px] leading-tight font-normal tracking-tight sm:text-[42px]">Who are you writing to?</h1>
          <p className="max-w-2xl text-[15px] leading-6 text-muted-foreground">
            I&apos;ll read their website, news and open roles, pick the strongest reason to get in touch, and draft an email with every fact linked to
            its source.
          </p>
        </div>
        <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-card sm:grid-cols-4">
          {stats.map(([label, value], index) => (
            <div key={label} className={`grid gap-1 px-4 py-3 ${index ? "border-l border-line" : ""} ${index === 2 ? "border-l-0 sm:border-l" : ""}`}>
              <dt className="text-[11px] whitespace-nowrap text-muted-foreground">{label}</dt>
              <dd className="text-[20px] tracking-tight tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <RunForm cases={buildCases()} />

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-heading" className="text-[14px] font-medium">
              Continue where you left off
            </h2>
            <Link href="/dashboard" className="flex items-center gap-1 text-[13px] text-electric hover:underline">
              Dashboard <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-3">
            {recent.map((run) => (
              <li key={run.id}>
                <Link href={`/runs/${run.id}`} className="grid gap-2 rounded-2xl border border-line bg-card p-4 transition-colors hover:bg-white">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-[14px] font-medium">{run.prospect.name}</span>
                    <StatusPill status={run.status} outcome={run.outcome} createdAt={run.createdAt} />
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {run.prospect.company}, {timeAgo(run.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="beta-heading" className="flex flex-wrap items-center gap-2 border-t border-line pt-6">
        <h2 id="beta-heading" className="mr-2 text-[13px] text-muted-foreground">
          Coming next
        </h2>
        {features.locked.map((feature) => (
          <Link
            key={feature.id}
            href="/#beta"
            title={feature.description}
            className={`rounded-full px-3 py-1 font-mono text-[11px] ${feature.status === "Beta" ? "bg-electric/10 text-electric" : "bg-foreground/[0.06] text-foreground/65"}`}
          >
            {feature.title}
            <span className="ml-1.5 opacity-70">{feature.status === "Beta" ? "Beta" : "Later"}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
