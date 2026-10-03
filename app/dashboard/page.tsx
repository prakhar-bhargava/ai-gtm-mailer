import { Search } from "lucide-react";
import Link from "next/link";
import { AnalyticsSection } from "@/components/analytics-section";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { getAnalytics } from "@/lib/analytics";
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

  const stats = [
    { label: "Runs", value: String(counts.total) },
    { label: "Drafts to review", value: String(countFor("draft") + countFor("flagged")) },
    { label: "No good reason to write", value: String(countFor("abstained")) },
    { label: "Median time per run", value: formatSeconds(analytics.medianSeconds) },
  ];

  return (
    <main>
      <PageHeader
        title="Runs"
        description="Every prospect researched in this app, newest first."
        actions={
          <Link href="/" className={buttonVariants({ size: "lg", className: "h-10 px-4" })}>
            New run
          </Link>
        }
      />

      <dl className="mb-8 grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`grid gap-1 p-5 ${index % 2 === 1 ? "border-l border-border" : ""} ${index >= 2 ? "border-t border-border sm:border-t-0" : ""} ${index === 2 ? "sm:border-l" : ""}`}
          >
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Runs" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap gap-1" aria-label="Filter by result">
            {FILTERS.map((filter) => {
              const active = outcome === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={filterHref(filter.value)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm ${
                    active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
              className="h-9 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
            />
            {outcome !== "all" && <input type="hidden" name="outcome" value={outcome} />}
          </form>
        </div>

        {runs.length === 0 ? (
          <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border bg-card p-8">
            <p className="font-medium">{q || outcome !== "all" ? "No runs match" : "No runs yet"}</p>
            <p className="text-sm text-muted-foreground">
              {q || outcome !== "all" ? "Try another name, or clear the filter." : "Research a prospect and it will appear here."}
            </p>
            <Link href={q || outcome !== "all" ? "/dashboard" : "/"} className="text-sm font-medium text-primary hover:underline">
              {q || outcome !== "all" ? "Clear search and filter" : "Start a run"}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Prospect</th>
                  <th scope="col" className="px-4 py-3 font-medium">Result</th>
                  <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">Took</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run) => (
                  <tr key={run.id} className="group relative hover:bg-secondary/50">
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

      <AnalyticsSection data={analytics} />
    </main>
  );
}
