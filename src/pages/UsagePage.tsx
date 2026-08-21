import { useEffect, useState } from "react";
import { fetchPaymentsConfig } from "../api/client";
import { ApiError } from "../api/types";
import type { PaymentsConfig } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { MetricRow } from "../components/metrics";
import { UsageLimitsPanel } from "../components/UsageLimitsPanel";
import { ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNumber } from "../lib/format";
import { useTranslation } from "react-i18next";

export function UsagePage() {
  const { t } = useTranslation();
  const { apiKey, status, refreshStatus, loading } = useAuth();
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
        setError(err instanceof ApiError ? err.message : t("Failed to load usage."));
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiKey, refreshStatus]);

  const tokens = status?.usage.tokens;

  return (
    <div>
      <PageHeader
        title={t("Usage")}
        description={t("Pay-as-you-go balance and token usage.")}
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
                  setError(err instanceof ApiError ? err.message : t("Failed to refresh usage."));
                })
                .finally(() => setInitializing(false));
            }}
          >
            {t("Refresh")}
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {initializing && !status && !config ? <LoadingBlock label={t("Reading your ledger…")} /> : null}

      {(status || config) && (
        <div className="grid gap-5">
          <UsageLimitsPanel
            variant="detailed"
            paygBalance={config?.paygBalance}
            tokenPackage={config?.tokenPackage ?? status?.usage.tokenPackage}
            usageLimits={config?.usageLimits}
            topUpAllowed={config?.topUpAllowed ?? false}
            active={config?.active}
            activeUntil={config?.activeUntil}
            activeUnitIdr={config?.activeUnitIdr}
            activePeriodDays={config?.activePeriodDays}
          />

          <Card className="scale-in scale-in-delay-2 border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-end justify-between gap-3">
                <h3 className="font-heading text-2xl font-medium text-foreground">{t("Tokens")}</h3>
                <p className="max-w-[10rem] truncate text-right text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Since {formatDate(tokens?.periodStartAt)}
                </p>
              </div>
              <dl className="mt-6">
                <MetricRow label={t("Input")} value={formatNumber(tokens?.inputTokens)} />
                <MetricRow label={t("Output")} value={formatNumber(tokens?.outputTokens)} />
                <MetricRow label={t("Cache read")} value={formatNumber(tokens?.cacheReadTokens)} />
                <MetricRow label={t("Cache write")} value={formatNumber(tokens?.cacheCreationTokens)} />
                <MetricRow label={t("Reasoning")} value={formatNumber(tokens?.reasoningTokens)} />
                <MetricRow label={t("Total")} value={formatNumber(tokens?.totalTokens)} emphasize />
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
