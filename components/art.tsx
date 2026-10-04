"use client";

import { useEffect, useRef } from "react";

// Generated pixel art in the spirit of dithered print: shapes made from value noise, coloured in bands
// and broken up with an ordered (Bayer) dither so the edges look printed, not blurred.
// Deterministic for a given seed, so the page looks the same on every load.

type Variant = "cloud" | "ridge" | "band" | "mountain";

const PALETTES: Record<string, string[]> = {
  // light to dark; index 0 is "empty"
  dawn: ["", "#d9d0ff", "#f6a9df", "#ffffff", "#8fdccf", "#1a54ff", "#0b1638"],
  cool: ["", "#ffffff", "#c9d6ff", "#7d9bff", "#1a54ff", "#0b1638"],
  candy: ["", "#ffd6f2", "#f39bdc", "#d06bd8", "#9f7bff", "#1a54ff"],
  sea: ["", "#e8fbf6", "#8fdccf", "#3fb8a4", "#1a54ff", "#0b1638"],
};

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((value) => value / 16 - 0.5));

function hash(x: number, y: number, seed: number) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number, seed: number) {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave++) {
    total += amplitude * noise(x * frequency, y * frequency, seed + octave * 17);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total;
}

// How dense the shape is at a point (0 to 1). u and v run 0 to 1 across the canvas.
function density(variant: Variant, u: number, v: number, seed: number, t: number) {
  const n = fbm(u * 5 + t, v * 5, seed);
  switch (variant) {
    case "cloud": {
      const dx = (u - 0.55) / 0.48;
      const dy = (v - 0.5) / 0.32;
      const body = 1 - Math.sqrt(dx * dx + dy * dy);
      return Math.max(0, Math.min(1, body * 1.6 + (n - 0.5) * 1.4));
    }
    case "ridge": {
      const top = 0.35 + (fbm(u * 3 + t * 0.5, 0.3, seed) - 0.5) * 0.7;
      return Math.max(0, Math.min(1, (v - top) * 2.4 + (n - 0.5) * 0.9));
    }
    case "mountain": {
      const peak = 1 - Math.abs(u - 0.5) * 1.6;
      const top = 0.95 - peak * 0.75 + (fbm(u * 4 + t * 0.3, 0.7, seed) - 0.5) * 0.35;
      return Math.max(0, Math.min(1, (v - top) * 2.2 + (n - 0.5) * 0.8));
    }
    case "band": {
      const centre = 0.5 + Math.sin(u * 3 + seed) * 0.15;
      const body = 1 - Math.abs(v - centre) / 0.4;
      return Math.max(0, Math.min(1, body * 1.5 + (n - 0.5) * 1.2));
    }
  }
}

export function DitherField({
  variant = "cloud",
  palette = "dawn",
  pixel = 6,
  seed = 7,
  animate = false,
  className = "",
}: {
  variant?: Variant;
  palette?: keyof typeof PALETTES;
  pixel?: number;
  seed?: number;
  animate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const colors = PALETTES[palette];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let t = 0;
    let last = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const cols = Math.max(1, Math.floor(rect.width / pixel));
      const rows = Math.max(1, Math.floor(rect.height / pixel));
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, cols, rows);
      const levels = colors.length - 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const d = density(variant, x / cols, y / rows, seed, t);
          if (d <= 0.02) continue;
          const level = Math.round(d * levels + BAYER[y % 4][x % 4] * 1.6);
          const index = Math.max(0, Math.min(levels, level));
          if (index === 0) continue;
          ctx.fillStyle = colors[index];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    const loop = (time: number) => {
      if (time - last > 90) {
        t += 0.012;
        last = time;
        draw();
      }
      frame = requestAnimationFrame(loop);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    if (animate && !reduce) frame = requestAnimationFrame(loop);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [variant, palette, pixel, seed, animate]);

  return <canvas ref={ref} aria-hidden className={`[image-rendering:pixelated] ${className}`} />;
}

// A word drawn as a grid of dots, for the footer.
export function DotWordmark({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Render the word once, off screen, then sample it on a grid.
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const offCtx = off.getContext("2d");
      if (!offCtx) return;
      const family = getComputedStyle(document.body).fontFamily;
      let size = canvas.height * 0.95;
      offCtx.font = `600 ${size}px ${family}`;
      const width = offCtx.measureText(text).width;
      if (width > canvas.width * 0.98) size *= (canvas.width * 0.98) / width;
      offCtx.font = `600 ${size}px ${family}`;
      offCtx.textBaseline = "middle";
      offCtx.fillStyle = "#fff";
      offCtx.fillText(text, (canvas.width - offCtx.measureText(text).width) / 2, canvas.height * 0.52);
      const pixels = offCtx.getImageData(0, 0, off.width, off.height).data;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gap = Math.max(6, Math.round(canvas.height / 26));
      for (let y = gap / 2; y < canvas.height; y += gap) {
        for (let x = gap / 2; x < canvas.width; x += gap) {
          const alpha = pixels[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] / 255;
          const r = hash(Math.floor(x), Math.floor(y), 3);
          if (alpha > 0.4) {
            ctx.fillStyle = r > 0.92 ? "#f6a9df" : r > 0.8 ? "#c9d6ff" : "#ffffff";
            ctx.beginPath();
            ctx.arc(x, y, gap * 0.36, 0, Math.PI * 2);
            ctx.fill();
          } else if (r > 0.985) {
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.fillRect(x - 1, y - 1, 2, 2);
          }
        }
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [text]);

  return <canvas ref={ref} aria-label={text} role="img" className={className} />;
}
