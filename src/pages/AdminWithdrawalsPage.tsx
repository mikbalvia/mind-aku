import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import {
  fetchAdminAffiliateReferrals,
  fetchAdminAffiliateStats,
  fetchAdminWithdrawals,
  patchAdminWithdrawal,
} from "../api/client";
import { ApiError } from "../api/types";
import type { AdminAffiliateReferralItem, AffiliateWithdrawalItem } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { BrandLockup } from "../components/BrandLogo";
import { clearPortalAdminKey, getPortalAdminKey } from "../lib/referral";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function AdminWithdrawalsPage() {
  const { t } = useTranslation();
  const adminKey = getPortalAdminKey();
  const [statusFilter, setStatusFilter] = useState("requested");
  const [rows, setRows] = useState<AffiliateWithdrawalItem[]>([]);
  const [stats, setStats] = useState<{ unpaidLiabilityUsd: number; pendingWithdrawals: number } | null>(
    null
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [affCodeInput, setAffCodeInput] = useState("");
  const [appliedAffCode, setAppliedAffCode] = useState("");
  const [referrals, setReferrals] = useState<AdminAffiliateReferralItem[]>([]);
  const [referralTotal, setReferralTotal] = useState(0);
  const [referralsLoading, setReferralsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const [list, st] = await Promise.all([
        fetchAdminWithdrawals(adminKey, statusFilter || undefined),
        fetchAdminAffiliateStats(adminKey),
      ]);
      setRows(list.data ?? []);
      setStats({
        unpaidLiabilityUsd: st.unpaidLiabilityUsd,
        pendingWithdrawals: st.pendingWithdrawals,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearPortalAdminKey();
      }
      setError(err instanceof ApiError ? err.message : t("Failed to load admin data."));
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadReferrals = useCallback(async () => {
    if (!adminKey) return;
    setReferralsLoading(true);
    try {
      const list = await fetchAdminAffiliateReferrals(adminKey, appliedAffCode || undefined);
      setReferrals(list.data ?? []);
      setReferralTotal(list.total ?? 0);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearPortalAdminKey();
      }
      setError(err instanceof ApiError ? err.message : t("Failed to load admin data."));
    } finally {
      setReferralsLoading(false);
    }
  }, [adminKey, appliedAffCode, t]);

  useEffect(() => {
    void loadReferrals();
  }, [loadReferrals]);

  if (!adminKey) {
    return <Navigate to="/admin/login" replace />;
  }

  async function updateStatus(id: number, status: string) {
    if (!adminKey) return;
    setBusyId(id);
    setError(null);
    try {
      await patchAdminWithdrawal(adminKey, id, { status, adminNote: note.trim() || undefined });
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("Failed to update status."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <Atmosphere />
      <div className="relative z-10 mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <BrandLockup />
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t("Admin · Affiliate withdrawals")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/">{t("Portal")}</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearPortalAdminKey();
                window.location.href = "/admin/login";
              }}
            >
              {t("Logout admin")}
            </Button>
          </div>
        </div>

        {stats ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="space-y-1.5 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("Outstanding liability")}
                </p>
                <p className="font-heading text-2xl font-extrabold">
                  {formatUsd(stats.unpaidLiabilityUsd)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1.5 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("Pending / approved")}
                </p>
                <p className="font-heading text-2xl font-extrabold">{stats.pendingWithdrawals}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {["requested", "approved", "paid", "rejected", ""].map((s) => (
            <Button
              key={s ? t(s) : t("all")}
              type="button"
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s ? t(s) : t("all")}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="admin-note">
            {t("Admin note")}
          </label>
          <Input id="admin-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p> : null}

        <Card>
          <CardContent className="p-6">
            {rows.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">{t("No data.")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{t("Date")}</TableHead>
                    <TableHead>{t("USD")}</TableHead>
                    <TableHead>{t("Bank")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>#{row.id}</TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{formatUsd(row.amountUsd)}</TableCell>
                      <TableCell className="text-xs">
                        <div>{row.accountName}</div>
                        <div>
                          {row.bankName} · {row.bankAccount}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{row.status}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.status === "requested" ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "approved")}
                              >
                                {t("Approve")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "rejected")}
                              >
                                {t("Reject")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "paid")}
                              >
                                {t("Mark paid")}
                              </Button>
                            </>
                          ) : null}
                          {row.status === "approved" ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "paid")}
                              >
                                {t("Mark paid")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "rejected")}
                              >
                                {t("Reject")}
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold">{t("Affiliate referrals")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("{{count}} people. Filter by affiliator code to view per person.", { count: String(referralTotal) })}
              </p>
            </div>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setAppliedAffCode(affCodeInput.trim());
              }}
            >
              <div className="min-w-[12rem] flex-1 space-y-2">
                <label className="text-sm font-medium" htmlFor="aff-code-filter">
                  Kode affiliator
                </label>
                <Input
                  id="aff-code-filter"
                  value={affCodeInput}
                  onChange={(e) => setAffCodeInput(e.target.value)}
                  placeholder={t("All affiliators")}
                />
              </div>
              <Button type="submit" variant="outline">
                {t("Filter")}
              </Button>
              {appliedAffCode ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAffCodeInput("");
                    setAppliedAffCode("");
                  }}
                >
                  {t("Reset")}
                </Button>
              ) : null}
            </form>
            {referralsLoading ? <p className="text-sm text-muted-foreground">{t("Loading referrals…")}</p> : null}
            {referrals.length === 0 && !referralsLoading ? (
              <p className="text-sm text-muted-foreground">{t("No one has joined.")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Name")}</TableHead>
                    <TableHead>{t("Date")}</TableHead>
                    <TableHead>{t("Affiliator code")}</TableHead>
                    <TableHead>{t("Affiliator name")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((row, index) => (
                    <TableRow key={`${row.affCode}-${row.createdAt}-${row.name}-${index}`}>
                      <TableCell>{row.name.trim() || "—"}</TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{row.affCode.trim() || "—"}</TableCell>
                      <TableCell>{row.affiliatorName.trim() || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
