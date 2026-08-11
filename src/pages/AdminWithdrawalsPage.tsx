import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  fetchAdminAffiliateStats,
  fetchAdminWithdrawals,
  patchAdminWithdrawal,
} from "../api/client";
import { ApiError } from "../api/types";
import type { AffiliateWithdrawalItem } from "../api/types";
import { Atmosphere } from "../components/Atmosphere";
import { clearPortalAdminKey, getPortalAdminKey } from "../lib/referral";
import { COMPANY } from "../lib/company";
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
      setError(err instanceof ApiError ? err.message : "Gagal memuat data admin.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

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
      setError(err instanceof ApiError ? err.message : "Gagal mengubah status.");
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
            <p className="font-display text-3xl font-extrabold tracking-tight">{COMPANY.name}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Admin · Pencairan affiliate
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/">Portal</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearPortalAdminKey();
                window.location.href = "/admin/login";
              }}
            >
              Logout admin
            </Button>
          </div>
        </div>

        {stats ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Liability belum cair
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold">
                  {formatUsd(stats.unpaidLiabilityUsd)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pending / approved
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold">{stats.pendingWithdrawals}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {["requested", "approved", "paid", "rejected", ""].map((s) => (
            <Button
              key={s || "all"}
              type="button"
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s || "all"}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="admin-note">
            Catatan admin (opsional, diterapkan pada aksi berikutnya)
          </label>
          <Input id="admin-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">Memuat…</p> : null}

        <Card>
          <CardContent className="pt-6">
            {rows.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">Tidak ada data.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>USD</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
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
                                Approve
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "rejected")}
                              >
                                Reject
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "paid")}
                              >
                                Mark paid
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
                                Mark paid
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busyId === row.id}
                                onClick={() => void updateStatus(row.id, "rejected")}
                              >
                                Reject
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
      </div>
    </div>
  );
}
