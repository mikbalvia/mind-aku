import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createShopCheckout, fetchShopConfig, simulateShopOrder } from "../api/client";
import { ApiError } from "../api/types";
import type { ShopConfig } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Turnstile } from "../components/Turnstile";
import { ErrorBanner, LoadingBlock } from "../components/page-chrome";
import { clearGuestClaimSecret, storeGuestClaimSecret } from "../lib/guestClaim";
import { captureReferralFromUrl, getStoredReferralCode } from "../lib/referral";
import { isAllowedPaymentCheckoutUrl } from "../lib/safeUrl";
import { COMPANY } from "../lib/company";
import { formatIdr, formatUsd } from "../lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BuyPage() {
  const { t } = useTranslation();
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
      setError(err instanceof ApiError ? err.message : t("Failed to load product."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setRefCode(captureReferralFromUrl() ?? getStoredReferralCode());
    void load();
  }, [load]);

  const turnstileRequired = Boolean(config?.turnstileEnabled && config.turnstileSiteKey);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("Name is required."));
      return;
    }
    if (!config?.configured && !config?.mockEnabled) {
      setError(t("Payments are not configured yet. Contact admin."));
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError(t("Complete the security check first."));
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
        setError(t("Checkout URL is not allowed."));
        return;
      }
      window.location.replace(checkout.paymentLinkUrl);
    } catch (err) {
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      setError(err instanceof ApiError ? err.message : t("Checkout failed. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const amountLabel = config ? formatIdr(config.amountIdr) : formatIdr(100_000);
  const days = config?.activePeriodDays ?? 30;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-6 sm:py-16">
      <Atmosphere />
      <div className="absolute right-5 top-5 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center">
          <Link to="/" className="inline-flex flex-col items-center">
            <BrandLogo className="size-14 drop-shadow-[0_0_24px_rgba(249,115,22,0.45)]" />
            <span className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {COMPANY.name}
              <span className="text-primary">.</span>
            </span>
          </Link>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            {t("Buy new access")}
          </p>
        </div>

        <h1 className="mt-8 text-center font-heading text-3xl font-bold tracking-tight text-foreground">
          {t("Start without an API key")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          {t(
            "Enter your name, pay via QRIS, then get an API key. From {{amount}} · active {{days}} days · unused balance never expires.",
            { amount: amountLabel, days: String(days) }
          )}
        </p>

        {loading ? (
          <div className="mt-10">
            <LoadingBlock label={t("Loading product…")} />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-6 rounded-xl border border-border bg-card/85 p-6 backdrop-blur-md">
            {error ? <ErrorBanner message={error} /> : null}

            {config ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {config.productLabel}
                </p>
                <p className="font-heading text-3xl font-bold text-foreground">
                  {formatIdr(config.amountIdr)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Credit ≈ {{credit}} · active {{days}} days · RPM {{rpm}} · {{rate}}", {
                    credit: formatUsd(config.usdCredit),
                    days: String(config.activePeriodDays ?? 30),
                    rpm: String(config.requestsPerMinute),
                    rate: config.rateLabel,
                  })}
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="buyer-name">{t("Name")}</Label>
              <Input
                id="buyer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Name for API key")}
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
                ? t("Processing…")
                : config?.mockEnabled
                  ? t("Simulate purchase")
                  : t("Pay with QRIS")}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t("Already have a key?")}{" "}
              <Link to="/login" className="text-primary hover:underline">
                {t("Sign in")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
