import { AsyncLocalStorage } from "node:async_hooks";
import type { Usage } from "@/lib/types";

// Counts what one run costs: model calls and tokens (the only thing that costs money or quota),
// and the free requests around them (pages read by the crawler, news and job-board requests, cache hits).
// The pipeline wraps a run in withUsage; anything inside can record without passing a counter around.

const storage = new AsyncLocalStorage<Usage>();

export function emptyUsage(): Usage {
  return {
    modelCalls: 0,
    modelCallsSaved: 0,
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    pagesRead: 0,
    pagesFromCache: 0,
    freeRequests: 0,
    freeRequestsFromCache: 0,
    hosts: {},
  };
}

export function withUsage<T>(usage: Usage, work: () => Promise<T>): Promise<T> {
  return storage.run(usage, work);
}

function current(): Usage | undefined {
  return storage.getStore();
}

export function recordModelCall(tokens: { input?: number; output?: number; thinking?: number }) {
  const usage = current();
  if (!usage) return;
  usage.modelCalls++;
  usage.inputTokens += tokens.input ?? 0;
  usage.outputTokens += tokens.output ?? 0;
  usage.thinkingTokens += tokens.thinking ?? 0;
}

// A model answer reused from the cache: no call, no tokens.
export function recordModelCacheHit() {
  const usage = current();
  if (usage) usage.modelCallsSaved++;
}

export function recordPage(fromCache: boolean) {
  const usage = current();
  if (!usage) return;
  if (fromCache) usage.pagesFromCache++;
  else usage.pagesRead++;
}

// A keyless request to a free source (news feed, job board, robots.txt).
export function recordFreeRequest(host: string, fromCache: boolean) {
  const usage = current();
  if (!usage) return;
  if (fromCache) usage.freeRequestsFromCache++;
  else {
    usage.freeRequests++;
    usage.hosts[host] = (usage.hosts[host] ?? 0) + 1;
  }
}

export function snapshotUsage(): Usage | undefined {
  const usage = current();
  return usage ? JSON.parse(JSON.stringify(usage)) : undefined;
}
