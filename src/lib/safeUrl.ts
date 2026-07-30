/** Safe relative in-app path for post-login redirects. */
export function safeInternalPath(path: unknown, fallback = "/console"): string {
  if (typeof path !== "string" || !path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("://") || path.includes("\\") || path.includes("@")) return fallback;
  return path;
}

/** Only allow HTTPS checkout links on known SumoPod hosts. */
export function isAllowedPaymentCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host === "sumopod.com" || host.endsWith(".sumopod.com");
  } catch {
    return false;
  }
}
