import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { claimShopOrder } from "../api/client";
import { ApiError } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Atmosphere } from "../components/Atmosphere";
import { CommunityJoinSoftCta } from "../components/CommunityBanner";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ErrorBanner } from "../components/page-chrome";
import { clearGuestClaimSecret, readGuestClaimSecret } from "../lib/guestClaim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POLL_MS = 2000;
const MAX_POLLS = 45;

export function BuySuccessPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const orderId = (params.get("order") || "").trim();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"waiting" | "ready" | "error">("waiting");
  const [message, setMessage] = useState(() => t("Waiting for payment confirmation…"));
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!orderId) {
      setStatus("error");
      setError(t("Order not found."));
      return;
    }

    const claimSecret = readGuestClaimSecret(orderId);
    if (!claimSecret) {
      setStatus("error");
      setError(
        t(
          "Claim session missing. Open the success link from the same browser you used to check out."
        )
      );
      return;
    }

    let cancelled = false;
    let polls = 0;

    async function tryClaim() {
      polls += 1;
      try {
        const result = await claimShopOrder({ orderId, claimSecret: claimSecret! });
        if (cancelled) return;
        if (result.status === "pending") {
          setMessage(t("Payment received. Preparing your API key…"));
          if (polls >= MAX_POLLS) {
            setStatus("error");
            setError(t("Timed out waiting for payment confirmation."));
            return;
          }
          window.setTimeout(() => {
            void tryClaim();
          }, POLL_MS);
          return;
        }
        if (result.status === "ready" && result.apiKey) {
          setApiKey(result.apiKey);
          setStatus("ready");
          setMessage(t("API key ready. Save it now — it won't be shown again."));
          clearGuestClaimSecret(orderId);
          try {
            await login(result.apiKey, { remember: true });
            window.setTimeout(() => navigate("/console", { replace: true }), 2500);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : t("Key is ready, but auto-login failed. Sign in with your API key.")
            );
          }
          return;
        }
        setStatus("error");
        setError(t("Unrecognized claim response."));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 409) {
          setStatus("error");
          setError(t("API key already claimed. Sign in if you saved it."));
          clearGuestClaimSecret(orderId);
          return;
        }
        setStatus("error");
        setError(err instanceof ApiError ? err.message : t("Failed to claim API key."));
      }
    }

    void tryClaim();
    return () => {
      cancelled = true;
    };
  }, [orderId, login, navigate, t]);

  async function onCopy() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const title =
    status === "ready"
      ? t("Ready to use")
      : status === "error"
        ? t("Something went wrong")
        : t("Almost done");

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>
      <div className="relative z-10 w-full max-w-md text-center">
        <p className="brand-reveal font-heading text-4xl font-extrabold text-foreground">{title}</p>
        <div className="mx-auto mt-5 accent-line" />
        <p className="rise-in rise-in-delay-1 mt-6 text-sm text-muted-foreground">{message}</p>
        {error ? (
          <div className="mt-4 text-left">
            <ErrorBanner message={error} />
          </div>
        ) : null}
        {apiKey ? (
          <div className="rise-in mt-6 space-y-3 text-left">
            <Input readOnly value={apiKey} className="font-mono text-xs" />
            <Button type="button" className="w-full" onClick={() => void onCopy()}>
              {copied ? t("Copied") : t("Copy API key")}
            </Button>
            <CommunityJoinSoftCta />
            <p className="text-center text-xs text-muted-foreground">{t("Redirecting to console…")}</p>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="h-11 px-8">
              <Link to="/beli">{t("Try again")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-8">
              <Link to="/login">{t("Sign in")}</Link>
            </Button>
          </div>
        ) : null}
        {orderId ? (
          <p className="mt-6 font-mono text-[10px] text-muted-foreground">order: {orderId}</p>
        ) : null}
      </div>
    </div>
  );
}

export function BuyCancelPage() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>
      <div className="relative z-10 max-w-md text-center">
        <p className="brand-reveal font-heading text-4xl font-extrabold text-foreground">
          {t("Cancelled")}
        </p>
        <div className="mx-auto mt-5 accent-line" />
        <p className="rise-in rise-in-delay-1 mt-6 text-sm text-muted-foreground">
          {t("No charge was made. You can buy again anytime.")}
        </p>
        <Button asChild className="rise-in rise-in-delay-2 mt-8 h-11 px-8">
          <Link to="/beli">{t("Back to buy")}</Link>
        </Button>
      </div>
    </div>
  );
}
