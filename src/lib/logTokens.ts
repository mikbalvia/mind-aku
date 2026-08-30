import type { CallLog } from "../api/types";

export function logCacheTokens(log: CallLog): { read: number; write: number } {
  return {
    read: log.tokens.cacheRead ?? log.spend?.tokens.cacheRead ?? 0,
    write: log.tokens.cacheWrite ?? log.spend?.tokens.cacheCreation ?? 0,
  };
}
