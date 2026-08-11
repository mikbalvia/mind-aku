import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createShopCheckout, fetchShopConfig, simulateShopOrder } from "../api/client";
import { ApiError } from "../api/types";
import type { ShopConfig } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { Turnstile } from "../components/Turnstile";
import { ErrorBanner, LoadingBlock } from "../components/page-chrome";
import { clearGuestClaimSecret, storeGuestClaimSecret } from "../lib/guestClaim";
import { captureReferralFromUrl, getStoredReferralCode } from "../lib/referral";
import { isAllowedPaymentCheckoutUrl } from "../lib/safeUrl";
import { COMPANY } from "../lib/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function BuyPage() {
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [name, setName] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = await fetchShopConfig();
      setConfig(cfg);
      const days = cfg.affiliateCookieDays ?? 30;
      setRefCode(captureReferralFromUrl(days) ?? getStoredReferralCode());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const turnstileRequired = Boolean(config?.turnstileEnabled && config.turnstileSiteKey);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!config?.configured && !config?.mockEnabled) {
      setError("Pembayaran belum dikonfigurasi. Hubungi admin.");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError("Selesaikan verifikasi keamanan dulu.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const checkout = await createShopCheckout({
        name: trimmed,
        successReturnUrl: `${origin}/beli/success`,
        cancelReturnUrl: `${origin}/beli/cancel`,
        paymentMethodTypeCode: "QRIS",
        turnstileToken: turnstileToken ?? undefined,
        refCode: refCode ?? undefined,
      });

      storeGuestClaimSecret(checkout.orderId, checkout.claimSecret);

      const mockMode = Boolean(config?.mockEnabled || checkout.mock);
      if (mockMode || !checkout.paymentLinkUrl) {
        await simulateShopOrder(checkout.orderId, checkout.claimSecret);
        window.location.replace(`${origin}/beli/success?order=${encodeURIComponent(checkout.orderId)}`);
        return;
      }

      if (!isAllowedPaymentCheckoutUrl(checkout.paymentLinkUrl)) {
        clearGuestClaimSecret(checkout.orderId);
        setError("Checkout URL tidak diizinkan.");
        return;
      }
      window.location.replace(checkout.paymentLinkUrl);
    } catch (err) {
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      setError(err instanceof ApiError ? err.message : "Checkout gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-6 sm:py-16">
      <Atmosphere />
      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center">
          <Link to="/" className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {COMPANY.name}
            <span className="text-primary">.</span>
          </Link>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Beli akses baru</p>
        </div>

        <h1 className="mt-8 text-center font-display text-3xl font-bold tracking-tight text-foreground">
          Mulai tanpa API key
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          Isi nama, bayar via QRIS, lalu dapatkan API key dengan quota sesuai rate currency.
        </p>

        {loading ? (
          <div className="mt-10">
            <LoadingBlock label="Memuat produk…" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-6 rounded-xl border border-border bg-card/80 p-6 backdrop-blur-md">
            {error ? <ErrorBanner message={error} /> : null}

            {config ? (
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {config.productLabel}
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">
                  {formatIdr(config.amountIdr)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Kredit ≈ {formatUsd(config.usdCredit)} · RPM {config.requestsPerMinute} · {config.rateLabel}
                </p>
                {config.affiliateEnabled && refCode ? (
                  <p className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-sm text-foreground">
                    Referral aktif ({refCode}): Anda dapat ≈{" "}
                    {formatUsd(config.usdCredit * (1 + (config.buyerBonusRate ?? 0.1)))} credit
                    (bonus {((config.buyerBonusRate ?? 0.1) * 100).toFixed(0)}%).
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="buyer-name">Nama</Label>
              <Input
                id="buyer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama untuk API key"
                autoComplete="name"
                maxLength={50}
                required
                disabled={submitting}
              />
            </div>

            {turnstileRequired && config?.turnstileSiteKey ? (
              <div className="flex justify-center">
                <Turnstile
                  key={turnstileKey}
                  siteKey={config.turnstileSiteKey}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                />
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={submitting || !config || (turnstileRequired && !turnstileToken)}
            >
              {submitting
                ? "Memproses…"
                : config?.mockEnabled
                  ? "Simulate purchase"
                  : "Bayar dengan QRIS"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Sudah punya key?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
