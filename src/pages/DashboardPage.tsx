import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLogs, fetchMeStatus, fetchPayments, fetchPaymentsConfig } from "../api/client";
import { ApiError } from "../api/types";
import type { CallLog, MeStatus, PaymentHistoryItem, PaymentsConfig } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { GatewayEndpointCard } from "../components/GatewayEndpointCard";
import { SummaryCard } from "../components/metrics";
import { UsageLimitsPanel } from "../components/UsageLimitsPanel";
import { ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNumber, formatUsd } from "../lib/format";

export function DashboardPage() {
  const { apiKey } = useAuth();
  const [status, setStatus] = useState<MeStatus | null>(null);
  const [config, setConfig] = useState<PaymentsConfig | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [me, cfg, pay, logRes] = await Promise.all([
          fetchMeStatus(apiKey!),
          fetchPaymentsConfig(apiKey!),
          fetchPayments(apiKey!),
          fetchLogs(apiKey!, { limit: 5, offset: 0 }),
        ]);
        if (cancelled) return;
        setStatus(me);
        setConfig(cfg);
        setPayments((pay.data ?? []).slice(0, 3));
        setLogs(logRes.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const tokens = status?.usage.tokens;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Halo${status?.apiKey?.name ? `, ${status.apiKey.name}` : ""} — ini cockpit AI kamu.`}
        actions={
          <div className="flex w-full gap-2 sm:w-auto">
            <Button asChild className="flex-1 sm:flex-none">
              <Link to="/payments">Top up</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link to="/logs">Lihat logs</Link>
            </Button>
          </div>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <LoadingBlock label="Loading your summary…" /> : null}

      {!loading && !error ? (
        <>
          <GatewayEndpointCard compact className="mb-6 scale-in-delay-1" />

          <UsageLimitsPanel
            className="mb-4"
            variant="compact"
            paygBalance={config?.paygBalance}
            usageLimits={config?.usageLimits}
            topUpAllowed={config?.topUpAllowed ?? false}
          />

          <div className="grid gap-4 md:grid-cols-1">
            <SummaryCard
              className="scale-in scale-in-delay-2"
              label="Tokens this period"
              value={formatNumber(tokens?.totalTokens)}
              hint={`In ${formatNumber(tokens?.inputTokens)} · Out ${formatNumber(tokens?.outputTokens)}`}
            />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Card className="scale-in scale-in-delay-2 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-medium text-foreground">Recent top-ups</h3>
                  <Link to="/payments" className="text-xs text-primary hover:underline">
                    All
                  </Link>
                </div>
                {payments.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-foreground">No top-ups yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {payments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div>
                          <p className="text-foreground">{formatUsd(p.usdCredit)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                        </div>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {p.credited ? "Credited" : p.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="scale-in scale-in-delay-3 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-medium text-foreground">Recent requests</h3>
                  <Link to="/logs" className="text-xs text-primary hover:underline">
                    All
                  </Link>
                </div>
                {logs.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-foreground">No requests yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {logs.map((log) => (
                      <li key={log.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate text-foreground">
                            {log.comboName || log.requestedModel || log.model || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                        </div>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {log.status ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
