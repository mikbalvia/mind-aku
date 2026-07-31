/** Safe relative in-app path for post-login redirects. */
export function safeInternalPath(path: unknown, fallback = "/console"): string {
  if (typeof path !== "string" || !path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("://") || path.includes("\\") || path.includes("@")) return fallback;
  return path;
}

const ALLOWED_PAYMENT_HOST_SUFFIXES = [
  "sumopod.com",
  // SumoPod managed checkout (actual payment_link_url host in production)
  "pymnt.app",
] as const;

/** Only allow HTTPS checkout links on known SumoPod / checkout hosts. */
export function isAllowedPaymentCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_PAYMENT_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}
