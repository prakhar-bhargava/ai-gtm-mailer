import Link from "next/link";
import { LockedFeatures } from "@/components/locked-features";
import { RunForm, type SampleProspect } from "@/components/run-form";
import { StatusPill } from "@/components/status-pill";
import fixtures from "@/fixtures/demo-prospects.json";
import { timeAgo } from "@/lib/format";
import { listRuns } from "@/lib/runs";

// Read the saved runs on every request, not at build time.
export const dynamic = "force-dynamic";

// The fixture's "case" text, cut to the part a rep cares about ("Happy path: many signals" -> "Many signals").
function sampleLabel(text: string) {
  const detail = text.includes(":") ? text.split(":").slice(1).join(":").trim() : text;
  return detail.charAt(0).toUpperCase() + detail.slice(1);
}

const samples: SampleProspect[] = fixtures.prospects.map((prospect) => ({
  id: prospect.id,
  label: sampleLabel(prospect.case),
  // Empty optional fields are dropped so the form's validation sees the same thing a person would type.
  input: Object.fromEntries(Object.entries(prospect.input).filter(([, value]) => value)) as Record<string, string>,
}));

export default function Home() {
  const recent = listRuns(5);
  return (
    <main className="mx-auto grid w-full max-w-3xl gap-10">
      <header className="grid gap-2">
        <h1 className="text-[1.75rem] font-semibold tracking-tight sm:text-3xl">Who are you writing to?</h1>
        <p className="max-w-xl text-[15px] leading-6 text-muted-foreground">
          The app reads public news, open roles and the company&apos;s website, picks the strongest reason to get in touch,
          and writes a short email with every fact linked to its source. You review it before anything is saved.
        </p>
      </header>

      <RunForm samples={samples} />

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-heading" className="text-[15px] font-semibold">Recent</h2>
            <Link href="/dashboard" className="text-sm text-primary hover:underline">
              All runs
            </Link>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {recent.map((run) => (
              <li key={run.id}>
                <Link href={`/runs/${run.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/60">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{run.prospect.name}</span>
                    <span className="text-muted-foreground">, {run.prospect.company}</span>
                  </span>
                  <StatusPill status={run.status} outcome={run.outcome} createdAt={run.createdAt} />
                  <span className="hidden w-20 text-right text-sm text-muted-foreground sm:inline">{timeAgo(run.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <LockedFeatures />
    </main>
  );
}
