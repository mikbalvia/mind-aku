import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type {
  CustomerUsageLimits,
  PaygBalance,
  TokenPackage,
  UsageLimitWindow,
} from "../api/types";
import { MetricRow, ProgressBar, SummaryCard } from "./metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatIdr,
  formatPercent,
  formatPaygActiveUntil,
  formatResetIn,
  formatTokenCount,
  formatUsd,
  usedPercent,
} from "../lib/format";
import { SUBSCRIPTION_PAGE_ENABLED } from "../config";

type Variant = "compact" | "detailed";

const SUB_WINDOW_KEYS = ["fiveHour", "daily", "weekly"] as const;

function subWindowLabel(
  key: (typeof SUB_WINDOW_KEYS)[number],
  t: TFunction
): string {
  if (key === "fiveHour") return t("5-hour limit");
  if (key === "daily") return t("Daily limit");
  return t("Weekly limit");
}

function activeSubWindows(
  limits: CustomerUsageLimits | null | undefined,
  t: TFunction
) {
  if (!limits) return [];
  return SUB_WINDOW_KEYS.flatMap((key) => {
    const window = limits[key];
    return window ? [{ key, label: subWindowLabel(key, t), window }] : [];
  });
}

function primaryExceededHint(
  limits: CustomerUsageLimits | null | undefined,
  t: TFunction
): string | null {
  if (!limits?.enabled) return null;
  for (const item of activeSubWindows(limits, t)) {
    if (!item.window.exceeded) continue;
    const reset = formatResetIn(item.window.resetAt);
    return reset
      ? t("{{label}} reached — resets {{reset}}.", { label: item.label, reset })
      : t("{{label}} reached.", { label: item.label });
  }
  if (limits.lifetime?.exceeded) {
    return t("Lifetime cap exhausted — top up to continue (does not reset automatically).");
  }
  return null;
}

function WindowRows({
  window,
  detailed,
}: {
  window: UsageLimitWindow;
  detailed: boolean;
}) {
  const { t } = useTranslation();
  const pct = usedPercent(window.spentUsd, window.limitUsd);
  return (
    <div className="space-y-3">
      <ProgressBar percent={pct} />
      {detailed ? (
        <dl className="space-y-0.5">
          <MetricRow label={t("Limit")} value={formatUsd(window.limitUsd)} />
          <MetricRow label={t("Spent")} value={formatUsd(window.spentUsd)} />
          <MetricRow label={t("Left")} value={formatUsd(window.remainingUsd)} />
          <MetricRow label={t("Used %")} value={formatPercent(pct)} emphasize />
          <MetricRow
            label={t("Reset")}
            value={window.resetAt ? formatResetIn(window.resetAt) ?? "—" : t("No reset")}
          />
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("Spent {{spent}} · {{pct}}", {
            spent: formatUsd(window.spentUsd),
            pct: pct != null ? `${pct.toFixed(1)}%` : "—",
          })}
          {window.resetAt
            ? t(" · reset {{reset}}", { reset: formatResetIn(window.resetAt) ?? "" })
            : ""}
        </p>
      )}
    </div>
  );
}

