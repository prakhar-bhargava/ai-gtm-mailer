import { AsyncLocalStorage } from "node:async_hooks";
import type { StagePayload } from "@/lib/types";

// Lets code deep inside a stage (the rate limiter, the HTTP client, the model client) report
// what it is doing, without passing a logger through every function. Each stage gets its own log,
// so parallel stages never mix their notes.
type Log = (message: string, payload?: StagePayload) => void;

const storage = new AsyncLocalStorage<Log>();

export function withTrail<T>(log: Log, work: () => Promise<T>): Promise<T> {
  return storage.run(log, work);
}

export function trail(message: string) {
  storage.getStore()?.(message);
}

// Like trail, with data attached: a page the crawler read, or things found on it. The run page shows these live.
export function report(message: string, payload: StagePayload) {
  storage.getStore()?.(message, payload);
}

// A short host name for a URL, so the trail reads "Asking boards-api.greenhouse.io".
export function hostOf(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.host === "r.jina.ai") {
      const inner = url.slice(url.indexOf("http", "https://r.jina.ai/".length));
      return `reader for ${new URL(inner).host}`;
    }
    return parsed.host;
  } catch {
    return "a source";
  }
}
