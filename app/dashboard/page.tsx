import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRuns, type RunRecord } from "@/lib/runs";

// Read the database on every request, not at build time.
export const dynamic = "force-dynamic";

function duration(run: RunRecord): string {
  if (!run.finishedAt) return "—";
  const seconds = (Date.parse(run.finishedAt) - Date.parse(run.createdAt)) / 1000;
  return `${seconds.toFixed(1)} s`;
}

const OUTCOME_LABEL: Record<NonNullable<RunRecord["outcome"]>, { text: string; variant: "default" | "secondary" | "destructive" }> = {
  draft: { text: "Ready for review", variant: "default" },
  flagged: { text: "Check flagged points", variant: "secondary" },
  abstained: { text: "Abstained", variant: "secondary" },
  stopped: { text: "Stopped", variant: "destructive" },
};

function statusLabel(run: RunRecord): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (run.status === "new") return { text: "Not started", variant: "outline" };
  if (run.status === "running") return { text: "Running", variant: "secondary" };
  return run.outcome ? OUTCOME_LABEL[run.outcome] : { text: "Stopped", variant: "destructive" };
}

export default function DashboardPage() {
  const runs = listRuns();
  const finished = runs.filter((run) => run.status === "finished");
  const drafts = finished.filter((run) => run.outcome === "draft" || run.outcome === "flagged").length;
  const abstained = finished.filter((run) => run.outcome === "abstained").length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="grid gap-2">
        <div className="flex gap-4 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">← New run</Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
        <p className="text-zinc-600">Every run saved on this machine, newest first.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Runs</CardDescription>
            <CardTitle className="text-3xl">{runs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Drafts ready for review</CardDescription>
            <CardTitle className="text-3xl">{drafts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Abstained (no good hook)</CardDescription>
            <CardTitle className="text-3xl">{abstained}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {runs.length === 0 ? (
        <p className="text-zinc-500">No runs yet. Start one from the home page.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time taken</TableHead>
                  <TableHead>Created</TableHead>
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
