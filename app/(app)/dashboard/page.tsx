import { Search } from "lucide-react";
import Link from "next/link";
import { PillLink } from "@/components/brand";
import { DashboardCharts } from "@/components/dashboard-charts";
import { Patterns } from "@/components/patterns";
import { RunMaintenance } from "@/components/run-maintenance";
import { getFunData } from "@/lib/fun-analytics";
import { StatusPill } from "@/components/status-pill";
import { getAnalytics, getChartData } from "@/lib/analytics";
import { formatSeconds, timeAgo } from "@/lib/format";
import { countRuns, searchRuns, type RunRecord } from "@/lib/runs";

// Read the database on every request, not at build time.
export const dynamic = "force-dynamic";

type Filter = "all" | "draft" | "flagged" | "abstained" | "stopped" | "open";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Ready" },
  { value: "flagged", label: "Check before sending" },
  { value: "abstained", label: "No good reason" },
  { value: "stopped", label: "Stopped" },
  { value: "open", label: "Running" },
];

function duration(run: RunRecord): string {
  if (!run.finishedAt) return "";
  return formatSeconds((Date.parse(run.finishedAt) - Date.parse(run.createdAt)) / 1000);
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string; outcome?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const outcome: Filter = FILTERS.find((filter) => filter.value === params.outcome)?.value ?? "all";
  const runs = searchRuns({ q, outcome });
  const counts = countRuns();
  const flaggedCount = counts.byOutcome.flagged ?? 0;
  const analytics = getAnalytics();
  const countFor = (value: Filter) =>
    value === "all"
      ? counts.total
      : value === "open"
        ? (counts.byOutcome.running ?? 0) + (counts.byOutcome.new ?? 0)
        : (counts.byOutcome[value] ?? 0);

  const filterHref = (value: Filter) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (value !== "all") search.set("outcome", value);
    const qs = search.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  return (
    <main className="grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-[34px] leading-tight font-normal tracking-tight sm:text-[42px]">Dashboard</h1>
          <p className="max-w-2xl text-[15px] leading-6 text-muted-foreground">
            How the research is going: what each run produced, where runs drop off, how confident the angles are, and how reliable each source is.
          </p>
        </div>
        <PillLink href="/app">New run</PillLink>
      </header>

      {/* Database rows have no prototype; a JSON round trip makes them plain objects for the client charts. */}
      <DashboardCharts analytics={JSON.parse(JSON.stringify(analytics))} charts={JSON.parse(JSON.stringify(getChartData()))} />

      {flaggedCount > 0 && <RunMaintenance flagged={flaggedCount} />}

      <Patterns data={JSON.parse(JSON.stringify(getFunData()))} />

      <section aria-labelledby="runs-heading" className="grid gap-4">
        <h2 id="runs-heading" className="text-[20px] tracking-tight">
          All runs
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap gap-1" aria-label="Filter by result">
            {FILTERS.map((filter) => {
              const active = outcome === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={filterHref(filter.value)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] ${
                    active ? "bg-foreground text-background" : "text-foreground/65 hover:bg-black/5 hover:text-foreground"
                  }`}
                >
                  {filter.label}
                  <span className={`tabular-nums ${active ? "opacity-70" : "opacity-60"}`}>{countFor(filter.value)}</span>
                </Link>
              );
            })}
          </nav>
          <form action="/dashboard" className="relative w-full sm:w-64" role="search">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor="q" className="sr-only">
              Search by name or company
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Search name or company"
              className="h-9 w-full rounded-full border border-line bg-white pr-3 pl-9 text-[13px] outline-none placeholder:text-foreground/45 focus-visible:border-electric"
            />
            {outcome !== "all" && <input type="hidden" name="outcome" value={outcome} />}
          </form>
        </div>

        {runs.length === 0 ? (
          <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed border-line p-8">
            <p className="font-medium">{q || outcome !== "all" ? "No runs match" : "No runs yet"}</p>
            <p className="text-sm text-muted-foreground">
              {q || outcome !== "all" ? "Try another name, or clear the filter." : "Research a prospect and it will appear here."}
            </p>
            <Link href={q || outcome !== "all" ? "/dashboard" : "/app"} className="text-[13px] text-electric hover:underline">
              {q || outcome !== "all" ? "Clear search and filter" : "Start a run"}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[11px] text-foreground/55">
                  <th scope="col" className="px-4 py-3 font-medium">Prospect</th>
                  <th scope="col" className="px-4 py-3 font-medium">Result</th>
                  <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">Took</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {runs.map((run) => (
                  <tr key={run.id} className="group relative hover:bg-white">
                    <td className="px-4 py-3">
                      {/* The link covers the whole row, so any part of it opens the run. */}
                      <Link href={`/runs/${run.id}`} className="font-medium after:absolute after:inset-0 group-hover:underline">
                        {run.prospect.name}
                      </Link>
                      <span className="block text-muted-foreground">
                        {[run.prospect.role, run.prospect.company].filter(Boolean).join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={run.status} outcome={run.outcome} createdAt={run.createdAt} />
                    </td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground tabular-nums sm:table-cell">{duration(run)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">{timeAgo(run.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </main>
  );
}
