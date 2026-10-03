import type { Analytics } from "@/lib/analytics";

const STEP_LABEL: Record<string, string> = {
  identity: "Company website lookup",
  news: "News search",
  jobs: "Job boards",
  company_site: "Company website",
  discover: "Website links",
  hooks: "Picking the angle",
  draft: "Writing the email",
  verify: "Claim check",
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

// Two questions a manager asks: how much is it being used, and can we rely on it?
// Bars are plain divs (no chart library) so they stay easy to restyle.
export function AnalyticsSection({ data }: { data: Analytics }) {
  const maxDay = Math.max(1, ...data.perDay.map((day) => day.count));
  const sources = [...data.sourceFailures].sort((a, b) => b.failed / Math.max(1, b.total) - a.failed / Math.max(1, a.total));

  return (
    <section aria-labelledby="health-heading" className="mt-12 grid gap-4">
      <div className="grid gap-0.5">
        <h2 id="health-heading" className="text-[15px] font-semibold">How it&apos;s running</h2>
        <p className="text-sm text-muted-foreground">
          Of finished runs, {percent(data.readyRate)} produced a draft, {percent(data.abstainRate)} found no good reason to
          write, and {percent(data.stoppedRate)} stopped on an error.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium">Runs per day, last 14 days</h3>
          <div className="flex h-32 items-end gap-1" role="img" aria-label={`Runs per day. Busiest day had ${maxDay}.`}>
            {data.perDay.map((day) => (
              <div key={day.day} className="flex h-full flex-1 flex-col justify-end" title={`${day.day}: ${day.count}`}>
                <div
                  className={`w-full rounded-sm ${day.count ? "bg-primary" : "bg-secondary"}`}
                  style={{ height: day.count ? `${(day.count / maxDay) * 100}%` : 3 }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{data.perDay[0]?.day.slice(5)}</span>
            <span>Busiest day: {maxDay}</span>
            <span>{data.perDay[data.perDay.length - 1]?.day.slice(5)}</span>
          </div>
        </div>

        <div className="grid content-start gap-4 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium">Source reliability</h3>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No source calls recorded yet.</p>
          ) : (
            <ul className="grid gap-3">
              {sources.map((item) => {
                const ok = item.total - item.failed;
                return (
                  <li key={item.stage} className="grid gap-1.5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{STEP_LABEL[item.stage] ?? item.stage}</span>
                      <span className={item.failed ? "text-caution tabular-nums" : "text-muted-foreground tabular-nums"}>
                        {item.failed ? `${item.failed} of ${item.total} failed` : `${item.total} of ${item.total} worked`}
                      </span>
                    </div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-verified" style={{ width: `${(ok / Math.max(1, item.total)) * 100}%` }} />
                      <div className="h-full bg-caution" style={{ width: `${(item.failed / Math.max(1, item.total)) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {data.failedSteps.length > 0 && (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              Runs stopped at:{" "}
              {data.failedSteps.map((item) => `${STEP_LABEL[item.stage] ?? item.stage} (${item.count})`).join(", ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
