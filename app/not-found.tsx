import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid max-w-xl gap-3 px-4 pt-24">
      <h1 className="text-[34px] font-normal tracking-tight">This page doesn&apos;t exist</h1>
      <p className="leading-7 text-muted-foreground">
        Runs are saved on the machine that ran them. If this link came from another computer, or the database was reset, the
        run is not here. Find it in Runs, or start a new one.
      </p>
      <div className="flex gap-4 text-sm font-medium">
        <Link href="/dashboard" className="text-electric hover:underline">
          Runs
        </Link>
        <Link href="/app" className="text-electric hover:underline">
          New run
        </Link>
      </div>
    </main>
  );
}
