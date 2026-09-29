import type { CallLog } from "../api/types";

export function logCacheTokens(log: CallLog): { read: number; write: number } {
  return {
    read: log.tokens.cacheRead ?? log.spend?.tokens.cacheRead ?? 0,
    write: log.tokens.cacheWrite ?? log.spend?.tokens.cacheCreation ?? 0,
  };
}

/** Uncached input tokens for display (prompt − cache read, floored at 0). */
export function logDisplayInputTokens(log: CallLog): number {
  const cacheRead = logCacheTokens(log).read;
  const prompt = log.tokens.in ?? 0;
  return Math.max(0, prompt - cacheRead);
}
