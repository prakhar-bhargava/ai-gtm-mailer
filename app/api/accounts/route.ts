import { z } from "zod";
import { upsertCompany, upsertPerson } from "@/lib/accounts";

// Adds a website or LinkedIn page to a company, and/or a person at it. LinkedIn is saved as a reference only.
const AccountInput = z.object({
  company: z.string().trim().min(1, "Enter the company name"),
  domain: z.string().trim().optional(),
  companyLinkedinUrl: z.string().trim().optional(),
  person: z
    .object({
      name: z.string().trim().min(1, "Enter the person's name"),
      role: z.string().trim().optional(),
      email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
      linkedinUrl: z.string().trim().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const parsed = AccountInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { company, domain, companyLinkedinUrl, person } = parsed.data;
  upsertCompany({
    name: company,
    domain: domain || null,
    companyLinkedinUrl: companyLinkedinUrl || null,
  });
  if (person) {
    upsertPerson({
      name: person.name,
      role: person.role || undefined,
      companyName: company,
      email: person.email || undefined,
      linkedinUrl: person.linkedinUrl || undefined,
    });
  }
  return Response.json({ ok: true }, { status: 201 });
}
