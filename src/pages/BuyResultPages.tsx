import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { claimShopOrder } from "../api/client";
import { ApiError } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Atmosphere } from "../components/Atmosphere";
import { ErrorBanner } from "../components/page-chrome";
import { clearGuestClaimSecret, readGuestClaimSecret } from "../lib/guestClaim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POLL_MS = 2000;
const MAX_POLLS = 45;

export function BuySuccessPage() {
  const [params] = useSearchParams();
  const orderId = (params.get("order") || "").trim();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"waiting" | "ready" | "error">("waiting");
  const [message, setMessage] = useState("Menunggu konfirmasi pembayaran…");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!orderId) {
      setStatus("error");
      setError("Order tidak ditemukan di URL.");
      return;
    }

    const claimSecret = readGuestClaimSecret(orderId);
    if (!claimSecret) {
      setStatus("error");
      setError("Sesi klaim hilang. Buka halaman beli dari browser yang sama tempat kamu checkout.");
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
          setMessage("Pembayaran diterima. Menyiapkan API key…");
          if (polls >= MAX_POLLS) {
            setStatus("error");
            setError("Timeout menunggu pembayaran. Kalau sudah bayar, hubungi admin dengan order ID kamu.");
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
          setMessage("API key siap. Simpan sekarang — hanya ditampilkan sekali.");
          clearGuestClaimSecret(orderId);
          try {
            await login(result.apiKey, { remember: true });
            window.setTimeout(() => navigate("/console", { replace: true }), 2500);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Key siap, tapi auto-login gagal. Copy key lalu masuk manual."
            );
          }
          return;
        }
        setStatus("error");
        setError("Respons klaim tidak dikenali.");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 409) {
          setStatus("error");
          setError("API key sudah diklaim. Kalau kamu sudah login, buka console.");
          clearGuestClaimSecret(orderId);
          return;
        }
        setStatus("error");
        setError(err instanceof ApiError ? err.message : "Gagal mengklaim API key.");
      }
    }

    void tryClaim();
    return () => {
      cancelled = true;
    };
  }, [orderId, login, navigate]);

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

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="relative z-10 w-full max-w-md text-center">
        <p className="brand-reveal font-display text-4xl font-extrabold text-foreground">
          {status === "ready" ? "Siap dipakai" : status === "error" ? "Ada masalah" : "Hampir selesai"}
        </p>
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
              {copied ? "Tersalin" : "Copy API key"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Mengarahkan ke console…
            </p>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="h-11 px-8">
              <Link to="/beli">Coba lagi</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-8">
              <Link to="/login">Sign in</Link>
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
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="relative z-10 max-w-md text-center">
        <p className="brand-reveal font-display text-4xl font-extrabold text-foreground">Dibatalkan</p>
        <div className="mx-auto mt-5 accent-line" />
        <p className="rise-in rise-in-delay-1 mt-6 text-sm text-muted-foreground">
          Tidak ada charge. Kembali kapan saja kalau mau beli akses.
        </p>
        <Button asChild className="rise-in rise-in-delay-2 mt-8 h-11 px-8">
          <Link to="/beli">Kembali ke beli</Link>
        </Button>
      </div>
    </div>
  );
}
