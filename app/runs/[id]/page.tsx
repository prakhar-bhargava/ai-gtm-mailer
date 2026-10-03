import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RunView } from "@/components/run-view";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RunPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") qs.set(key, value);
  }

  const name = query.name;
  const company = query.company;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="grid gap-2">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← New run
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            {typeof name === "string" ? name : "Prospect"}
          </h1>
          {typeof company === "string" && <span className="text-lg text-zinc-600">{company}</span>}
          <Badge variant="secondary">Sample data</Badge>
        </div>
        <p className="text-xs text-zinc-400">Run {id}</p>
      </header>
      <RunView streamUrl={`/api/runs/${id}/stream?${qs.toString()}`} />
    </main>
  );
}
