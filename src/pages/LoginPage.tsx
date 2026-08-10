import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { ApiError } from "../api/types";
import { REHYDRATE_ERROR_EVENT } from "../auth/constants";
import { readRememberedApiKey, useAuth } from "../auth/AuthContext";
import { Atmosphere } from "../components/Atmosphere";
import { ErrorBanner } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY } from "../lib/company";
import { STARTER_CREDIT } from "../config";
import { safeInternalPath } from "../lib/safeUrl";

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function LoginPage() {
  const { apiKey, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rememberedKey = readRememberedApiKey() ?? "";
  const [value, setValue] = useState(rememberedKey);
  const [remember, setRemember] = useState(Boolean(rememberedKey));
  const [error, setError] = useState<string | null>(null);
  const nextPath = safeInternalPath((location.state as { from?: string } | null)?.from);

  // Surface a one-shot reason when rehydrate failed (e.g. saved key is no longer
  // valid against the gateway). Without this, users get bounced to /login with
  // no feedback and assume they typed the wrong key.
  useEffect(() => {
    function onRehydrateError(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      const message =
        typeof detail === "string" && detail.trim()
          ? detail
          : "Saved session expired. Please sign in again.";
      setError(message);
    }
    window.addEventListener(REHYDRATE_ERROR_EVENT, onRehydrateError);
    return () => window.removeEventListener(REHYDRATE_ERROR_EVENT, onRehydrateError);
  }, []);

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
      else if (err instanceof Error) setError(err.message || "Login failed. Please try again.");
      else setError("Login failed. Please try again.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-6 sm:py-16">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center">
          <p className="brand-reveal font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {COMPANY.name}
          </p>
          <p className="rise-in rise-in-delay-1 mt-4 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            {COMPANY.tagline}
          </p>
        </div>

        <h1 className="rise-in rise-in-delay-2 mx-auto mt-8 max-w-md text-center font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:mt-10 md:text-4xl">
          Haus IT &amp; AI?{" "}
          <span className="bg-gradient-to-r from-primary to-[var(--signal)] bg-clip-text text-transparent">
            Plug in.
          </span>
        </h1>

        <p className="rise-in rise-in-delay-2 mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          Masukkan API key, buka model, pantau usage, dan gas eksperimen AI kamu.
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
              API key
            </Label>
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              placeholder="Paste key, then ship"
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
                Remember me on this device
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Simpan API key di browser ini (termasuk setelah logout). Jangan centang di perangkat bersama.
              </p>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || !value.trim()}
            className="rise-in rise-in-delay-4 h-11 w-full"
          >
            {loading ? "Connecting…" : "Masuk & build"}
          </Button>
        </form>

        <div className="rise-in rise-in-delay-4 mx-auto mt-8 max-w-md rounded-xl border border-border bg-card/80 p-5 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Pendaftaran
          </p>
          <p className="mt-2 font-display text-lg font-semibold text-foreground">
            Belum punya API key?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Daftar dengan Starter credit — bayar{" "}
            {formatIdr(STARTER_CREDIT.amountIdr)}, dapat ${STARTER_CREDIT.usdCredit} credit dan API
            key langsung aktif.
          </p>
          <Button asChild variant="outline" className="mt-4 h-11 w-full">
            <Link to="/beli">
              Daftar / beli credit <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
