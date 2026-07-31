import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Atmosphere } from "../components/Atmosphere";
import { ErrorBanner } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY } from "../lib/company";
import { safeInternalPath } from "../lib/safeUrl";

export function LoginPage() {
  const { apiKey, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPath = safeInternalPath((location.state as { from?: string } | null)?.from);

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
                Simpan sesi di browser ini. Jangan centang di perangkat bersama.
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
      </div>
    </div>
  );
}
