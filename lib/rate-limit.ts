import pipeline from "@/config/pipeline.json";
import { trail } from "@/lib/trail";

// The limiter for model calls (the only paid, quota-bound requests). Free sources don't use it.
// At most maxRequestsPerMinute in any 60-second window. Cache hits never reach this.
const WINDOW_MS = 60_000;

const globalForLimiter = globalThis as typeof globalThis & { requestTimes?: number[] };
const times = (globalForLimiter.requestTimes ??= []);

export async function takeSlot(): Promise<void> {
  let announced = false;
  for (;;) {
    const now = Date.now();
    while (times.length && now - times[0] >= WINDOW_MS) times.shift();
    if (times.length < pipeline.maxRequestsPerMinute) {
      times.push(now);
      return;
    }
    // Wait until the oldest request leaves the window. Check again afterwards, since others may be waiting too.
    const waitMs = times[0] + WINDOW_MS - now + 50;
    if (!announced) {
      trail(
        `Waiting for a free request slot (limit ${pipeline.maxRequestsPerMinute} a minute). Continuing in about ${Math.ceil(waitMs / 1000)} s`,
      );
      announced = true;
    }
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}
