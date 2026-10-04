"use client";

import { useState, type ReactNode } from "react";

// Small, dependency-free charts in the app's visual language. Rules (from the dataviz guidance):
// thin marks, 2px gaps between stacked segments, recessive axes, a legend whenever there is more than
// one series, values in text colours (never in the series colour), and a hover tooltip on every mark.

export type Series = { key: string; label: string; color: string };

function Tooltip({ x, y, children }: { x: string; y: number; children: ReactNode }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 grid -translate-x-1/2 -translate-y-full gap-0.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      style={{ left: x, top: y - 6 }}
    >
      {children}
    </div>
  );
}

export function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/70">
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// Vertical stacked bars, one per category (e.g. per day).
export function StackedBars<T extends Record<string, number | string>>({
  data,
  xKey,
  series,
  xLabel,
  height = 180,
}: {
  data: T[];
  xKey: keyof T & string;
  series: Series[];
  xLabel: (value: string) => string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = data.map((row) => series.reduce((sum, item) => sum + Number(row[item.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const ticks = [0, Math.ceil(max / 2), max];

  return (
    <div className="grid gap-3">
      <div className="relative grid grid-cols-[24px_1fr] gap-2">
        <div className="relative text-right font-mono text-[10px] text-foreground/45" style={{ height }}>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - tick / max) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
          {ticks.map((tick) => (
            <span key={tick} aria-hidden className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${(1 - tick / max) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[3px]">
            {data.map((row, index) => (
              <button
                type="button"
                key={String(row[xKey])}
                onMouseEnter={() => setHover(index)}
                onFocus={() => setHover(index)}
                aria-label={`${xLabel(String(row[xKey]))}: ${totals[index]}`}
                className="flex h-full flex-1 flex-col-reverse items-stretch gap-[2px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-electric"
              >
                {series.map((item) => {
                  const value = Number(row[item.key] ?? 0);
                  if (!value) return null;
                  return (
                    <span
                      key={item.key}
                      className="block w-full first:rounded-b-[2px] last:rounded-t-[4px]"
                      style={{ height: `${(value / max) * 100}%`, background: item.color, opacity: hover === null || hover === index ? 1 : 0.45 }}
                    />
                  );
                })}
              </button>
            ))}
          </div>
          {hover !== null && (
            <Tooltip x={`${((hover + 0.5) / data.length) * 100}%`} y={(1 - totals[hover] / max) * height}>
              <span className="font-medium">{xLabel(String(data[hover][xKey]))}</span>
              {series.map((item) =>
                Number(data[hover][item.key] ?? 0) ? (
                  <span key={item.key} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="size-2 rounded-[2px]" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <span className="tabular-nums">{Number(data[hover][item.key])}</span>
                  </span>
                ) : null,
              )}
            </Tooltip>
          )}
        </div>
      </div>
      <div className="ml-8 flex justify-between font-mono text-[10px] text-foreground/45">
        <span>{xLabel(String(data[0]?.[xKey] ?? ""))}</span>
        <span>{xLabel(String(data[Math.floor(data.length / 2)]?.[xKey] ?? ""))}</span>
        <span>{xLabel(String(data[data.length - 1]?.[xKey] ?? ""))}</span>
      </div>
    </div>
  );
}

// Parts of a whole as a ring, with the total in the middle and a legend with values.
export function Donut({ segments, centerLabel }: { segments: (Series & { value: number })[]; centerLabel: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const gap = total > 0 && segments.filter((item) => item.value).length > 1 ? 3 : 0;
  let offset = 0;
  const shown = hover ? segments.find((item) => item.key === hover) : null;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="size-36 shrink-0" role="img" aria-label={`${centerLabel}: ${segments.map((item) => `${item.label} ${item.value}`).join(", ")}`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--line)" strokeWidth="14" />
        {total > 0 &&
          segments.map((item) => {
            const length = (item.value / total) * circumference;
            const dash = Math.max(0, length - gap);
            const element = (
              <circle
                key={item.key}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={hover === item.key ? 18 : 14}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
                onMouseEnter={() => setHover(item.key)}
                onMouseLeave={() => setHover(null)}
                style={{ transition: "stroke-width 150ms" }}
              />
            );
            offset += length;
            return element;
          })}
        <text x="70" y="66" textAnchor="middle" className="fill-foreground text-[22px]" style={{ fontFamily: "var(--font-sans)" }}>
          {shown ? shown.value : total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-foreground/55 text-[9px]" style={{ fontFamily: "var(--font-mono)" }}>
          {shown ? shown.label : centerLabel}
        </text>
      </svg>
      <ul className="grid min-w-[150px] flex-1 gap-1.5 text-[12px]">
        {segments.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3" onMouseEnter={() => setHover(item.key)} onMouseLeave={() => setHover(null)}>
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
              {item.label}
            </span>
            <span className="tabular-nums text-foreground/70">
              {item.value}
              <span className="ml-1.5 text-foreground/40">{total ? Math.round((item.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Each stage of the process as a bar, with how many runs reached it and the share of the first.
export function Funnel({ steps }: { steps: { label: string; count: number }[] }) {
  const first = Math.max(1, steps[0]?.count ?? 1);
  return (
    <ol className="grid gap-2">
      {steps.map((step, index) => {
        const share = step.count / first;
        const previous = index ? steps[index - 1].count : step.count;
        const drop = previous ? 1 - step.count / previous : 0;
        return (
          <li key={step.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem_3.5rem] items-center gap-3 text-[12px]" title={`${step.label}: ${step.count}`}>
            <span className="truncate text-foreground/75">{step.label}</span>
            <span className="relative h-6 overflow-hidden rounded-md bg-page">
              <span className="absolute inset-y-0 left-0 rounded-md bg-electric transition-[width] duration-500" style={{ width: `${Math.max(share * 100, step.count ? 2 : 0)}%`, opacity: 1 - index * 0.09 }} />
            </span>
            <span className="text-right text-[13px] tabular-nums">{step.count}</span>
            <span className="text-right font-mono text-[10.5px] tabular-nums text-foreground/55">
              {index === 0 ? "100%" : `${Math.round(share * 100)}%`}
              {index > 0 && drop > 0.2 && <span className="block text-caution">-{Math.round(drop * 100)}%</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Distribution of scores in bins of 10, with the decision thresholds drawn on top.
export function ScoreHistogram({ bins, thresholds }: { bins: { bin: number; count: number }[]; thresholds: { at: number; label: string }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bins.map((item) => item.count));
  const height = 150;
  const zone = (bin: number) => (bin >= 70 ? "var(--verified)" : bin >= 50 ? "var(--series-4)" : "#9a9a9a");
  return (
    <div className="grid gap-2 pt-5">
      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-0 flex items-end gap-[3px]">
          {bins.map((item, index) => (
            <button
              type="button"
              key={item.bin}
              onMouseEnter={() => setHover(index)}
              onFocus={() => setHover(index)}
              aria-label={`Scores ${item.bin} to ${item.bin + 9}: ${item.count} runs`}
              className="flex h-full flex-1 items-end outline-none focus-visible:ring-2 focus-visible:ring-electric"
            >
              <span className="block w-full rounded-t-[4px]" style={{ height: `${(item.count / max) * 100}%`, minHeight: item.count ? 3 : 0, background: zone(item.bin), opacity: hover === null || hover === index ? 1 : 0.5 }} />
            </button>
          ))}
        </div>
        {thresholds.map((threshold) => (
          <div key={threshold.at} aria-hidden className="absolute inset-y-0 border-l border-dashed border-foreground/50" style={{ left: `${threshold.at}%` }}>
            <span className="absolute -top-5 left-1 font-mono text-[9.5px] whitespace-nowrap text-foreground/60">{threshold.label}</span>
          </div>
        ))}
        {hover !== null && (
          <Tooltip x={`${((hover + 0.5) / bins.length) * 100}%`} y={height - (bins[hover].count / max) * height}>
            Score {bins[hover].bin} to {bins[hover].bin + 9}: <span className="font-medium tabular-nums">{bins[hover].count}</span> runs
          </Tooltip>
        )}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-foreground/45">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

// Horizontal bars for a short list of named values.
export function HBars({ items, format = (value) => String(value), color = "var(--electric)" }: { items: { label: string; value: number; color?: string }[]; format?: (value: number) => string; color?: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-[12px]" title={`${item.label}: ${format(item.value)}`}>
          <span className="truncate text-foreground/75">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-page">
            <span className="block h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: item.color ?? color }} />
          </span>
          <span className="font-mono text-[10.5px] tabular-nums text-foreground/70">{format(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}

// A tiny trend line for a tile.
export function Sparkline({ values, color = "var(--electric)" }: { values: number[]; color?: string }) {
  const width = 96;
  const height = 28;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * width},${height - (value / max) * (height - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-24" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
