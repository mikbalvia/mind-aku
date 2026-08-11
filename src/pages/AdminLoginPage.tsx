import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Atmosphere } from "../components/Atmosphere";
import { getPortalAdminKey, setPortalAdminKey } from "../lib/referral";
import { COMPANY } from "../lib/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const existing = getPortalAdminKey();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (existing) {
    return <Navigate to="/admin/withdrawals" replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Admin key wajib diisi.");
      return;
    }
    setPortalAdminKey(trimmed);
    navigate("/admin/withdrawals", { replace: true });
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <Atmosphere />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <p className="font-display text-3xl font-extrabold tracking-tight">{COMPANY.name}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">Admin · Affiliate</p>
        <form className="mt-8 space-y-4 rounded-2xl border border-border bg-card/70 p-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="admin-key">Portal admin key</Label>
            <Input
              id="admin-key"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="PORTAL_ADMIN_KEY"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>
      </div>
    </div>
  );
}
