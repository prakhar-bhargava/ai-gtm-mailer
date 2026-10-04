import { Search } from "lucide-react";
import Link from "next/link";
import { AccountForm } from "@/components/account-form";
import { PageHeader } from "@/components/page-header";
import { hostOf } from "@/lib/format";
import { listAccounts } from "@/lib/accounts";

export const dynamic = "force-dynamic";

function HostLink({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-2 hover:decoration-foreground">
      {hostOf(url)}
    </a>
  );
}

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const accounts = listAccounts(q.trim());

  return (
    <main className="mx-auto max-w-4xl">
      <PageHeader
        title="Accounts"
        description="Companies and people you have researched, with the links found on each company's own website. LinkedIn links are saved for reference and never opened by the app."
      />

      <div className="mb-6">
        <AccountForm />
      </div>

      <form action="/accounts" className="relative mb-4 w-full sm:w-72" role="search">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <label htmlFor="q" className="sr-only">
          Search companies
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search companies, people or websites"
          className="h-9 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
      </form>

      {accounts.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border bg-card p-8">
          <p className="font-medium">{q ? "No companies match" : "No accounts yet"}</p>
          <p className="text-sm text-muted-foreground">
            {q ? "Try another name." : "Every company you research is added here automatically."}
          </p>
          <Link href={q ? "/accounts" : "/"} className="text-sm font-medium text-primary hover:underline">
            {q ? "Clear search" : "Start a run"}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {accounts.map((company) => {
            const social = company.social.filter((url) => !url.includes("linkedin.com"));
            return (
              <li key={company.id} className="grid gap-3 px-5 py-5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6">
                <div className="grid content-start gap-0.5">
                  <h2 className="font-semibold">{company.name}</h2>
                  {company.domain ? (
                    <span className="text-sm text-muted-foreground">
                      <HostLink url={`https://${company.domain}`} />
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No website found</span>
                  )}
                </div>

                <dl className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">People</dt>
                  <dd>
                    {company.people.length === 0
                      ? <span className="text-muted-foreground">None saved</span>
                      : company.people.map((person, index) => (
                          <span key={person.id}>
                            {index > 0 && ", "}
                            {person.linkedinUrl ? (
                              <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-2">
                                {person.name}
                              </a>
                            ) : (
                              person.name
                            )}
                            {person.role && <span className="text-muted-foreground"> ({person.role})</span>}
                          </span>
                        ))}
                  </dd>
                  <dt className="text-muted-foreground">Job board</dt>
                  <dd>{company.jobBoard ?? <span className="text-muted-foreground">Not found</span>}</dd>
                  <dt className="text-muted-foreground">LinkedIn</dt>
                  <dd>{company.companyLinkedinUrl ? <HostLink url={company.companyLinkedinUrl} /> : <span className="text-muted-foreground">Not added</span>}</dd>
                  <dt className="text-muted-foreground">Other profiles</dt>
                  <dd className="flex flex-wrap gap-x-3 gap-y-1">
                    {social.length === 0 ? <span className="text-muted-foreground">None on the website</span> : social.map((url) => <HostLink key={url} url={url} />)}
                  </dd>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
