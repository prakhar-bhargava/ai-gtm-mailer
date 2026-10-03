import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnalyticsSection } from "@/components/analytics-section";
import { getAnalytics } from "@/lib/analytics";
import { countRuns, searchRuns, type RunRecord } from "@/lib/runs";

// Read the database on every request, not at build time.
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Ready" },
  { value: "flagged", label: "Check points" },
  { value: "abstained", label: "Abstained" },
  { value: "stopped", label: "Stopped" },
  { value: "open", label: "In progress" },
] as const;

const OUTCOME_LABEL: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { text: "Ready for review", variant: "default" },
  flagged: { text: "Check flagged points", variant: "secondary" },
  abstained: { text: "Abstained", variant: "secondary" },
  stopped: { text: "Stopped", variant: "destructive" },
};

function statusLabel(run: RunRecord) {
  if (run.status === "new") return { text: "Not started", variant: "outline" as const };
  if (run.status === "running") return { text: "Running", variant: "secondary" as const };
  return run.outcome ? OUTCOME_LABEL[run.outcome] : { text: "Stopped", variant: "destructive" as const };
}

function duration(run: RunRecord): string {
  if (!run.finishedAt) return "—";
  const seconds = (Date.parse(run.finishedAt) - Date.parse(run.createdAt)) / 1000;
  return `${seconds.toFixed(0)} s`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; outcome?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const outcome = (FILTERS.find((filter) => filter.value === params.outcome)?.value ?? "all") as
    | "all"
    | "draft"
    | "flagged"
    | "abstained"
    | "stopped"
    | "open";
  const runs = searchRuns({ q, outcome });
  const counts = countRuns();
  const ready = (counts.byOutcome.draft ?? 0) + (counts.byOutcome.flagged ?? 0);

  const filterHref = (value: string) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (value !== "all") search.set("outcome", value);
    const qs = search.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">← New run</Link>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="text-zinc-600">Every search saved on this machine. Search by name or company.</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Searches saved</CardDescription>
            <CardTitle className="text-3xl">{counts.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Drafts to review</CardDescription>
            <CardTitle className="text-3xl">{ready}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Abstained (no good hook)</CardDescription>
            <CardTitle className="text-3xl">{counts.byOutcome.abstained ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <AnalyticsSection data={getAnalytics()} />

      <h2 className="text-lg font-semibold text-zinc-950">Searches</h2>

      <form action="/dashboard" className="flex flex-wrap items-center gap-3">
        <Input name="q" defaultValue={q} placeholder="Search by name or company" className="max-w-sm" />
        {outcome !== "all" && <input type="hidden" name="outcome" value={outcome} />}
        <button type="submit" className="h-9 rounded-md border px-4 text-sm font-medium hover:bg-zinc-50">
          Search
        </button>
      </form>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by outcome">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filterHref(filter.value)}
            className={`inline-flex h-9 items-center rounded-full border px-4 text-sm ${outcome === filter.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:bg-zinc-50"}`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {runs.length === 0 ? (
        <p className="text-zinc-500">No searches match. Try another name, or start a new run.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Time taken</TableHead>
                  <TableHead>Searched</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const status = statusLabel(run);
                  return (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Link href={`/runs/${run.id}`} className="font-medium underline underline-offset-2">
                          {run.prospect.name}
                        </Link>
                      </TableCell>
                      <TableCell>{run.prospect.company}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </TableCell>
                      <TableCell>{duration(run)}</TableCell>
                      <TableCell>{new Date(run.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
