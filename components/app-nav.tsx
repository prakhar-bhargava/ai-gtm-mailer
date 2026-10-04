"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Logo, PillLink } from "@/components/brand";

const LINKS = [
  { href: "/app", label: "New run", match: (path: string) => path === "/app" },
  { href: "/dashboard", label: "Dashboard", match: (path: string) => path.startsWith("/dashboard") || path.startsWith("/runs") },
  { href: "/outbox", label: "Outbox", match: (path: string) => path.startsWith("/outbox") },
  { href: "/accounts", label: "Accounts", match: (path: string) => path.startsWith("/accounts") },
];

// One bar on every working page: where you are, a search across runs and accounts, and a way to start a run.
export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Logo href="/" label={false} />
        <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto text-[13px]">
          {LINKS.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 whitespace-nowrap transition-colors ${
                  active ? "bg-foreground text-background" : "text-foreground/70 hover:bg-black/5 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Suspense fallback={<div className="ml-auto hidden h-9 w-72 md:block" />}>
          <SearchBox />
        </Suspense>
        <span className="ml-auto hidden sm:block md:ml-0">
          <PillLink href="/app" size="sm">
            New run
          </PillLink>
        </span>
      </div>
    </header>
  );
}

function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState(pathname === "/search" ? (params.get("q") ?? "") : "");

  function submit(event: FormEvent) {
    event.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <form onSubmit={submit} role="search" className="relative ml-auto hidden w-72 md:block">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground/45" aria-hidden />
      <label htmlFor="global-search" className="sr-only">
        Search runs, companies and people
      </label>
      <input
        id="global-search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search runs, companies, people"
        className="h-9 w-full rounded-full border border-line bg-white pr-3 pl-10 text-[13px] outline-none placeholder:text-foreground/45 focus-visible:border-electric"
      />
    </form>
  );
}
