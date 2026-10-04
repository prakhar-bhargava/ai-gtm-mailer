import pipeline from "@/config/pipeline.json";
import { cacheGet, cacheSet } from "@/lib/cache";
import { hostOf, trail } from "@/lib/trail";
import { recordFreeRequest } from "@/lib/usage";

// Every outside call to a free source goes through here: a timeout, one retry on 429, and the local cache.
// Free sources are not rate-limited by this app (only model calls are); each one is counted for the usage meter.
// These are free, keyless sources, so they don't wait for the model's rate limiter.
// Errors carry the HTTP status so callers can tell "not found" from "broken".
export class SourceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

const USER_AGENT = "Mozilla/5.0 (compatible; prospect-research-demo/0.1)";

export async function fetchText(url: string, options: { cacheKey?: string; accept?: string } = {}): Promise<string> {
  const host = hostOf(url);
  if (options.cacheKey) {
    const cached = cacheGet(options.cacheKey);
    if (cached !== null) {
      recordFreeRequest(host, true);
      trail(`Using a saved copy from ${host}, no request needed`);
      return cached;
    }
  }

  for (let attempt = 0; ; attempt++) {
    recordFreeRequest(host, false);
    trail(attempt === 0 ? `Asking ${host}` : `Asking ${host} again after a rate limit`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), pipeline.sourceTimeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: options.accept ?? "*/*" },
      });
      if (response.status === 429 && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, pipeline.sourceRetryMs));
        continue;
      }
      if (!response.ok) {
        trail(`${host} answered ${response.status}`);
        throw new SourceError(`the site answered with status ${response.status}`, response.status);
      }
      const text = await response.text();
      trail(`${host} answered with ${Math.round(text.length / 1024) || "under 1"} KB`);
      if (options.cacheKey) cacheSet(options.cacheKey, text);
      return text;
    } catch (error) {
      if (error instanceof SourceError) throw error;
      if (controller.signal.aborted) {
        throw new SourceError(`no answer within ${pipeline.sourceTimeoutMs / 1000} seconds`);
      }
      throw new SourceError("the request failed");
    } finally {
      clearTimeout(timer);
    }
  }
}
