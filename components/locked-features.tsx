import { Lock } from "lucide-react";
import features from "@/config/features.json";
import { Section } from "@/components/section";

// Features the free setup can't support yet. Shown locked, with the plan they belong to.
export function LockedFeatures() {
  return (
    <Section title="More with a paid plan" description="These are not available yet. Each one is marked with the plan it will belong to.">
      <ul className="grid gap-3 sm:grid-cols-2">
        {features.locked.map((feature) => (
          <li key={feature.id} className="grid gap-1 rounded-lg border border-dashed border-border p-4">
            <span className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{feature.title}</span>
              <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Lock className="size-3" aria-hidden />
                {feature.plan}
              </span>
            </span>
            <span className="text-sm text-muted-foreground">{feature.description}</span>
            <span className="text-xs text-muted-foreground">Why it is locked: {feature.why}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
