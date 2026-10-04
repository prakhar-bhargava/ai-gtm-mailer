import { getDb } from "@/lib/db";
import { indexCompany, reindexAll, searchAccountIds } from "@/lib/search";

// The accounts list: companies with their websites, job boards and social links,
// and the people searched for at each. LinkedIn URLs are stored as references only, never fetched.
export type CompanyRecord = {
  id: string;
  name: string;
  domain: string | null;
  jobBoard: string | null;
  social: string[];
  companyLinkedinUrl: string | null;
  updatedAt: string;
  people: PersonRecord[];
};

export type PersonRecord = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  linkedinUrl: string | null;
  updatedAt: string;
};

// One key per company, so "Stripe" and "stripe " are the same account.
export const accountKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function upsertCompany(input: {
  name: string;
  domain?: string | null;
  jobBoard?: string | null;
  social?: string[];
  companyLinkedinUrl?: string | null;
}): string {
  const id = accountKey(input.name);
  const now = new Date().toISOString();
  const db = getDb();
  const existing = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as
    | { social_json: string; domain: string | null; job_board: string | null; company_linkedin_url: string | null }
    | undefined;

  // Keep what we already know; fill in anything new.
  const social = [...new Set([...(existing ? (JSON.parse(existing.social_json) as string[]) : []), ...(input.social ?? [])])];
  db.prepare(
    `INSERT INTO companies (id, name, domain, job_board, social_json, company_linkedin_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       domain = COALESCE(excluded.domain, companies.domain),
       job_board = COALESCE(excluded.job_board, companies.job_board),
       social_json = excluded.social_json,
       company_linkedin_url = COALESCE(excluded.company_linkedin_url, companies.company_linkedin_url),
       updated_at = excluded.updated_at`,
  ).run(
    id,
    input.name,
    input.domain ?? existing?.domain ?? null,
    input.jobBoard ?? existing?.job_board ?? null,
    JSON.stringify(social),
    input.companyLinkedinUrl ?? existing?.company_linkedin_url ?? null,
    now,
  );
  indexCompany(id);
  return id;
}

export function upsertPerson(input: {
  name: string;
  role?: string;
  companyName: string;
  linkedinUrl?: string;
  email?: string;
}): void {
  const companyId = upsertCompany({ name: input.companyName });
  const id = `${accountKey(input.name)}@${companyId}`;
  getDb()
    .prepare(
      `INSERT INTO people (id, name, role, company_id, linkedin_url, email, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         role = COALESCE(excluded.role, people.role),
         linkedin_url = COALESCE(excluded.linkedin_url, people.linkedin_url),
         email = COALESCE(excluded.email, people.email),
         updated_at = excluded.updated_at`,
    )
    .run(id, input.name, input.role ?? null, companyId, input.linkedinUrl ?? null, input.email ?? null, new Date().toISOString());
  indexCompany(companyId);
}

export function listAccounts(q?: string): CompanyRecord[] {
  const db = getDb();
  let companies: {
    id: string;
    name: string;
    domain: string | null;
    job_board: string | null;
    social_json: string;
    company_linkedin_url: string | null;
    updated_at: string;
  }[];
  const people = db.prepare("SELECT * FROM people").all() as {
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    company_id: string;
    linkedin_url: string | null;
    updated_at: string;
  }[];

  // A search ranks the matches (see lib/search.ts). An empty search lists everything, newest first.
  const term = q?.trim() ?? "";
  if (term) {
    const count = db.prepare("SELECT COUNT(*) AS n FROM account_index").get() as { n: number };
    if (count.n === 0) reindexAll();
    const ranked = searchAccountIds(term);
    const all = db.prepare("SELECT * FROM companies").all() as typeof companies;
    companies = ranked
      .map((id) => all.find((company) => company.id === id))
      .filter((company): company is (typeof all)[number] => Boolean(company));
  } else {
    companies = db.prepare("SELECT * FROM companies ORDER BY updated_at DESC").all() as typeof companies;
  }

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    domain: company.domain,
    jobBoard: company.job_board,
    social: JSON.parse(company.social_json) as string[],
    companyLinkedinUrl: company.company_linkedin_url,
    updatedAt: company.updated_at,
    people: people
      .filter((person) => person.company_id === company.id)
      .map((person) => ({
        id: person.id,
        name: person.name,
        role: person.role,
        email: person.email,
        linkedinUrl: person.linkedin_url,
        updatedAt: person.updated_at,
      })),
  }));
}
