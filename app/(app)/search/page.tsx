import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { listAccounts } from "@/lib/accounts";
import { timeAgo } from "@/lib/format";
import { searchRuns } from "@/lib/runs";

export const dynamic = "force-dynamic";

// One search across runs (by name or company) and accounts (full-text, ranked).
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const runs = query ? searchRuns({ q: query, limit: 20 }) : [];
  const accounts = query ? listAccounts(query).slice(0, 12) : [];

  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader
        title={query ? `Results for "${query}"` : "Search"}
        description={query ? `${runs.length} runs and ${accounts.length} companies match.` : "Search runs, companies and people from the bar at the top."}
      />
      {query && (
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="runs-heading" className="grid content-start gap-3">
            <h2 id="runs-heading" className="font-mono text-[12px] text-foreground/60">Runs</h2>
            {runs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line p-6 text-[13px] text-muted-foreground">No runs match.</p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {runs.map((run) => (
                  <li key={run.id}>
                    <Link href={`/runs/${run.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white">
                      <span className="min-w-0 flex-1 truncate text-[14px]">
                        <span className="font-medium">{run.prospect.name}</span>
                        <span className="text-muted-foreground">, {run.prospect.company}</span>
                      </span>
                      <StatusPill status={run.status} outcome={run.outcome} createdAt={run.createdAt} />
                      <span className="hidden w-16 text-right text-[12px] text-muted-foreground sm:inline">{timeAgo(run.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="accounts-heading" className="grid content-start gap-3">
            <h2 id="accounts-heading" className="font-mono text-[12px] text-foreground/60">Companies and people</h2>
            {accounts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line p-6 text-[13px] text-muted-foreground">No companies match.</p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {accounts.map((company) => (
                  <li key={company.id} className="grid gap-0.5 px-4 py-3">
                    <Link href={`/accounts?q=${encodeURIComponent(company.name)}`} className="text-[14px] font-medium hover:underline">
                      {company.name}
                    </Link>
                    <span className="text-[12px] text-muted-foreground">
                      {[company.domain, company.people.map((person) => person.name).join(", ")].filter(Boolean).join(". ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
