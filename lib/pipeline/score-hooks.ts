import rubric from "@/config/rubric.json";
import type { Hook, Signal } from "@/lib/types";
import { sensitiveTopicIn } from "@/lib/pipeline/sensitivity";

export type RawHook = {
  text: string;
  signalIds: string[];
  pain: string;
  whyNow: string;
  relevance: number;
  specificity: number;
  sensitiveReason: string | null;
};

const SENIOR_ROLE = /\b(chief|cfo|cro|coo|vp|vice president|head|director|president|controller)\b/i;

function recencyPoints(publishedAt: string | null, now: number): number {
  if (!publishedAt) return 0;
  const days = (now - Date.parse(publishedAt)) / 86_400_000;
  const band = rubric.recencyBands.find((item) => days <= item.maxDays);
  return band ? band.points : 0;
}

function verifiabilityPoints(signal: Signal): number {
  if (!signal.publishedAt) return rubric.verifiabilityPoints.undated;
  const points = rubric.verifiabilityPoints as Record<string, number>;
  return points[signal.type === "news" ? "news" : signal.type === "job" ? "job" : "company_site"];
}

function authorshipPoints(signal: Signal): number {
  const points = rubric.authorshipPoints as Record<string, number>;
  return points[signal.type === "company_site" ? "company_site" : signal.type === "news" ? "news" : "job"];
}

const clamp = (value: number, max: number) => Math.min(Math.max(Math.round(value), 0), max);

// Scores each hook with the rubric in docs/06. The model gives relevance and specificity;
// code gives recency, verifiability, authorship and seniority, so those can't be talked up.
export function scoreHooks(raw: RawHook[], signals: Signal[], role: string | undefined, now = Date.now()): Hook[] {
  const senior = Boolean(role && SENIOR_ROLE.test(role));
  const hooks = raw.map((item, index): Hook => {
    const cited = signals.filter((signal) => item.signalIds.includes(signal.id));
    const recency = Math.max(0, ...cited.map((signal) => recencyPoints(signal.publishedAt, now)));
    const verifiability = Math.max(0, ...cited.map(verifiabilityPoints));
    const authorship = Math.max(0, ...cited.map(authorshipPoints));
    const seniority = senior ? rubric.seniorityPoints.senior : rubric.seniorityPoints.other;

    const scores = {
      relevance: clamp(item.relevance, rubric.weights.relevance),
      recency: clamp(recency, rubric.weights.recency),
      specificity: clamp(item.specificity, rubric.weights.specificity),
      seniority: clamp(seniority, rubric.weights.seniority),
      verifiability: clamp(verifiability, rubric.weights.verifiability),
      authorship: clamp(authorship, rubric.weights.authorship),
      total: 0,
    };
    scores.total = scores.relevance + scores.recency + scores.specificity + scores.seniority + scores.verifiability + scores.authorship;

    const textToCheck = [item.text, item.pain, item.whyNow, ...cited.map((signal) => signal.claim)].join(" ");
    const blockedReason = item.sensitiveReason ?? (sensitiveTopicIn(textToCheck) ? `mentions a sensitive topic (${sensitiveTopicIn(textToCheck)})` : null);

    return {
      id: `h${index + 1}`,
      text: item.text,
      signalIds: item.signalIds,
      pain: item.pain,
      whyNow: item.whyNow,
      scores,
      blockedReason,
    };
  });

  // Blocked hooks stay on screen, greyed out, but never win.
  return hooks.sort((a, b) => {
    if (Boolean(a.blockedReason) !== Boolean(b.blockedReason)) return a.blockedReason ? 1 : -1;
    return b.scores.total - a.scores.total;
  });
}
