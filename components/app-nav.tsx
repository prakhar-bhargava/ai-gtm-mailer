"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "New run", match: (path: string) => path === "/" },
  { href: "/dashboard", label: "Runs", match: (path: string) => path.startsWith("/dashboard") || path.startsWith("/runs") },
  { href: "/outbox", label: "Outbox", match: (path: string) => path.startsWith("/outbox") },
  { href: "/accounts", label: "Accounts", match: (path: string) => path.startsWith("/accounts") },
];

// One bar on every page, so the rep always knows where they are and how to get back.
export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <span aria-hidden className="grid size-6 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            G
          </span>
          <span className="hidden sm:inline">GTM Associate</span>
        </Link>
        <nav aria-label="Main" className="-mb-px flex h-full items-stretch gap-1 overflow-x-auto sm:gap-2">
          {LINKS.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center border-b-2 px-2 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
