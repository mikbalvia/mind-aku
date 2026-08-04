import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ErrorBanner, PageHeader } from "../components/page-chrome";
import {
  BCA_TRANSFER,
  SUBSCRIPTION_PACKAGES,
  SUBSCRIPTION_PLAN_META,
  buildSubscriptionWhatsAppHref,
  type SubscriptionPackage,
} from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatUsd(value: number): string {
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

export function SubscriptionPage() {
  const [selectedSubId, setSelectedSubId] = useState<string>(SUBSCRIPTION_PACKAGES[0]?.id ?? "");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSub: SubscriptionPackage | undefined = SUBSCRIPTION_PACKAGES.find(
    (pkg) => pkg.id === selectedSubId
  );

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
        title="Subscription"
        description="Paket berlangganan via transfer BCA. Setelah bayar, WA admin + bukti transfer — limit diaktifkan manual."
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="scale-in border-primary/30 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                New plan
              </p>
              <h3 className="mt-1 font-display text-2xl font-medium text-foreground">
                Pilih paket
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Transfer BCA manual — tidak lewat SumoPod, limit tidak auto-add.
              </p>
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

        <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="font-display text-2xl font-medium text-foreground">Benefit paket</h3>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-border pb-3">
                <dt className="text-muted-foreground">Limit 5 jam</dt>
                <dd className="tabular-nums text-foreground">
                  {formatUsd(SUBSCRIPTION_PLAN_META.fiveHourLimitUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-border pb-3">
                <dt className="text-muted-foreground">Limit harian</dt>
                <dd className="tabular-nums text-foreground">
                  {formatUsd(SUBSCRIPTION_PLAN_META.dailyLimitUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-border pb-3">
                <dt className="text-muted-foreground">Limit mingguan</dt>
                <dd className="tabular-nums text-foreground">
                  {formatUsd(SUBSCRIPTION_PLAN_META.weeklyLimitUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Request per menit</dt>
                <dd className="tabular-nums font-medium text-primary">
                  {SUBSCRIPTION_PLAN_META.requestsPerMinute} RPM
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Aktivasi dilakukan admin setelah konfirmasi transfer. Siapkan screenshot bukti
              transfer saat chat WhatsApp.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
