"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FunData } from "@/lib/fun-analytics";

// The dashboard's "Patterns" charts: playful, but each one answers a real question about how the
// research is going. Same rules as components/charts.tsx: thin marks, 2px gaps, recessive guides,
// a legend whenever there is more than one series, values in text colours, a tooltip on every mark.

const SOURCE_COLOR: Record<string, string> = {
  news: "var(--series-1)",
  job: "var(--series-2)",
  company_site: "var(--series-3)",
  profile: "var(--series-4)",
  unknown: "#9a9a9a",
};
const SOURCE_LABEL: Record<string, string> = {
  news: "News",
  job: "Job boards",
  company_site: "Company website",
  profile: "LinkedIn (pasted)",
  unknown: "Unknown",
};
const OUTCOME_COLOR: Record<string, string> = {
  draft: "var(--verified)",
  flagged: "var(--series-4)",
  abstained: "#a3a3a3",
  stopped: "var(--destructive)",
  open: "var(--lavender)",
};
const OUTCOME_LABEL: Record<string, string> = {
  draft: "Ready to review",
  flagged: "Check before sending",
  abstained: "No good reason",
  stopped: "Stopped",
  open: "Running",
};
const CATEGORY_LABEL: Record<string, string> = {
  finance_hiring: "Finance hiring",
  erp: "Finance system",
  expansion: "Expansion",
  funding: "Funding",
  compliance: "Compliance",
  growth: "Growth",
  partnership: "Partnership",
  other_hiring: "Other hiring",
  other: "Other news",
  background: "Background",
};

