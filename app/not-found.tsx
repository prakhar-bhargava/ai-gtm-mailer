import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">That page doesn&apos;t exist</h1>
      <p className="text-zinc-600">
        The run may have been saved on another machine or in a database that has since been reset. Start a new run, or
        open the dashboard to find runs saved on this machine.
      </p>
      <div className="flex gap-4 text-sm">
        <Link href="/" className="font-medium text-zinc-900 underline underline-offset-2">New run</Link>
        <Link href="/dashboard" className="font-medium text-zinc-900 underline underline-offset-2">Dashboard</Link>
      </div>
    </main>
  );
}
