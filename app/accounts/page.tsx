import Link from "next/link";
import { Section } from "@/components/section";
import { Input } from "@/components/ui/input";
import { listAccounts } from "@/lib/accounts";

export const dynamic = "force-dynamic";

// A link shown as its host, so the list stays readable.
function HostLink({ url }: { url: string }) {
  let label = url;
  try {
    label = new URL(url).host.replace(/^www\./, "");
  } catch {
    // keep the raw text
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-zinc-700 underline underline-offset-2 hover:text-zinc-950">
      {label}
    </a>
  );
}

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const accounts = listAccounts(q.trim());

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="grid gap-2">
        <div className="flex gap-4 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">← New run</Link>
          <Link href="/dashboard" className="hover:text-zinc-900">Dashboard</Link>
          <Link href="/outbox" className="hover:text-zinc-900">Outbox</Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Accounts</h1>
        <p className="text-zinc-600">
          Every company and person you have searched, with the links found on each company&apos;s own site. LinkedIn
          links are references only.
        </p>
      </header>

      <form action="/accounts" className="flex gap-3">
        <Input name="q" defaultValue={q} placeholder="Search companies" className="max-w-sm" />
        <button type="submit" className="h-9 rounded-md border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50">
          Search
        </button>
      </form>

      {accounts.length === 0 ? (
        <Section>
          <p className="text-sm text-zinc-600">No accounts yet. Start a search and it will appear here.</p>
        </Section>
      ) : (
        <ul className="grid gap-4">
          {accounts.map((company) => (
            <li key={company.id}>
              <Section>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-950">{company.name}</h2>
                  {company.domain && <HostLink url={`https://${company.domain}`} />}
                </div>

                <dl className="grid grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-zinc-500">Job board</dt>
                  <dd className="text-zinc-800">{company.jobBoard ?? "Not found yet"}</dd>
                  <dt className="text-zinc-500">Company LinkedIn</dt>
                  <dd>{company.companyLinkedinUrl ? <HostLink url={company.companyLinkedinUrl} /> : <span className="text-zinc-500">Not added</span>}</dd>
                  <dt className="text-zinc-500">Other profiles</dt>
                  <dd className="grid gap-1">
                    {company.social.filter((url) => !url.includes("linkedin.com")).length === 0 ? (
                      <span className="text-zinc-500">None found on the website</span>
                    ) : (
                      company.social
                        .filter((url) => !url.includes("linkedin.com"))
                        .map((url) => <HostLink key={url} url={url} />)
                    )}
                  </dd>
                </dl>

                <div className="grid gap-2 border-t border-zinc-100 pt-4">
                  <span className="text-xs font-medium text-zinc-500">People</span>
                  {company.people.length === 0 ? (
                    <span className="text-sm text-zinc-500">No people saved yet</span>
                  ) : (
                    <ul className="grid gap-2 text-sm">
                      {company.people.map((person) => (
                        <li key={person.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-medium text-zinc-900">{person.name}</span>
                          {person.role && <span className="text-zinc-600">{person.role}</span>}
                          {person.linkedinUrl && <HostLink url={person.linkedinUrl} />}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Section>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
