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
  if (limitUsd == null || limitUsd <= 0 || spentUsd == null || Number.isNaN(spentUsd)) return null;
  return Math.min(100, Math.max(0, (spentUsd / limitUsd) * 100));
}
