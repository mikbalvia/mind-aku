import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/types";
import { REHYDRATE_ERROR_EVENT } from "../auth/constants";
import { readRememberedApiKey, useAuth } from "../auth/AuthContext";
import { Atmosphere } from "../components/Atmosphere";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ErrorBanner } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY } from "../lib/company";
import { STARTER_CREDIT } from "../config";
import { formatIdr } from "../lib/format";
import { safeInternalPath } from "../lib/safeUrl";

export function LoginPage() {
  const { t } = useTranslation();
  const { apiKey, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rememberedKey = readRememberedApiKey() ?? "";
  const [value, setValue] = useState(rememberedKey);
  const [remember, setRemember] = useState(Boolean(rememberedKey));
  const [error, setError] = useState<string | null>(null);
  const nextPath = safeInternalPath((location.state as { from?: string } | null)?.from);

  useEffect(() => {
    function onRehydrateError(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      const message =
        typeof detail === "string" && detail.trim()
          ? detail
          : t("Saved session expired. Please sign in again.");
      setError(message);
    }
    window.addEventListener(REHYDRATE_ERROR_EVENT, onRehydrateError);
    return () => window.removeEventListener(REHYDRATE_ERROR_EVENT, onRehydrateError);
  }, [t]);

  if (apiKey) {
    return <Navigate to={nextPath} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login(value, { remember });
      navigate(nextPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message || t("Login failed. Please try again."));
      else setError(t("Login failed. Please try again."));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-6 sm:py-16">
      <Atmosphere />

      <div className="absolute right-5 top-5 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center">
          <BrandLogo className="brand-reveal mx-auto size-16 drop-shadow-[0_0_28px_rgba(249,115,22,0.5)] sm:size-[4.5rem]" />
          <p className="brand-reveal mt-5 font-heading text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {COMPANY.name}
          </p>
          <p className="rise-in rise-in-delay-1 mt-4 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            {COMPANY.tagline}
          </p>
        </div>

        <h1 className="rise-in rise-in-delay-2 mx-auto mt-8 max-w-md text-center font-heading text-3xl font-bold leading-tight tracking-tight text-foreground md:mt-10 md:text-4xl">
          {t("Hungry for IT & AI?")}{" "}
          <span className="bg-gradient-to-r from-primary to-[var(--signal)] bg-clip-text text-transparent">
            {t("Plug in.")}
          </span>
        </h1>

        <p className="rise-in rise-in-delay-2 mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {t("Enter your API key, open models, track usage, and ship AI experiments.")}
        </p>

        {error ? (
          <div className="scale-in scale-in-delay-2 mt-6">
            <ErrorBanner message={error} />
          </div>
        ) : null}

        <form
          className="rise-in rise-in-delay-3 mx-auto mt-10 max-w-md space-y-5"
          onSubmit={onSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("API key")}
            </Label>
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              placeholder={t("Paste key, then ship")}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-start gap-3">
            <input
              id="remember-me"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
              className="mt-1 size-4 shrink-0 rounded border border-input accent-primary"
            />
            <div className="space-y-1">
              <Label htmlFor="remember-me" className="cursor-pointer text-sm font-medium text-foreground">
                {t("Remember me on this device")}
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(
                  "Store the API key in this browser (including after logout). Do not check this on shared devices."
                )}
              </p>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || !value.trim()}
            className="rise-in rise-in-delay-4 h-11 w-full"
          >
            {loading ? t("Connecting…") : t("Sign in & build")}
          </Button>
        </form>

        <div className="rise-in rise-in-delay-4 mx-auto mt-8 max-w-md space-y-2 rounded-xl border border-border bg-card/85 p-5 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("Registration")}
          </p>
          <p className="font-heading text-lg font-semibold text-foreground">
            {t("Don't have an API key yet?")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              "Sign up with Starter credit — pay {{amount}}, get ${{credit}} credit and an API key ready to use.",
              {
                amount: formatIdr(STARTER_CREDIT.amountIdr),
                credit: String(STARTER_CREDIT.usdCredit),
              }
            )}
          </p>
          <Button asChild variant="outline" className="mt-1 h-11 w-full">
            <Link to="/beli">
              {t("Sign up / buy credit")} <ArrowUpRight weight="bold" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
