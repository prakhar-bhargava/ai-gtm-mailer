import type { ReactNode } from "react";

// The one panel style used across the app: white, a hairline border, no shadow.
export function Section({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`grid content-start gap-4 rounded-lg border border-border bg-card p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="grid gap-0.5">
            {title && <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
