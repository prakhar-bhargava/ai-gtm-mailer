import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// The mark: four squares on a 2x2 grid, one in electric blue. A pixel, like the art around it.
export function Mark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <rect x="0" y="0" width="7" height="7" fill="currentColor" />
      <rect x="9" y="0" width="7" height="7" fill="currentColor" />
      <rect x="0" y="9" width="7" height="7" fill="var(--electric)" />
      <rect x="9" y="9" width="7" height="7" fill="currentColor" />
    </svg>
  );
}

export function Logo({ href = "/", label = true }: { href?: string; label?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-foreground" aria-label="GTM Associate home">
      <Mark />
      {label && <span className="text-[15px] font-semibold tracking-tight">GTM Associate</span>}
    </Link>
  );
}

const PILL = {
  dark: "bg-foreground text-background hover:bg-foreground/85",
  light: "border border-foreground/15 bg-white text-foreground hover:border-foreground/40",
  blue: "bg-electric text-white hover:bg-electric/90",
  ghost: "text-foreground hover:bg-black/5",
} as const;

export type PillTone = keyof typeof PILL;

// The button style: a pill with a monospace label.
export function pillClass(tone: PillTone = "dark", size: "sm" | "md" | "lg" = "md") {
  const sizes = { sm: "h-8 px-3.5 text-[12px]", md: "h-10 px-5 text-[13px]", lg: "h-12 px-6 text-[14px]" };
  return `inline-flex items-center justify-center gap-2 rounded-full font-mono whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-45 ${sizes[size]} ${PILL[tone]}`;
}

export function PillLink({ tone = "dark", size = "md", className = "", ...props }: ComponentProps<typeof Link> & { tone?: PillTone; size?: "sm" | "md" | "lg" }) {
  return <Link className={`${pillClass(tone, size)} ${className}`} {...props} />;
}

export function PillButton({
  tone = "dark",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: PillTone; size?: "sm" | "md" | "lg" }) {
  return <button className={`${pillClass(tone, size)} ${className}`} {...props} />;
}

// The machine voice: small monospace text on a grey card, like a terminal note.
export function MonoNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-black/5 bg-[#e2e2e2]/80 p-4 font-mono text-[12px] leading-[1.6] text-foreground/85 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

// A small label in the machine voice: a square bullet and monospace text.
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-mono text-[11px] text-foreground/70 ${className}`}>
      <span aria-hidden className="size-1.5 bg-current" />
      {children}
    </span>
  );
}
