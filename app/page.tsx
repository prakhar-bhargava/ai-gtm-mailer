import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RunForm } from "@/components/run-form";
import { listRuns } from "@/lib/runs";

// Read the saved searches on every request, not at build time.
export const dynamic = "force-dynamic";

export default function Home() {
  const recent = listRuns().slice(0, 5);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="grid gap-2">
        <Badge variant="secondary" className="w-fit">Sample data</Badge>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">New prospect run</h1>
          <Link href="/dashboard" className="text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900">
            Dashboard
          </Link>
        </div>
        <p className="text-zinc-600">
          Enter a prospect and the app will research public signals, rank possible reasons to reach out, and
          write a draft for you to review. Nothing is sent automatically.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Prospect</CardTitle>
          <CardDescription>Name and company are required. Everything else helps the research.</CardDescription>
        </CardHeader>
        <CardContent>
          <RunForm />
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Recent searches</h2>
          <ul className="grid gap-2">
            {recent.map((run) => (
              <li key={run.id}>
                <Link href={`/runs/${run.id}`} className="flex items-center justify-between rounded-md border bg-white px-4 py-3 hover:bg-zinc-50">
                  <span className="font-medium text-zinc-900">
                    {run.prospect.name} <span className="font-normal text-zinc-500">· {run.prospect.company}</span>
                  </span>
                  <span className="text-xs text-zinc-500">{new Date(run.createdAt).toLocaleString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