// The container's width in pixels, so SVG charts draw at 1:1 and their text stays the same size as the
// rest of the page instead of scaling with the card.
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(Math.max(200, Math.floor(element.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function Tip({ left, top, children }: { left: number | string; top: number | string; children: ReactNode }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 grid -translate-x-1/2 -translate-y-full gap-0.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      style={{ left, top: typeof top === "number" ? top - 6 : `calc(${top} - 6px)` }}
    >
      {children}
    </div>
  );
}

function Key({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/70">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------
// When people research: weekday by hour.

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityHeatmap({ heat }: { heat: number[][] }) {
  const [hover, setHover] = useState<{ day: number; hour: number } | null>(null);
  const [ref, available] = useWidth<HTMLDivElement>(480);
  const max = Math.max(1, ...heat.flat());
  const gap = 2;
  const left = 30;
  const top = 16;
  const cell = Math.max(9, Math.min(24, Math.floor((available - left) / 24) - gap));
  const width = left + 24 * (cell + gap);
  const height = top + 7 * (cell + gap);
  const shade = (count: number) => (count === 0 ? "#e9e9e9" : `color-mix(in oklab, var(--electric) ${Math.round(22 + (count / max) * 78)}%, white)`);

  return (
    <div className="grid gap-3">
      <div ref={ref} className="relative">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label="Runs by weekday and hour">
          {[0, 6, 12, 18].map((hour) => (
            <text key={hour} x={left + hour * (cell + gap)} y={10} className="fill-foreground/50 font-mono text-[10px]">
              {String(hour).padStart(2, "0")}:00
            </text>
          ))}
          {heat.map((row, day) => (
            <g key={day}>
              <text x={0} y={top + day * (cell + gap) + cell * 0.68} className="fill-foreground/55 font-mono text-[10px]">
                {DAYS[day]}
              </text>
              {row.map((count, hour) => (
                <rect
                  key={hour}
                  x={left + hour * (cell + gap)}
                  y={top + day * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={3}
                  fill={shade(count)}
                  stroke={hover?.day === day && hover.hour === hour ? "var(--foreground)" : "none"}
                  strokeWidth={1.5}
                  onMouseEnter={() => setHover({ day, hour })}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </g>
          ))}
        </svg>
        {hover && (
          <Tip left={left + hover.hour * (cell + gap) + cell / 2} top={top + hover.day * (cell + gap)}>
            <span className="font-medium">
              {DAYS[hover.day]} {String(hover.hour).padStart(2, "0")}:00
            </span>
            <span className="text-foreground/65">
              {heat[hover.day][hover.hour]} run{heat[hover.day][hover.hour] === 1 ? "" : "s"}
            </span>
          </Tip>
        )}
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] text-foreground/55">
        <span>Fewer</span>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <span key={step} className="size-3 rounded-[3px]" style={{ background: shade(step * max) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The anatomy of a winning angle: each rubric part as a share of its maximum.

export function ScoreRadar({ radar }: { radar: FunData["radar"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const size = 280;
  const center = size / 2;
  const radius = 72;
  const angle = (index: number) => (Math.PI * 2 * index) / radar.length - Math.PI / 2;
  const point = (index: number, share: number) => [center + Math.cos(angle(index)) * radius * share, center + Math.sin(angle(index)) * radius * share];
  const series = [
    { key: "drafted" as const, label: "Runs that wrote a draft", color: "var(--series-1)" },
    { key: "abstained" as const, label: "Runs that abstained", color: "var(--series-3)" },
  ].filter((item) => radar.some((part) => part[item.key] !== null));

  return (
    <div className="grid gap-3">
      <Key items={series} />
      <div className="relative mx-auto" style={{ width: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" role="img" aria-label="Average angle score parts">
          {[0.25, 0.5, 0.75, 1].map((ring) => (
            <polygon
              key={ring}
              points={radar.map((_, index) => point(index, ring).join(",")).join(" ")}
              fill="none"
              stroke="var(--line)"
              strokeWidth={1}
            />
          ))}
          {radar.map((part, index) => {
            const [x, y] = point(index, 1);
            const [lx, ly] = point(index, 1.2);
            return (
              <g key={part.key}>
                <line x1={center} y1={center} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={Math.abs(lx - center) < 8 ? "middle" : lx > center ? "start" : "end"}
                  dominantBaseline="middle"
                  className="fill-foreground/65 text-[11px]"
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                >
                  {part.label}
                </text>
              </g>
            );
          })}
          {series.map((item) => (
            <g key={item.key}>
              <polygon
                points={radar.map((part, index) => point(index, part[item.key] ?? 0).join(",")).join(" ")}
                fill={item.color}
                fillOpacity={0.12}
                stroke={item.color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {radar.map((part, index) => {
                const [x, y] = point(index, part[item.key] ?? 0);
                return (
                  <circle
                    key={part.key}
                    cx={x}
                    cy={y}
                    r={4}
                    fill={item.color}
                    stroke="white"
                    strokeWidth={2}
                    onMouseEnter={() => setHover(index)}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
            </g>
          ))}
        </svg>
        {hover !== null && (
          <Tip left="50%" top={22}>
            <span className="font-medium">
              {radar[hover].label} (out of {radar[hover].max})
            </span>
            {series.map((item) => (
              <span key={item.key} className="text-foreground/70">
                {item.label}: {((radar[hover][item.key] ?? 0) * radar[hover].max).toFixed(1)}
              </span>
            ))}
          </Tip>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The last 100 runs, one square each. Click a square to open the run.

export function OutcomeWaffle({ waffle }: { waffle: FunData["waffle"] }) {
  const present = Object.keys(OUTCOME_LABEL).filter((key) => waffle.some((item) => item.outcome === key));
  return (
    <div className="grid gap-3">
      <Key items={present.map((key) => ({ label: OUTCOME_LABEL[key], color: OUTCOME_COLOR[key] }))} />
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(25, minmax(0, 1fr))" }} role="list" aria-label="Last runs by result">
        {Array.from({ length: 100 }, (_, index) => {
          const item = waffle[index];
          if (!item) return <span key={index} aria-hidden className="aspect-square rounded-[4px] border border-dashed border-line" />;
          return (
            <Link
              key={item.runId}
              role="listitem"
              href={`/runs/${item.runId}`}
              title={`${item.company}: ${OUTCOME_LABEL[item.outcome] ?? item.outcome}`}
              aria-label={`${item.company}: ${OUTCOME_LABEL[item.outcome] ?? item.outcome}`}
              className="aspect-square rounded-[4px] transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-foreground"
              style={{ background: OUTCOME_COLOR[item.outcome] ?? "#a3a3a3" }}
            />
          );
        })}
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Where the winning angle came from, what kind of angle it was, and how the run ended.

type NodeBox = { key: string; label: string; value: number; y: number; h: number; color: string };

// One scale for every column, so a band is exactly as tall as its share of each node it joins.
function layoutColumn(entries: [string, number][], scale: number, pad: number, label: (key: string) => string, color: (key: string) => string): NodeBox[] {
  let y = 0;
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => {
      const box = { key, label: label(key), value, y, h: value * scale, color: color(key) };
      y += box.h + pad;
      return box;
    });
}

export function AngleFlow({ flow }: { flow: FunData["flow"] }) {
  const [hover, setHover] = useState<string | null>(null);
  const [ref, W] = useWidth<HTMLDivElement>(720);
  if (!flow.length) return <p className="text-[12px] text-muted-foreground">Finished runs will show up here.</p>;
  const H = 220;
  const nodeW = 8;
  // Room for labels: source names on the left, results on the right, angle types beside the middle column.
  const xs = [128, Math.round(W * 0.47), W - 168];
  const sum = (pick: (row: FunData["flow"][number]) => string) => {
    const map = new Map<string, number>();
    for (const row of flow) map.set(pick(row), (map.get(pick(row)) ?? 0) + row.count);
    return [...map];
  };
  const PAD = 10;
  const columns = [sum((row) => row.source), sum((row) => row.category), sum((row) => row.outcome)];
  const total = flow.reduce((acc, row) => acc + row.count, 0) || 1;
  const scale = Math.min(...columns.map((entries) => (H - PAD * Math.max(0, entries.length - 1)) / total));
  const sources = layoutColumn(columns[0], scale, PAD, (key) => SOURCE_LABEL[key] ?? key, (key) => SOURCE_COLOR[key] ?? "#9a9a9a");
  const categories = layoutColumn(columns[1], scale, PAD, (key) => CATEGORY_LABEL[key] ?? key, () => "var(--foreground)");
  const outcomes = layoutColumn(columns[2], scale, PAD, (key) => OUTCOME_LABEL[key] ?? key, (key) => OUTCOME_COLOR[key] ?? "#a3a3a3");

  // Bands: source -> category, then category -> outcome, stacked in order inside each node.
  const offsets = new Map<string, number>();
  const take = (column: string, key: string, amount: number) => {
    const id = `${column}:${key}`;
    const start = offsets.get(id) ?? 0;
    offsets.set(id, start + amount);
    return start;
  };
  const band = (x1: number, y1: number, x2: number, y2: number, h: number) => {
    const mid = (x1 + x2) / 2;
    return `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2} L${x2},${y2 + h} C${mid},${y2 + h} ${mid},${y1 + h} ${x1},${y1 + h} Z`;
  };
  const find = (list: NodeBox[], key: string) => list.find((item) => item.key === key)!;

  const left = sum((row) => `${row.source}|${row.category}`).sort((a, b) => b[1] - a[1]);
  const right = sum((row) => `${row.category}|${row.outcome}`).sort((a, b) => b[1] - a[1]);
  const bandsLeft = left.map(([key, value]) => {
    const [source, category] = key.split("|");
    const from = find(sources, source);
    const to = find(categories, category);
    const h = value * scale;
    return { key: `l:${key}`, d: band(xs[0] + nodeW, from.y + take("s-out", source, h), xs[1], to.y + take("c-in", category, h), h), color: from.color, label: `${from.label} → ${to.label}`, value };
  });
  const bandsRight = right.map(([key, value]) => {
    const [category, outcome] = key.split("|");
    const from = find(categories, category);
    const to = find(outcomes, outcome);
    const h = value * scale;
    return { key: `r:${key}`, d: band(xs[1] + nodeW, from.y + take("c-out", category, h), xs[2], to.y + take("o-in", outcome, h), h), color: to.color, label: `${from.label} → ${to.label}`, value };
  });
  const active = [...bandsLeft, ...bandsRight].find((item) => item.key === hover);

  return (
    <div ref={ref} className="relative">
        <svg width={W} height={H + 30} viewBox={`0 0 ${W} ${H + 30}`} className="block" role="img" aria-label="Source to angle to result">
          {[
            { x: xs[0] + nodeW, anchor: "end" as const, text: "SOURCE" },
            { x: xs[1], anchor: "start" as const, text: "KIND OF ANGLE" },
            { x: xs[2], anchor: "start" as const, text: "RESULT" },
          ].map((head) => (
            <text key={head.text} x={head.x} y={10} textAnchor={head.anchor} className="fill-foreground/50 font-mono text-[10px] tracking-wide">
              {head.text}
            </text>
          ))}
          <g transform="translate(0 22)">
          {[...bandsLeft, ...bandsRight].map((item) => (
            <path
              key={item.key}
              d={item.d}
              fill={item.color}
              fillOpacity={hover === null ? 0.28 : hover === item.key ? 0.55 : 0.1}
              onMouseEnter={() => setHover(item.key)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {sources.map((node) => (
            <g key={node.key}>
              <rect x={xs[0]} y={node.y} width={nodeW} height={Math.max(3, node.h)} rx={2} fill={node.color} />
              <text x={xs[0] - 8} y={node.y + node.h / 2} textAnchor="end" dominantBaseline="middle" className="fill-foreground text-[11px]">
                {node.label} <tspan className="fill-foreground/50 font-mono text-[10px]">{node.value}</tspan>
              </text>
            </g>
          ))}
          {categories.map((node) => (
            <g key={node.key}>
              <rect x={xs[1]} y={node.y} width={nodeW} height={Math.max(3, node.h)} rx={2} fill="var(--foreground)" />
              <text
                x={xs[1] + nodeW + 6}
                y={node.y + node.h / 2}
                dominantBaseline="middle"
                className="fill-foreground text-[11px]"
                style={{ paintOrder: "stroke", stroke: "var(--card)", strokeWidth: 4 }}
              >
                {node.label}
              </text>
            </g>
          ))}
          {outcomes.map((node) => (
            <g key={node.key}>
              <rect x={xs[2]} y={node.y} width={nodeW} height={Math.max(3, node.h)} rx={2} fill={node.color} />
              <text x={xs[2] + nodeW + 8} y={node.y + node.h / 2} dominantBaseline="middle" className="fill-foreground text-[11px]">
                {node.label} <tspan className="fill-foreground/50 font-mono text-[10px]">{node.value}</tspan>
              </text>
            </g>
          ))}
          </g>
        </svg>
        {active && (
          <Tip left="50%" top={28}>
            <span className="font-medium">{active.label}</span>
            <span className="text-foreground/65">
              {active.value} run{active.value === 1 ? "" : "s"}
            </span>
          </Tip>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Words the subject lines lean on.

export function SubjectWords({ words }: { words: FunData["subjectWords"] }) {
  if (!words.length) return <p className="text-[12px] text-muted-foreground">Subjects will show up here once drafts are written.</p>;
  const max = Math.max(...words.map((item) => item.count));
  const min = Math.min(...words.map((item) => item.count));
  // Alphabetical, so the big words are scattered rather than stacked at the start.
  const shown = [...words].sort((a, b) => a.word.localeCompare(b.word));
  return (
    <ul className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5" aria-label="Words used most in subject lines">
      {shown.map((item) => {
        const share = max === min ? 1 : (item.count - min) / (max - min);
        return (
          <li
            key={item.word}
            title={`"${item.word}" in ${item.count} subject${item.count === 1 ? "" : "s"}`}
            className={share > 0.6 ? "text-electric" : "text-foreground/80"}
            style={{ fontSize: `${13 + share * 17}px`, fontWeight: share > 0.6 ? 500 : 300, letterSpacing: "-0.01em" }}
          >
            {item.word}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------
// Tokens per draft against the four-call version.

export function TokenGauge({ tokens }: { tokens: FunData["tokens"] }) {
  const value = tokens.perDraft;
  const share = value === null ? 0 : Math.min(1, value / tokens.baseline);
  const r = 90;
  const cx = 110;
  const cy = 104;
  const arc = (to: number) => {
    const angle = Math.PI * (1 - to);
    return `M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + Math.cos(angle) * r},${cy - Math.sin(angle) * r}`;
  };
  const saved = value === null ? null : Math.round((1 - value / tokens.baseline) * 100);
  return (
    <div className="grid justify-items-center gap-2">
      <svg viewBox="0 0 220 120" className="h-auto w-full max-w-[280px]" role="img" aria-label="Tokens per draft">
        <path d={arc(1)} fill="none" stroke="var(--line)" strokeWidth={14} strokeLinecap="round" />
        {value !== null && <path d={arc(share)} fill="none" stroke="var(--electric)" strokeWidth={14} strokeLinecap="round" />}
        <text x={cx} y={cy - 22} textAnchor="middle" className="fill-foreground text-[26px] font-light">
          {value === null ? "No data" : value.toLocaleString("en-GB")}
        </text>
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground/55 font-mono text-[9px]">
          tokens per draft
        </text>
        <text x={cx - r} y={cy + 14} textAnchor="middle" className="fill-foreground/45 font-mono text-[8.5px]">
          0
        </text>
        <text x={cx + r} y={cy + 14} textAnchor="middle" className="fill-foreground/45 font-mono text-[8.5px]">
          {tokens.baseline.toLocaleString("en-GB")}
        </text>
      </svg>
      <p className="text-center text-[12px] text-muted-foreground">
        {saved === null
          ? "Measured from the next run."
          : `${saved}% fewer than the old four-call pipeline (${tokens.baseline.toLocaleString("en-GB")}). Average of ${tokens.drafts} measured draft${tokens.drafts === 1 ? "" : "s"}.`}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Most researched companies.

export function Leaderboard({ rows }: { rows: FunData["leaderboard"] }) {
  const max = Math.max(1, ...rows.map((row) => row.runs));
  return (
    <ol className="grid gap-2.5">
      {rows.map((row, index) => (
        <li key={row.company} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3">
          <span className={`grid size-[22px] place-items-center rounded-full font-mono text-[11px] ${index === 0 ? "bg-foreground text-background" : "bg-foreground/[0.07]"}`}>
            {index + 1}
          </span>
          <div className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <Link href={`/search?q=${encodeURIComponent(row.company)}`} className="truncate text-[13px] hover:text-electric">
                {row.company}
              </Link>
              <span className="font-mono text-[10.5px] text-foreground/55 tabular-nums">
                {row.runs} run{row.runs === 1 ? "" : "s"}
              </span>
            </div>
            <span className="h-1.5 rounded-full bg-foreground/[0.06]">
              <span className="block h-full rounded-full bg-electric" style={{ width: `${(row.runs / max) * 100}%` }} />
            </span>
          </div>
          <span
            title="Best angle score"
            className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] tabular-nums ${row.best >= 50 ? "bg-verified-soft text-verified" : "bg-foreground/[0.07] text-foreground/60"}`}
          >
            {row.best}
          </span>
        </li>
      ))}
    </ol>
  );
}
