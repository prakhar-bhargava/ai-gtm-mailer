import type { ReactNode } from "react";

// Title, one line of description, and an optional action on the right. Used at the top of every page.
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="grid max-w-2xl gap-1.5">
        <h1 className="text-[34px] leading-tight font-normal tracking-tight text-foreground sm:text-[42px]">{title}</h1>
        {description && <p className="text-[15px] leading-6 text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
