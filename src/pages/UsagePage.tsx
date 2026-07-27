import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPaymentsConfig } from "../api/client";
import { ApiError } from "../api/types";
import type { PaymentsConfig } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { MetricRow, ProgressBar } from "../components/metrics";
import { ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNumber, formatPercent, formatUsd, lifetimeUsedPercent } from "../lib/format";

export function UsagePage() {
  const { apiKey, status, refreshStatus, logout, loading } = useAuth();
  const [config, setConfig] = useState<PaymentsConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const [, cfg] = await Promise.all([refreshStatus(), fetchPaymentsConfig(apiKey!)]);
        if (!cancelled) setConfig(cfg);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "unauthorized") {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load usage.");
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiKey, refreshStatus, logout]);

  const cost = status?.usage.cost;
  const tokens = status?.usage.tokens;
  const lifetime = config?.lifetimeQuota;
  const usedPct = lifetimeUsedPercent(lifetime?.spentUsd, lifetime?.limitUsd);

  return (
    <div>
      <PageHeader
        title="Usage"
        description="Saldo lifetime, budget periode, dan token yang sudah kamu bakar."
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => {
              setInitializing(true);
              void Promise.all([refreshStatus(), fetchPaymentsConfig(apiKey!)])
                .then(([, cfg]) => setConfig(cfg))
                .catch((err) => {
                  if (err instanceof ApiError && err.code === "unauthorized") logout();
                  else setError(err instanceof ApiError ? err.message : "Failed to refresh.");
                })
                .finally(() => setInitializing(false));
            }}
          >
            Refresh
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {initializing && !status && !config ? <LoadingBlock label="Reading your ledger…" /> : null}

      {(status || config) && (
        <div className="grid gap-5">
          <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-medium text-foreground">Lifetime balance</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary">
                    From top-ups · does not reset
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/payments">Top up</Link>
                </Button>
              </div>

              {lifetime?.limitUsd == null ? (
                <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No lifetime quota on this key yet.</p>
                  <Link to="/payments" className="mt-3 inline-block text-sm text-primary hover:underline">
                    Add balance on Top up →
                  </Link>
                </div>
              ) : (
                <>
                  <p className="mt-6 font-display text-4xl font-medium text-foreground">
                    {formatUsd(lifetime.remainingUsd)}
                    <span className="ml-2 text-base font-normal text-muted-foreground">remaining</span>
                  </p>
                  <ProgressBar percent={usedPct} />
                  <dl className="mt-4">
                    <MetricRow label="Limit" value={formatUsd(lifetime.limitUsd)} />
                    <MetricRow label="Spent" value={formatUsd(lifetime.spentUsd)} />
                    <MetricRow label="Used %" value={formatPercent(usedPct)} emphasize />
                  </dl>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="scale-in scale-in-delay-2 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-end justify-between gap-3">
                  <h3 className="font-display text-2xl font-medium text-foreground">Period budget</h3>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                    {cost?.period || "period"}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Separate from lifetime top-up balance (resets with period).
                </p>
                <dl className="mt-6">
                  <MetricRow label="Used" value={formatUsd(cost?.usedUsd, 4)} emphasize />
                  <MetricRow label="Limit" value={formatUsd(cost?.limitUsd, 4)} />
                  <MetricRow label="Remaining" value={formatUsd(cost?.remainingUsd, 4)} />
                  <MetricRow
                    label="Used %"
                    value={cost?.usedPercent != null ? formatPercent(cost.usedPercent) : "—"}
                  />
                  <MetricRow label="Resets" value={formatDate(cost?.resetAt)} />
                </dl>
              </CardContent>
            </Card>

            <Card className="scale-in scale-in-delay-3 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-end justify-between gap-3">
                  <h3 className="font-display text-2xl font-medium text-foreground">Tokens</h3>
                  <p className="max-w-[10rem] truncate text-right text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Since {formatDate(tokens?.periodStartAt)}
                  </p>
                </div>
                <dl className="mt-6">
                  <MetricRow label="Input" value={formatNumber(tokens?.inputTokens)} />
                  <MetricRow label="Output" value={formatNumber(tokens?.outputTokens)} />
                  <MetricRow label="Cache read" value={formatNumber(tokens?.cacheReadTokens)} />
                  <MetricRow label="Cache write" value={formatNumber(tokens?.cacheCreationTokens)} />
                  <MetricRow label="Reasoning" value={formatNumber(tokens?.reasoningTokens)} />
                  <MetricRow label="Total" value={formatNumber(tokens?.totalTokens)} emphasize />
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
