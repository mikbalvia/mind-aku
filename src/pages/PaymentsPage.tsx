import { useCallback, useEffect, useMemo, useState } from "react";
import { createPayment, fetchPayments, fetchPaymentsConfig, simulatePayment } from "../api/client";
import { ApiError } from "../api/types";
import type { PaymentHistoryItem, PaymentsConfig } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import { COMPANY } from "../lib/company";
import { formatIdrPerUsdRate } from "../lib/format";
import { canDownloadInvoice, downloadInvoice } from "../lib/invoice";
import { captureReferralFromUrl, getStoredReferralCode } from "../lib/referral";
import { isAllowedPaymentCheckoutUrl } from "../lib/safeUrl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function formatUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status: string, credited: boolean): string {
  if (credited) return "Credited";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function PaymentsPage() {
  const { apiKey, status, logout } = useAuth();
  const [config, setConfig] = useState<PaymentsConfig | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [selectedUsd, setSelectedUsd] = useState<number | null>(10);
  const [customUsd, setCustomUsd] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const buyerName = status?.apiKey?.name ?? "API Key Member";

  const activeUsd = useMemo(() => {
    if (customUsd.trim()) {
      const parsed = Number(customUsd);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return selectedUsd;
  }, [customUsd, selectedUsd]);

  const previewIdr =
    config && activeUsd != null && activeUsd > 0 ? Math.ceil(activeUsd * config.idrPerUsd) : null;

  const previewCreditUsd = activeUsd != null && activeUsd > 0 ? activeUsd : null;

  const mockMode = Boolean(config?.mockEnabled);

  const load = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const [cfg, list] = await Promise.all([fetchPaymentsConfig(apiKey), fetchPayments(apiKey)]);
      setConfig(cfg);
      setHistory(list.data ?? []);
      if (cfg.packages[1]) setSelectedUsd(cfg.packages[1].usdAmount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const days = config?.affiliate?.cookieDays ?? 30;
    captureReferralFromUrl(days);
  }, [config?.affiliate?.cookieDays]);

  async function onTopUp() {
    if (!apiKey || activeUsd == null || activeUsd < 1) {
      setError("Choose a valid USD amount (minimum $1).");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const origin = window.location.origin;
      const refCode =
        config?.affiliate?.enabled && !config.affiliate.hasReferrer
          ? getStoredReferralCode() ?? undefined
          : undefined;
      const payment = await createPayment(apiKey, {
        usdAmount: activeUsd,
        successReturnUrl: `${origin}/payments/success`,
        cancelReturnUrl: `${origin}/payments/cancel`,
        paymentMethodTypeCode: "QRIS",
        refCode,
      });

      if (mockMode || payment.mock || !payment.paymentLinkUrl) {
        await simulatePayment(apiKey, payment.id);
        await load();
        const nextBalance = config?.paygBalance?.remainingUsd;
        const saldoText = nextBalance != null ? ` Saldo pay as you go sekarang ${formatUsd(nextBalance)}.` : "";
        setSuccessMessage(
          `Top up ${formatUsd(payment.usdCredit)} berhasil di-credit ke saldo pay as you go.${saldoText}`,
        );
        setSubmitting(false);
        return;
      }

      if (!isAllowedPaymentCheckoutUrl(payment.paymentLinkUrl)) {
        let host = "unknown";
        try {
          host = new URL(payment.paymentLinkUrl).hostname;
        } catch {
          // ignore
        }
        setError(
          `Payment link host is not allowed (${host}). Contact support if this persists.`
        );
        setSubmitting(false);
        return;
      }

      // Full-page navigate to SumoPod checkout (checkout.pymnt.app).
      window.location.replace(payment.paymentLinkUrl);
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") {
        logout({ clearRemembered: true });
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to create payment.");
      setSubmitting(false);
    }
  }

  function onDownloadInvoice(item: PaymentHistoryItem) {
    try {
      downloadInvoice(item, buyerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open invoice.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Top up"
        description={
          !config?.topUpAllowed
            ? "Top-up tidak tersedia: key ini adalah unlimited, saldo pay-as-you-go tidak relevan."
            : mockMode
              ? "Mode mock lokal — isi saldo Pay as you go (USD) instan tanpa SumoPod."
              : "Bayar IDR via SumoPod. Sukses = kredit saldo Pay as you go (USD) di API key kamu."
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {successMessage ? (
        <Alert className="mb-4 border-[color-mix(in_srgb,var(--ok)_35%,transparent)] bg-[var(--ok-soft)] text-[var(--ok)]">
          <AlertDescription className="text-[var(--ok)]">{successMessage}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? <LoadingBlock label="Siapkan paket credit…" /> : null}

      {!loading && config ? (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-medium text-foreground">Select credit</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-primary">
                    {mockMode ? "Mock · " : ""}
                    {formatIdrPerUsdRate(config.idrPerUsd)}
                  </p>
                </div>
                {!config.configured ? (
                  <p className="text-sm text-destructive">Gateway not configured</p>
                ) : null}
              </div>

              {!config.topUpAllowed ? (
                <div className="mt-6 rounded-lg border border-border bg-card/40 px-4 py-6 text-sm text-muted-foreground">
                  Top-up tidak tersedia: API key ini unlimited, saldo pay-as-you-go tidak
                  diperlukan. Hubungi admin jika ini tidak sesuai.
                </div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {config.packages.map((pkg) => {
                      const active = !customUsd && selectedUsd === pkg.usdAmount;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => {
                            setCustomUsd("");
                            setSelectedUsd(pkg.usdAmount);
                          }}
                          className={cn(
                            "rounded-lg border px-4 py-4 text-left transition-all duration-200",
                            active
                              ? "border-primary/40 bg-accent"
                              : "border-border hover:border-border/80"
                          )}
                        >
                          <div className="font-display text-xl text-foreground">{pkg.label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{formatIdr(pkg.amountIdr)}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="custom-usd" className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Custom USD amount
                    </Label>
                    <Input
                      id="custom-usd"
                      type="number"
                      min={1}
                      max={1000}
                      step={1}
                      placeholder="e.g. 15"
                      value={customUsd}
                      onChange={(e) => setCustomUsd(e.target.value)}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {mockMode ? "Simulated charge" : "You pay"}
                      </p>
                      <p className="mt-1 font-display text-2xl text-foreground">
                        {previewIdr != null ? formatIdr(previewIdr) : "—"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Credits {previewCreditUsd != null ? formatUsd(previewCreditUsd) : "—"} ke saldo
                        pay as you go
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="min-w-[10rem]"
                      disabled={submitting || !config.configured || activeUsd == null || activeUsd < 1}
                      onClick={() => void onTopUp()}
                    >
                      {submitting
                        ? mockMode
                          ? "Simulating…"
                          : "Redirecting…"
                        : mockMode
                          ? "Simulate top-up"
                          : "Pay with QRIS"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="scale-in scale-in-delay-2 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-display text-2xl font-medium text-foreground">Saldo pay as you go</h3>
              {config.paygBalance?.enabled ? (
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3 border-b border-border pb-3">
                    <dt className="text-muted-foreground">Spent</dt>
                    <dd className="tabular-nums text-muted-foreground">
                      {formatUsd(config.paygBalance.spentUsd)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Remaining</dt>
                    <dd className="tabular-nums font-medium text-primary">
                      {config.paygBalance.unlimited ? "Unlimited" : formatUsd(config.paygBalance.remainingUsd)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">
                  Saldo ini tidak tersedia untuk key ini (unlimited).
                </p>
              )}
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                {mockMode
                  ? "PAYMENT_MOCK is on. Simulate top-up credits your key without SumoPod or real money."
                  : `After payment succeeds, SumoPod notifies ${COMPANY.name} and your pay-as-you-go saldo increases automatically. Rate is managed by your administrator and can change over time.`}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!loading ? (
        <div className="mt-8">
          <h3 className="font-display text-xl font-medium text-foreground">Payment history</h3>
          {history.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No top-ups yet" description="Completed payments will appear here." />
            </div>
          ) : (
            <Card className="mt-4 overflow-hidden border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => {
                      const invoiceReady = canDownloadInvoice(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-[12px] text-foreground">{item.orderId}</TableCell>
                          <TableCell>{formatUsd(item.usdCredit)}</TableCell>
                          <TableCell>{formatIdr(item.amountIdr)}</TableCell>
                          <TableCell>{statusLabel(item.status, item.credited)}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            {invoiceReady ? (
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-xs uppercase tracking-[0.12em]"
                                onClick={() => onDownloadInvoice(item)}
                              >
                                Download
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
