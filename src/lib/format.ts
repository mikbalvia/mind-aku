/** Label for payment FX from live `idrPerUsd` (API `/api/v1/me/payments/config`). */
export function formatIdrPerUsdRate(idrPerUsd: number): string {
  return `1 USD = ${idrPerUsd.toLocaleString("id-ID")} IDR`;
}

export function formatUsd(value: number | null | undefined, fractionDigits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function lifetimeUsedPercent(
  spentUsd: number | null | undefined,
  limitUsd: number | null | undefined
): number | null {
  return usedPercent(spentUsd, limitUsd);
}

/** Spent/limit → 0–100, or null when limit is unset. */
export function usedPercent(
  spentUsd: number | null | undefined,
  limitUsd: number | null | undefined
): number | null {
  if (limitUsd == null || limitUsd <= 0 || spentUsd == null || Number.isNaN(spentUsd)) return null;
  return Math.min(100, Math.max(0, (spentUsd / limitUsd) * 100));
}

/** Human reset countdown, e.g. "2h 15m" / "now" / null when unset. */
export function formatResetIn(resetAt: string | null | undefined, now = Date.now()): string | null {
  if (!resetAt) return null;
  const resetMs = Date.parse(resetAt);
  if (!Number.isFinite(resetMs)) return null;

  const deltaMs = resetMs - now;
  if (deltaMs <= 0) return "sekarang";

  const minuteMs = 60_000;
  const totalMinutes = Math.max(1, Math.ceil(deltaMs / minuteMs));
  const dayMinutes = 24 * 60;
  const days = Math.floor(totalMinutes / dayMinutes);
  const hours = Math.floor((totalMinutes % dayMinutes) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
