import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { createPayment, fetchPayments, fetchPaymentsConfig, simulatePayment } from "../api/client";
import { ApiError } from "../api/types";
import type { PaymentHistoryItem, PaymentsConfig } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import {
  BCA_TRANSFER,
  SUBSCRIPTION_PACKAGES,
  SUBSCRIPTION_PLAN_META,
  buildSubscriptionWhatsAppHref,
  type SubscriptionPackage,
} from "../config";
import { COMPANY } from "../lib/company";
import { formatIdrPerUsdRate } from "../lib/format";
import { canDownloadInvoice, downloadInvoice } from "../lib/invoice";
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
  const [selectedSubId, setSelectedSubId] = useState<string>(SUBSCRIPTION_PACKAGES[0]?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const mockMode = Boolean(config?.mockEnabled);

  const selectedSub: SubscriptionPackage | undefined = SUBSCRIPTION_PACKAGES.find(
    (pkg) => pkg.id === selectedSubId
  );

  async function load() {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const [cfg, list] = await Promise.all([fetchPaymentsConfig(apiKey), fetchPayments(apiKey)]);
      setConfig(cfg);
      setHistory(list.data ?? []);
      if (cfg.packages[1]) setSelectedUsd(cfg.packages[1].usdAmount);
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [apiKey]);

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
      const payment = await createPayment(apiKey, {
        usdAmount: activeUsd,
        successReturnUrl: `${origin}/payments/success`,
        cancelReturnUrl: `${origin}/payments/cancel`,
        paymentMethodTypeCode: "QRIS",
      });

      if (mockMode || payment.mock || !payment.paymentLinkUrl) {
        await simulatePayment(apiKey, payment.id);
        setSuccessMessage(`Mock top-up credited ${formatUsd(payment.usdCredit)} to lifetime quota.`);
        await load();
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
        logout();
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

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(null), 1600);
    } catch {
      setError("Gagal menyalin. Salin manual saja.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Top up"
        description={
          mockMode
            ? "Mode mock lokal — isi saldo Lifetime (USD) instan tanpa SumoPod."
            : "Bayar credit via SumoPod, atau ambil subscription via transfer BCA."
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {successMessage ? (
        <Alert className="mb-4 border-[color-mix(in_srgb,var(--ok)_35%,transparent)] bg-[var(--ok-soft)] text-[var(--ok)]">
          <AlertDescription className="text-[var(--ok)]">{successMessage}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? <LoadingBlock label="Siapkan paket credit…" /> : null}

      {!loading ? (
        <Card className="mb-5 scale-in border-primary/30 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  New plan
                </p>
                <h3 className="mt-1 font-display text-2xl font-medium text-foreground">
                  Subscription
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Transfer BCA manual — limit tidak auto-add. Setelah bayar, WA admin + bukti
                  transfer.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {SUBSCRIPTION_PACKAGES.map((pkg) => {
                const active = selectedSubId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedSubId(pkg.id)}
                    className={cn(
                      "rounded-lg border px-4 py-4 text-left transition-all duration-200",
                      active
                        ? "border-primary/40 bg-accent"
                        : "border-border hover:border-border/80"
                    )}
                  >
                    <div className="font-display text-xl text-foreground">{pkg.label}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {formatIdr(pkg.amountIdr)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{pkg.durationLabel}</div>
                  </button>
                );
              })}
            </div>

            <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
                <dt className="text-muted-foreground">Limit harian</dt>
                <dd className="tabular-nums text-foreground">
                  {formatUsd(SUBSCRIPTION_PLAN_META.dailyLimitUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
                <dt className="text-muted-foreground">Limit 1 bulan</dt>
                <dd className="tabular-nums text-foreground">
                  {formatUsd(SUBSCRIPTION_PLAN_META.monthlyLimitUsd)}
                  <span className="ml-1 text-xs text-muted-foreground">(~Rp 50 jt)</span>
                </dd>
              </div>
              <div className="flex justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 sm:col-span-2">
                <dt className="text-muted-foreground">Request per menit</dt>
                <dd className="tabular-nums text-foreground">
                  {SUBSCRIPTION_PLAN_META.requestsPerMinute} RPM
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Transfer ke
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium text-foreground">{BCA_TRANSFER.bank}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">No. rekening</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                      {BCA_TRANSFER.accountNumber}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => void copyText("account", BCA_TRANSFER.accountNumber)}
                    >
                      {copiedField === "account" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">a.n</span>
                  <span className="font-medium text-foreground">{BCA_TRANSFER.accountName}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                  <span className="text-muted-foreground">Nominal</span>
                  <span className="font-display text-lg text-foreground">
                    {selectedSub ? formatIdr(selectedSub.amountIdr) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Setelah transfer, kirim bukti ke WhatsApp admin. Limit subscription diaktifkan
                manual — tidak otomatis.
              </p>
              <Button asChild className="min-w-[12rem] shrink-0">
                <a
                  href={buildSubscriptionWhatsAppHref(selectedSub)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  WA setelah bayar
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
                    Credits {activeUsd != null ? formatUsd(activeUsd) : "—"} lifetime quota
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
            </CardContent>
          </Card>

          <Card className="scale-in scale-in-delay-2 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-display text-2xl font-medium text-foreground">Lifetime quota</h3>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Limit</dt>
                  <dd className="tabular-nums text-foreground">{formatUsd(config.lifetimeQuota?.limitUsd)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Spent</dt>
                  <dd className="tabular-nums text-muted-foreground">
                    {formatUsd(config.lifetimeQuota?.spentUsd ?? 0)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Remaining</dt>
                  <dd className="tabular-nums font-medium text-primary">
                    {formatUsd(config.lifetimeQuota?.remainingUsd)}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                {mockMode
                  ? "PAYMENT_MOCK is on. Simulate top-up credits your key without SumoPod or real money."
                  : `After payment succeeds, SumoPod notifies ${COMPANY.name} and your lifetime quota increases automatically. Rate is managed by your administrator and can change over time.`}
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
