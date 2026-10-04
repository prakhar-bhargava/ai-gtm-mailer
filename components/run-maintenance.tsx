"use client";

import { RefreshCw, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pillClass } from "@/components/brand";

// Brings saved runs up to today's rules. "Re-check" re-applies the current ready-to-review rule to flagged
// runs (only runs that pass every check move). "Re-run" starts fresh runs for prospects whose latest run
// was flagged or stopped; the old runs stay in the history.
export function RunMaintenance({ flagged }: { flagged: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"recheck" | "rerun" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function call(kind: "recheck" | "rerun") {
    setBusy(kind);
    setNote(null);
    try {
      const response = await fetch(`/api/runs/${kind}`, { method: "POST" });
      const body = (await response.json()) as { checked?: number; changed?: number; started?: { company: string }[] };
      if (!response.ok) throw new Error();
      if (kind === "recheck") {
        setNote(`Checked ${body.checked} flagged run${body.checked === 1 ? "" : "s"} against today's rules: ${body.changed} now ready to review.`);
      } else {
        const started = body.started ?? [];
        setNote(
          started.length
            ? `Started ${started.length} fresh run${started.length === 1 ? "" : "s"} (${started.map((item) => item.company).join(", ")}). They run one after another; refresh in a minute.`
            : "No prospect's latest run was flagged or stopped.",
        );
      }
      router.refresh();
    } catch {
      setNote("That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-line bg-card p-5">
      <div className="grid gap-0.5">
        <h2 className="text-[14px] font-medium">Bring runs up to date</h2>
        <p className="text-[12px] text-muted-foreground">
          The rules changed: an angle of 50 or more can now be ready to review, and the research reads more sources. {flagged} run{flagged === 1 ? " is" : "s are"} marked
          &quot;check before sending&quot;.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy !== null} onClick={() => void call("recheck")} className={pillClass("light", "sm")}>
          <RefreshCw className={`size-3.5 ${busy === "recheck" ? "animate-spin" : ""}`} aria-hidden />
          Re-check flagged runs
        </button>
        <button type="button" disabled={busy !== null} onClick={() => void call("rerun")} className={pillClass("dark", "sm")}>
          <RotateCcw className={`size-3.5 ${busy === "rerun" ? "animate-spin" : ""}`} aria-hidden />
          Re-run flagged prospects
        </button>
      </div>
      {note && (
        <p role="status" className="text-[12px] text-foreground/75">
          {note}
        </p>
      )}
    </section>
  );
}
