import { Link } from "react-router-dom";
import { Atmosphere } from "../components/Atmosphere";
import { CommunityJoinSoftCta } from "../components/CommunityBanner";
import { Button } from "@/components/ui/button";

export function PaymentSuccessPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="relative z-10 max-w-md text-center">
        <p className="brand-reveal font-display text-4xl font-extrabold text-foreground">Credit masuk</p>
        <div className="mx-auto mt-5 accent-line" />
        <p className="rise-in rise-in-delay-1 mt-6 text-sm text-muted-foreground">
          Kalau transfer sukses, saldo pay as you go biasanya update sebentar setelah webhook tiba.
        </p>
        <CommunityJoinSoftCta className="rise-in rise-in-delay-2 mt-6" />
        <Button asChild className="rise-in rise-in-delay-3 mt-8 h-11 px-8">
          <Link to="/payments">Kembali ke top up</Link>
        </Button>
      </div>
    </div>
  );
}

export function PaymentCancelPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="relative z-10 max-w-md text-center">
        <p className="brand-reveal font-display text-4xl font-extrabold text-foreground">Dibatalkan</p>
        <div className="mx-auto mt-5 accent-line" />
        <p className="rise-in rise-in-delay-1 mt-6 text-sm text-muted-foreground">
          Tidak ada charge. Balik kapan saja kalau mau top up lagi.
        </p>
        <Button asChild className="rise-in rise-in-delay-2 mt-8 h-11 px-8">
          <Link to="/payments">Coba lagi</Link>
        </Button>
      </div>
    </div>
  );
}
