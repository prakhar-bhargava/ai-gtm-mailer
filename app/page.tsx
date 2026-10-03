import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RunForm } from "@/components/run-form";

export default function Home() {
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
    </main>
  );
}
