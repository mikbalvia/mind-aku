import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { fetchAdminAffiliateStats } from "../api/client";
import { ApiError } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { BrandLogo } from "../components/BrandLogo";
import { getPortalAdminKey, setPortalAdminKey } from "../lib/referral";
import { COMPANY } from "../lib/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existing = getPortalAdminKey();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get("error") === "invalid" ? t("Invalid admin key.") : null
  );

  if (existing) {
    return <Navigate to="/admin/withdrawals" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError(t("Admin key is required."));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Verify against API before navigating so a wrong key does not
      // bounce login → withdrawals → login with no visible error.
      await fetchAdminAffiliateStats(trimmed);
      setPortalAdminKey(trimmed);
      navigate("/admin/withdrawals", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t("Invalid admin key."));
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : t("Unable to reach Mind Aku. Check the base URL and CORS settings.")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <Atmosphere />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <BrandLogo className="size-12 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
        <p className="mt-4 font-heading text-3xl font-extrabold tracking-tight">{COMPANY.name}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Admin · Affiliate")}</p>
        <form
          className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6"
          onSubmit={(e) => void onSubmit(e)}
        >
          <div className="space-y-2">
            <Label htmlFor="admin-key">{t("Admin portal key")}</Label>
            <Input
              id="admin-key"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="PORTAL_ADMIN_KEY"
              disabled={loading}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("Signing in…") : t("Masuk")}
          </Button>
        </form>
      </div>
    </div>
  );
}
