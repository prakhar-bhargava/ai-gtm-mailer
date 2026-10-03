import type { ReactNode } from "react";

// The one panel style used across the app: white, a hairline border, and generous padding.
export function Section({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`grid content-start gap-5 rounded-xl border border-zinc-200 bg-white p-6 ${className}`}>
      {title && <h2 className="text-base font-semibold text-zinc-950">{title}</h2>}
      {children}
    </section>
  );
}
