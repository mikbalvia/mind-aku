import { Link } from "react-router-dom";
import type {
  CustomerUsageLimits,
  PaygBalance,
  UsageLimitWindow,
} from "../api/types";
import { MetricRow, ProgressBar, SummaryCard } from "./metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent, formatResetIn, formatUsd, usedPercent } from "../lib/format";

type Variant = "compact" | "detailed";

const SUB_WINDOWS: Array<{
  key: "fiveHour" | "daily" | "weekly";
  label: string;
}> = [
  { key: "fiveHour", label: "Limit 5 jam" },
  { key: "daily", label: "Limit harian" },
  { key: "weekly", label: "Limit mingguan" },
];

function activeSubWindows(limits: CustomerUsageLimits | null | undefined) {
  if (!limits) return [];
  return SUB_WINDOWS.flatMap((item) => {
    const window = limits[item.key];
    return window ? [{ ...item, window }] : [];
  });
}

function primaryExceededHint(limits: CustomerUsageLimits | null | undefined): string | null {
  if (!limits?.enabled) return null;
  for (const item of activeSubWindows(limits)) {
    if (!item.window.exceeded) continue;
    const reset = formatResetIn(item.window.resetAt);
    return reset
      ? `${item.label} tercapai — reset ${reset}.`
      : `${item.label} tercapai.`;
  }
  if (limits.lifetime?.exceeded) {
    return "Lifetime cap habis — top up untuk lanjut (tidak reset otomatis).";
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
  const pct = usedPercent(window.spentUsd, window.limitUsd);
  return (
    <>
      <ProgressBar percent={pct} />
      {detailed ? (
        <dl className="mt-3">
          <MetricRow label="Limit" value={formatUsd(window.limitUsd)} />
          <MetricRow label="Spent" value={formatUsd(window.spentUsd)} />
          <MetricRow label="Sisa" value={formatUsd(window.remainingUsd)} />
          <MetricRow label="Used %" value={formatPercent(pct)} emphasize />
          <MetricRow
            label="Reset"
            value={window.resetAt ? formatResetIn(window.resetAt) ?? "—" : "Tidak reset"}
          />
        </dl>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Spent {formatUsd(window.spentUsd)} · {pct != null ? `${pct.toFixed(1)}%` : "—"}
          {window.resetAt ? ` · reset ${formatResetIn(window.resetAt)}` : ""}
        </p>
      )}
    </>
  );
}

/**
 * PaygCard renders the "Saldo top up" card from the per-key pay-as-you-go pool.
 * Subscription keys (UsageLimits configured) report payg.enabled=false, in which
 * case this card hides entirely. Unlimited keys show "Unlimited" instead of a
 * numeric remaining balance.
 */
function PaygCard({
  payg,
  compact,
  topUpAllowed,
}: {
  payg: PaygBalance | null | undefined;
  compact: boolean;
  topUpAllowed: boolean;
}) {
  const hasPayg = payg != null;
  const unlimited = payg?.unlimited ?? false;
  const remaining = payg?.remainingUsd ?? null;
  const spent = payg?.spentUsd ?? 0;
  const exhausted = hasPayg && !unlimited && remaining != null && remaining <= 0;

  if (compact) {
    return (
      <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Saldo top up
            </p>
            {topUpAllowed && !unlimited ? (
              <Link
                to="/payments"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
              >
                Top up →
              </Link>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl",
              exhausted ? "text-destructive" : "text-foreground"
            )}
          >
            {unlimited ? "Unlimited" : hasPayg ? formatUsd(remaining) : "—"}
            {!unlimited ? (
              <span className="ml-2 text-base font-normal text-muted-foreground">sisa</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {unlimited
              ? "Pay as you go tanpa batas."
              : hasPayg
                ? `Spent ${formatUsd(spent)} sepanjang masa · pay as you go · tidak reset.`
                : "Saldo pay as you go dikelola admin — hubungi admin untuk cek sisa."}
          </p>
          {exhausted ? (
            <p className="mt-3 text-sm text-destructive">
              Saldo top up habis — top up untuk lanjut (tidak ada reset window).
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-medium text-foreground">Saldo top up</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary">
              {hasPayg ? "Pay as you go · tidak reset" : "Dikelola admin"}
            </p>
          </div>
          {topUpAllowed && !unlimited ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/payments">Top up</Link>
            </Button>
          ) : null}
        </div>

        {unlimited ? (
          <p className="mt-6 font-display text-4xl font-medium text-foreground">Unlimited</p>
        ) : hasPayg ? (
          <>
            <p
              className={cn(
                "mt-6 font-display text-4xl font-medium",
                remaining != null && remaining <= 0
                  ? "text-destructive"
                  : "text-foreground"
              )}
            >
              {formatUsd(remaining)}
              <span className="ml-2 text-base font-normal text-muted-foreground">sisa</span>
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Spent {formatUsd(spent)} sepanjang masa · top-up akan menambah saldo di
              sini.
            </p>
            {remaining != null && remaining <= 0 ? (
              <p className="mt-3 text-sm text-destructive">
                Saldo top up habis — top up untuk lanjut (tidak ada reset window).
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Saldo pay as you go dikelola admin — hubungi admin untuk cek sisa, atau buka
            halaman Top up untuk menambah.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function UsageLimitsPanel({
  paygBalance,
  usageLimits,
  topUpAllowed = true,
  variant = "detailed",
  className,
}: {
  /** Per-key payg pool, the source of the "Saldo top up" card. */
  paygBalance?: PaygBalance | null;
  /** Live USD windows from API Manager enforcement (optional for older API). */
  usageLimits?: CustomerUsageLimits | null;
  /** Top-up eligibility (subscription keys receive false). */
  topUpAllowed?: boolean;
  variant?: Variant;
  className?: string;
}) {
  const subs = activeSubWindows(usageLimits);
  const hasSubs = subs.length > 0;
  const enabled = usageLimits?.enabled ?? hasSubs;
  const exceededHint = primaryExceededHint(usageLimits);
  const compact = variant === "compact";
  // The "Saldo top up" card is always visible — admin can add saldo manually
  // even when the API key has no subscription windows. Hide only when the
  // backend explicitly reports `unlimited: true`. When `paygBalance` is
  // absent (older backend) we still render a hint card so users know saldo
  // is admin-managed.
  const showPayg = paygBalance == null ? true : !paygBalance.unlimited;
  const gridCols = compact ? "md:grid-cols-2" : "gap-5";
  return (
    <div className={cn("grid gap-4", gridCols, className)}>
      {usageLimits && !usageLimits.enabled && hasSubs ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 md:col-span-2">
          Limit terkonfigurasi tetapi belum diaktifkan admin (`usage limit` off). Belum di-enforce.
        </div>
      ) : null}

      {exceededHint && enabled ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground md:col-span-2">
          {exceededHint}
        </div>
      ) : null}

      {showPayg ? (
        <PaygCard payg={paygBalance} compact={compact} topUpAllowed={topUpAllowed} />
      ) : null}

      {compact ? (
        <SummaryCard
          className="scale-in scale-in-delay-2"
          label="Limit subscription"
          value={
            hasSubs
              ? `${subs.filter((s) => !s.window.exceeded).length}/${subs.length} aktif`
              : "—"
          }
          hint={
            hasSubs
              ? "Rate cap paket · reset per window"
              : "Belum ada limit subscription pada key ini."
          }
        >
          {hasSubs ? (
            <ul className="mt-4 space-y-3">
              {subs.map(({ key, label, window }) => {
                const pct = usedPercent(window.spentUsd, window.limitUsd);
                return (
                  <li key={key} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-muted-foreground",
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
                    {enabled ? <ProgressBar percent={pct} /> : null}
                    {window.resetAt ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Reset {formatResetIn(window.resetAt)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Link to="/subscription" className="mt-4 inline-block text-sm text-primary hover:underline">
              Lihat paket Subscription →
            </Link>
          )}
        </SummaryCard>
      ) : (
        <Card className="scale-in scale-in-delay-2 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-medium text-foreground">
                  Limit subscription
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary">
                  5 jam / harian / mingguan · terpisah dari top up
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/subscription">Paket</Link>
              </Button>
            </div>

            {!hasSubs ? (
              <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada limit subscription (5 jam / harian / mingguan) pada key ini.
                </p>
                <Link
                  to="/subscription"
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  Lihat paket Subscription →
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {subs.map(({ key, label, window }) => (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border border-border p-4",
                      window.exceeded && enabled && "border-destructive/40 bg-destructive/5"
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-medium text-foreground">{label}</h4>
                      <p
                        className={cn(
                          "font-display text-2xl tabular-nums",
                          window.exceeded && enabled ? "text-destructive" : "text-foreground"
                        )}
                      >
                        {formatUsd(window.remainingUsd)}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">sisa</span>
                      </p>
                    </div>
                    {enabled ? <WindowRows window={window} detailed /> : null}
                    {window.exceeded && enabled && paygBalance?.enabled && !paygBalance.unlimited &&
                      paygBalance.remainingUsd != null && paygBalance.remainingUsd > 0 ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Saldo top up masih ada, tapi {label.toLowerCase()} habis — tunggu reset
                        window.
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
