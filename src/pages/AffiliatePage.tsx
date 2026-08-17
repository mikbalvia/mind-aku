import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createAffiliateWithdrawal,
  enableAffiliate,
  fetchAffiliate,
  fetchAffiliateLedger,
  fetchAffiliateReferrals,
  fetchAffiliateWithdrawals,
} from "../api/client";
import { ApiError } from "../api/types";
import type {
  AffiliateLedgerItem,
  AffiliateReferralItem,
  AffiliateSummary,
  AffiliateWithdrawalItem,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function AffiliatePage() {
  const { apiKey } = useAuth();
  const [summary, setSummary] = useState<AffiliateSummary | null>(null);
  const [ledger, setLedger] = useState<AffiliateLedgerItem[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferralItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [usdAmount, setUsdAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const [aff, led, refs, wd] = await Promise.all([
        fetchAffiliate(apiKey),
        fetchAffiliateLedger(apiKey),
        fetchAffiliateReferrals(apiKey),
        fetchAffiliateWithdrawals(apiKey),
      ]);
      setSummary(aff);
      setLedger(led.data ?? []);
      setReferrals(refs.data ?? []);
      setWithdrawals(wd.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat affiliate.");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onEnable() {
    if (!apiKey) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const aff = await enableAffiliate(apiKey);
      setSummary(aff);
      setMessage("Kode referral siap dibagikan.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengaktifkan affiliate.");
    } finally {
      setBusy(false);
    }
  }

  async function onCopyLink() {
    if (!summary?.referralLinkPath) return;
    const url = `${window.location.origin}${summary.referralLinkPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link referral disalin.");
    } catch {
      setMessage(url);
    }
  }

  async function onWithdraw(event: FormEvent) {
    event.preventDefault();
    if (!apiKey || !summary) return;
    const amount = Number(usdAmount);
    if (!Number.isFinite(amount) || amount < summary.minWithdrawUsd) {
      setError(`Minimum pencairan ${formatUsd(summary.minWithdrawUsd)}.`);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await createAffiliateWithdrawal(apiKey, {
        usdAmount: amount,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        accountName: accountName.trim(),
        note: note.trim() || undefined,
      });
      setUsdAmount("");
      setNote("");
      setMessage("Permintaan pencairan dikirim. Menunggu review admin.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengajukan pencairan.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock label="Memuat affiliate…" />;
  if (!summary) {
    return error ? <ErrorBanner message={error} /> : <EmptyState title="Affiliate tidak tersedia" />;
  }

  const shareUrl = summary.referralLinkPath
    ? `${window.location.origin}${summary.referralLinkPath}`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate"
        description={`Komisi ${(summary.commissionRate * 100).toFixed(0)}% per pembelian referred. Bonus ${(summary.buyerBonusRate * 100).toFixed(0)}% credit hanya di pembelian shop; top-up hanya memberi komisi affiliate.`}
      />
      {error ? <ErrorBanner message={error} /> : null}
      {message ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">{message}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-1.5 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Saldo komisi</p>
            <p className="font-heading text-3xl font-extrabold">{formatUsd(summary.balanceUsd)}</p>
            <p className="text-xs text-muted-foreground">Held {formatUsd(summary.heldUsd)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1.5 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lifetime</p>
            <p className="font-heading text-3xl font-extrabold">{formatUsd(summary.lifetimeUsd)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1.5 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Referral</p>
            <p className="font-heading text-3xl font-extrabold">{summary.referredCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          {!summary.affEnabled ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Aktifkan program affiliate untuk mendapatkan kode & link referral unik.
              </p>
              <Button type="button" disabled={busy || !summary.enabled} onClick={() => void onEnable()}>
                Aktifkan affiliate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kode</p>
                <p className="font-mono text-xl font-bold tracking-widest">{summary.affCode}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link</p>
                <p className="break-all text-sm text-foreground">{shareUrl}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => void onCopyLink()}>
                Salin link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-xl font-bold">Yang join</h2>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada yang join lewat link kamu.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((row, index) => (
                  <TableRow key={`${row.createdAt}-${row.name}-${index}`}>
                    <TableCell>{row.name.trim() || "—"}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {summary.affEnabled ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold">Ajukan pencairan</h2>
              <p className="text-sm text-muted-foreground">
                Minimum {formatUsd(summary.minWithdrawUsd)}. Transfer bank diproses manual oleh admin.
              </p>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void onWithdraw(e)}>
              <div className="space-y-2">
                <Label htmlFor="wd-usd">Jumlah (USD)</Label>
                <Input
                  id="wd-usd"
                  type="number"
                  min={summary.minWithdrawUsd}
                  step="0.01"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wd-bank">Bank</Label>
                <Input id="wd-bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wd-account">No. rekening</Label>
                <Input
                  id="wd-account"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wd-name">Nama rekening</Label>
                <Input
                  id="wd-name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wd-note">Catatan (opsional)</Label>
                <Input id="wd-note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="md:col-span-2 pt-2">
                <Button type="submit" disabled={busy}>
                  Kirim permintaan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-xl font-bold">Riwayat pencairan</h2>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada permintaan pencairan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{new Date(w.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{formatUsd(w.amountUsd)}</TableCell>
                    <TableCell className="capitalize">{w.status}</TableCell>
                    <TableCell>
                      {w.bankName} · {w.bankAccount}
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
          <h2 className="font-heading text-xl font-bold">Ledger komisi</h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada komisi.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>USD</TableHead>
                  <TableHead>Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{row.kind}</TableCell>
                    <TableCell>{formatUsd(row.amountUsd)}</TableCell>
                    <TableCell className="max-w-[12rem] truncate font-mono text-xs">
                      {row.sourceOrderId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