function PaygCard({
  payg,
  compact,
  topUpAllowed,
  active,
  activeUntil,
  activeUnitIdr = 100_000,
}: {
  payg: PaygBalance | null | undefined;
  compact: boolean;
  topUpAllowed: boolean;
  active?: boolean;
  activeUntil?: string | null;
  activeUnitIdr?: number;
}) {
  const { t } = useTranslation();
  const hasPayg = payg != null;
  const unlimited = payg?.unlimited ?? false;
  const remaining = payg?.remainingUsd ?? null;
  const spent = payg?.spentUsd ?? 0;
  const exhausted = hasPayg && !unlimited && remaining != null && remaining <= 0;

  if (compact) {
    return (
      <Card className="scale-in scale-in-delay-1">
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t("Top-up balance")}
            </p>
            {topUpAllowed && !unlimited ? (
              <Link
                to="/payments"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
              >
                {t("Top up →")}
              </Link>
            ) : null}
          </div>
          <p
            className={cn(
              "font-heading text-3xl font-semibold tracking-tight md:text-4xl",
              exhausted ? "text-destructive" : "text-foreground"
            )}
          >
            {unlimited ? t("Unlimited") : hasPayg ? formatUsd(remaining) : "—"}
            {!unlimited ? (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {t("left")}
              </span>
            ) : null}
          </p>
          <p className="text-sm text-muted-foreground">
            {unlimited
              ? t("Unlimited pay as you go.")
              : hasPayg
                ? t("Spent {{spent}} lifetime · pay as you go · balance never expires.", {
                    spent: formatUsd(spent),
                  })
                : t(
                    "Pay-as-you-go balance is managed by admin — contact admin to check remaining."
                  )}
          </p>
          {active != null || activeUntil ? (
            <p className="text-xs text-muted-foreground">
              {t("Active period: {{label}}", {
                label: formatPaygActiveUntil(active, activeUntil),
              })}
            </p>
          ) : null}
          {exhausted ? (
            <p className="text-sm text-destructive">
              {t("Top-up balance exhausted — top up to continue (no reset window).")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="scale-in scale-in-delay-1">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-heading text-2xl font-semibold text-foreground">
              {t("Top-up balance")}
            </h3>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
              {hasPayg ? t("Pay as you go · never resets") : t("Managed by admin")}
            </p>
          </div>
          {topUpAllowed && !unlimited ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/payments">{t("Top up")}</Link>
            </Button>
          ) : null}
        </div>

        {unlimited ? (
          <p className="font-heading text-4xl font-semibold text-foreground">{t("Unlimited")}</p>
        ) : hasPayg ? (
          <>
            <p
              className={cn(
                "font-heading text-4xl font-semibold",
                remaining != null && remaining <= 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {formatUsd(remaining)}
              <span className="ml-2 text-base font-normal text-muted-foreground">{t("left")}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "Spent {{spent}} lifetime · top-ups add balance. Full multiples of {{unit}} extend the active period. Unused balance never expires.",
                { spent: formatUsd(spent), unit: formatIdr(activeUnitIdr) }
              )}
            </p>
            {active != null || activeUntil ? (
              <p className="text-sm text-muted-foreground">
                {t("Active period: {{label}}", {
                  label: formatPaygActiveUntil(active, activeUntil),
                })}
              </p>
            ) : null}
            {remaining != null && remaining <= 0 ? (
              <p className="text-sm text-destructive">
                {t("Top-up balance exhausted — top up to continue (no reset window).")}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t(
              "Pay-as-you-go balance is managed by admin — contact admin to check remaining, or open Top up to add more."
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TokenPackageCard({ pack, compact }: { pack: TokenPackage; compact: boolean }) {
  const { t } = useTranslation();
  const remaining = pack.remainingTokens;
  const total = pack.totalTokens;
  const used = pack.usedTokens;
  const exhausted = remaining <= 0;
  const pct = usedPercent(used, total);
  const modelLabel = pack.modelsRestricted ? pack.models.join(", ") : t("All models in group");

  if (compact) {
    return (
      <Card className="scale-in scale-in-delay-1">
        <CardContent className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {t("Token package")}
          </p>
          <p
            className={cn(
              "font-heading text-3xl font-semibold tracking-tight md:text-4xl",
              exhausted ? "text-destructive" : "text-foreground"
            )}
          >
            {formatTokenCount(remaining)}
            <span className="ml-2 text-base font-normal text-muted-foreground">{t("left")}</span>
          </p>
          <ProgressBar percent={pct} />
          <p className="text-sm text-muted-foreground">
            {t("Used {{used}} of {{total}} · {{models}}", {
              used: formatTokenCount(used),
              total: formatTokenCount(total),
              models: modelLabel,
            })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="scale-in scale-in-delay-1">
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-heading text-2xl font-semibold text-foreground">
            {t("Token package")}
          </h3>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
            {t("Input + output + cache = 1")}
          </p>
        </div>
        <p
          className={cn(
            "font-heading text-4xl font-semibold",
            exhausted ? "text-destructive" : "text-foreground"
          )}
        >
          {formatTokenCount(remaining)}
          <span className="ml-2 text-base font-normal text-muted-foreground">{t("left")}</span>
        </p>
        <ProgressBar percent={pct} />
        <dl>
          <MetricRow label={t("Used")} value={formatTokenCount(used)} />
          <MetricRow label={t("Package total")} value={formatTokenCount(total)} />
          <MetricRow label={t("Model")} value={modelLabel} emphasize />
        </dl>
        {exhausted ? (
          <p className="text-sm text-destructive">
            {t(
              "Token package exhausted. Models on this list will use USD balance if any remains."
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function UsageLimitsPanel({
  paygBalance,
  tokenPackage,
  usageLimits,
  topUpAllowed = true,
  variant = "detailed",
  className,
  active,
  activeUntil,
  activeUnitIdr = 100_000,
  activePeriodDays = 30,
}: {
  paygBalance?: PaygBalance | null;
  tokenPackage?: TokenPackage | null;
  usageLimits?: CustomerUsageLimits | null;
  topUpAllowed?: boolean;
  variant?: Variant;
  className?: string;
  active?: boolean;
  activeUntil?: string | null;
  activeUnitIdr?: number;
  activePeriodDays?: number;
}) {
  const { t } = useTranslation();
  const subs = activeSubWindows(usageLimits, t);
  const hasSubs = subs.length > 0;
  const enabled = usageLimits?.enabled ?? hasSubs;
  const exceededHint = primaryExceededHint(usageLimits, t);
  const compact = variant === "compact";
  const showPayg = paygBalance == null ? true : !paygBalance.unlimited;
  const gridCols = compact && showPayg && hasSubs ? "md:grid-cols-2" : "";

  return (
    <div className={cn("grid gap-6", gridCols, className)}>
      {usageLimits && !usageLimits.enabled && hasSubs ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 md:col-span-2">
          {t(
            "Limits are configured but not activated by admin (`usage limit` off). Not enforced yet."
          )}
        </div>
      ) : null}

      {exceededHint && enabled ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground md:col-span-2">
          {exceededHint}
        </div>
      ) : null}

      {active === false ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground md:col-span-2">
          {t(
            "Active period expired — API cannot be used. Top up at least {{unit}} to extend {{days}} days. Amounts below that only add balance.",
            { unit: formatIdr(activeUnitIdr), days: String(activePeriodDays) }
          )}{" "}
          {topUpAllowed ? (
            <Link to="/payments" className="font-semibold text-primary hover:underline">
              {t("Top up →")}
            </Link>
          ) : null}
        </div>
      ) : null}

      {showPayg ? (
        <PaygCard
          payg={paygBalance}
          compact={compact}
          topUpAllowed={topUpAllowed}
          active={active}
          activeUntil={activeUntil}
          activeUnitIdr={activeUnitIdr}
        />
      ) : null}

      {tokenPackage?.enabled ? <TokenPackageCard pack={tokenPackage} compact={compact} /> : null}

      {hasSubs && compact ? (
        <SummaryCard
          className="scale-in scale-in-delay-2"
          label={t("Subscription limits")}
          value={t("{{active}}/{{total}} active", {
            active: String(subs.filter((s) => !s.window.exceeded).length),
            total: String(subs.length),
          })}
          hint={t("Package rate cap · resets per window")}
        >
          <ul className="space-y-4">
            {subs.map(({ key, label, window }) => {
              const pct = usedPercent(window.spentUsd, window.limitUsd);
              return (
                <li key={key} className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-foreground",
                        window.exceeded && enabled && "text-destructive"
                      )}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums text-foreground",
                        window.exceeded && enabled && "text-destructive"
                      )}
                    >
                      {formatUsd(window.remainingUsd)} / {formatUsd(window.limitUsd)}
                    </span>
                  </div>
                  {enabled ? (
                    <ProgressBar
                      percent={pct}
                      className={cn(
                        window.exceeded && "[&_[data-slot=progress-indicator]]:bg-destructive"
                      )}
                    />
                  ) : null}
                  {window.resetAt ? (
                    <p className="text-[11px] text-muted-foreground">
                      {t("Reset {{reset}}", { reset: formatResetIn(window.resetAt) ?? "" })}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </SummaryCard>
      ) : null}

      {hasSubs && !compact ? (
        <Card className="scale-in scale-in-delay-2">
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-heading text-2xl font-semibold text-foreground">
                  {t("Subscription limits")}
                </h3>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
                  {t("5h / daily / weekly · separate from top up")}
                </p>
              </div>
              {SUBSCRIPTION_PAGE_ENABLED ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/subscription">{t("Plans")}</Link>
                </Button>
              ) : null}
            </div>

            <div className="space-y-4">
              {subs.map(({ key, label, window }) => (
                <div
                  key={key}
                  className={cn(
                    "space-y-4 rounded-lg border border-border p-5",
                    window.exceeded && enabled && "border-destructive/40 bg-destructive/5"
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-medium text-foreground">{label}</h4>
                    <p
                      className={cn(
                        "font-heading text-2xl tabular-nums font-semibold",
                        window.exceeded && enabled ? "text-destructive" : "text-foreground"
                      )}
                    >
                      {formatUsd(window.remainingUsd)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {t("left")}
                      </span>
                    </p>
                  </div>
                  {enabled ? <WindowRows window={window} detailed /> : null}
                  {window.exceeded &&
                  enabled &&
                  paygBalance?.enabled &&
                  !paygBalance.unlimited &&
                  paygBalance.remainingUsd != null &&
                  paygBalance.remainingUsd > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Top-up balance remains, but {{label}} is exhausted — wait for the window reset.",
                        { label: label.toLowerCase() }
                      )}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
