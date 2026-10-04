import type { ReactNode } from "react";

// Shared building blocks for the dashboard, so every card and tile has the same padding, radius and type:
// card title 14px medium, note 12px, tile value 26px light, small print 11px mono.

export function Card({
  title,
  note,
  aside,
  children,
  className = "",
  center = false,
}: {
  title: string;
  note?: string;
  aside?: ReactNode; // a small figure or link on the right of the title
  children: ReactNode;
  className?: string;
  center?: boolean; // centre the content vertically (for a single round chart)
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-card p-4 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-0.5">
          <h3 className="text-[14px] leading-5 font-medium">{title}</h3>
          {note && <p className="text-[12px] leading-4 text-muted-foreground">{note}</p>}
        </div>
        {aside && <div className="shrink-0 font-mono text-[11px] text-foreground/60">{aside}</div>}
      </header>
      <div className={`flex min-h-0 flex-1 flex-col ${center ? "justify-center" : "justify-start"}`}>{children}</div>
    </section>
  );
}

export function Tile({ label, value, note, children }: { label: string; value: string; note?: string; children?: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5 rounded-2xl border border-line bg-card px-4 py-3">
      <span className="truncate text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[26px] leading-none font-light tracking-tight tabular-nums">{value}</span>
        {children}
      </div>
      {note && <span className="truncate font-mono text-[11px] text-foreground/50">{note}</span>}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 font-mono text-[11px] tracking-[0.08em] text-foreground/55 uppercase">{children}</h2>;
}
