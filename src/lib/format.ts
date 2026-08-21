import i18n from "i18next";
import { toIntlLocale } from "@/i18n/languages";

function activeLocale(): string {
  return toIntlLocale(i18n.resolvedLanguage || i18n.language);
}

/** Label for payment FX from live `idrPerUsd` (API `/api/v1/me/payments/config`). */
export function formatIdrPerUsdRate(idrPerUsd: number): string {
  return i18n.t("1 USD = {{rate}} IDR", {
    rate: idrPerUsd.toLocaleString(activeLocale()),
  });
}

export function formatIdr(value: number | null | undefined, fractionDigits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(activeLocale(), {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Convert USD (e.g. per 1M tokens) to IDR using live payment FX. */
export function usdToIdr(usd: number | null | undefined, idrPerUsd: number): number | null {
  if (usd == null || Number.isNaN(usd) || !(idrPerUsd > 0)) return null;
  return usd * idrPerUsd;
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
  return value.toLocaleString(activeLocale());
}

/** Compact token counts for customer dashboards, e.g. 87 juta / 87M. */
export function formatTokenCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const locale = activeLocale();
  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    const n = millions.toLocaleString(locale, {
      maximumFractionDigits: millions >= 10 ? 0 : 1,
    });
    return i18n.t("{{n}}M", { n });
  }
  if (abs >= 1_000) {
    const n = (value / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 });
    return i18n.t("{{n}}K", { n });
  }
  return value.toLocaleString(locale);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(activeLocale());
}

/** Active-period label: date, "No expiry", or "Expired". */
export function formatPaygActiveUntil(
  active: boolean | undefined,
  activeUntil: string | null | undefined
): string {
  if (activeUntil) {
    const label = formatDate(activeUntil);
    return active === false ? i18n.t("Expired ({{label}})", { label }) : label;
  }
  if (active === false) return i18n.t("Expired");
  return i18n.t("No expiry");
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
  if (deltaMs <= 0) return i18n.t("now");

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
