import type { Analytics } from "@/lib/analytics";

const percent = (value: number) => `${Math.round(value * 100)}%`;

function formatSeconds(seconds: number | null) {
  if (seconds === null) return "—";
  return seconds < 60 ? `${Math.round(seconds)} s` : `${(seconds / 60).toFixed(1)} min`;
}

// Server-rendered, no chart library: bars are plain divs so they stay easy to restyle.
export function AnalyticsSection({ data }: { data: Analytics }) {
  const maxDay = Math.max(1, ...data.perDay.map((day) => day.count));
  const maxOutcome = Math.max(1, ...data.outcomes.map((item) => item.count));
  const maxCompany = Math.max(1, ...data.topCompanies.map((item) => item.count));

  return (
    <section aria-labelledby="analytics-heading" className="grid gap-6">
      <h2 id="analytics-heading" className="text-lg font-semibold text-zinc-950">Analytics</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Median time per search" value={formatSeconds(data.medianSeconds)} />
        <Tile label="Ready or flagged" value={percent(data.readyRate)} hint="of finished searches" />
        <Tile label="Abstained" value={percent(data.abstainRate)} hint="no hook strong enough" />
        <Tile label="Stopped" value={percent(data.stoppedRate)} hint="a required step failed" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Searches per day, last 14 days">
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Bar chart of searches per day">
            {data.perDay.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-zinc-500">{day.count || ""}</span>
                <div
                  className="w-full rounded-t bg-zinc-900"
                  style={{ height: `${(day.count / maxDay) * 100}%`, minHeight: day.count ? 4 : 0 }}
                  title={`${day.day}: ${day.count}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
            <span>{data.perDay[0]?.day.slice(5)}</span>
            <span>{data.perDay[data.perDay.length - 1]?.day.slice(5)}</span>
          </div>
        </Panel>

        <Panel title="Outcomes">
          <ul className="grid gap-3">
            {data.outcomes.map((item) => (
              <li key={item.label} className="grid gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-700">{item.label}</span>
                  <span className="font-medium text-zinc-900">{item.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-zinc-900" style={{ width: `${(item.count / maxOutcome) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Source failures">
          {data.sourceFailures.length === 0 ? (
            <p className="text-sm text-zinc-500">No source calls recorded yet.</p>
          ) : (
            <ul className="grid gap-3">
              {data.sourceFailures.map((item) => (
                <li key={item.stage} className="flex justify-between text-sm">
                  <span className="text-zinc-700">{STEP_LABEL[item.stage] ?? item.stage}</span>
                  <span className="text-zinc-900">
                    {item.failed} of {item.total} failed
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Most common companies searched">
          {data.topCompanies.length === 0 ? (
            <p className="text-sm text-zinc-500">No searches yet.</p>
          ) : (
            <ul className="grid gap-3">
              {data.topCompanies.map((item) => (
                <li key={item.company} className="grid gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-700">{item.company}</span>
                    <span className="font-medium text-zinc-900">{item.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-zinc-400" style={{ width: `${(item.count / maxCompany) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {data.failedSteps.length > 0 && (
        <Panel title="Where runs failed">
          <ul className="grid gap-2 text-sm">
            {data.failedSteps.map((item) => (
              <li key={item.stage} className="flex justify-between">
                <span className="text-zinc-700">{STEP_LABEL[item.stage] ?? item.stage}</span>
                <span className="text-zinc-900">{item.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}

const STEP_LABEL: Record<string, string> = {
  identity: "Find the company's website",
  news: "Recent news",
  jobs: "Open roles",
  company_site: "Company website",
  hooks: "Rank hooks",
  draft: "Write the draft",
  verify: "Check claims",
};

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-white p-5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-2xl font-semibold tracking-tight text-zinc-950">{value}</span>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-4 rounded-lg border bg-white p-5">
      <h3 className="text-sm font-medium text-zinc-700">{title}</h3>
      {children}
    </div>
  );
}
