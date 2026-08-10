import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Brain,
  ChartNoAxesCombined,
  Code2,
  Command,
  Cpu,
  Database,
  Gauge,
  Orbit,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchShopConfig } from "../api/client";
import { ApiError } from "../api/types";
import type { ShopConfig, ShopModelItem } from "../api/types";
import { COMPANY } from "../lib/company";
import { Atmosphere } from "../components/Atmosphere";
import { STARTER_CREDIT } from "../config";
import { formatIdr, formatIdrPerUsdRate, usdToIdr } from "../lib/format";

const features = [
  { icon: Bot, label: "Models", text: "Satu pintu ke model AI yang siap dipakai." },
  { icon: ChartNoAxesCombined, label: "Usage", text: "Pantau token dan biaya tanpa menebak." },
  { icon: Terminal, label: "Logs", text: "Telusuri setiap request dari prompt ke output." },
  { icon: Database, label: "Top up", text: "Kelola saldo dan eksperimen dengan tenang." },
];

const compatibleTools = [
  "Visual Studio Code",
  "Claude Desktop",
  "Codex Desktop",
  "Antigravity",
  "Cursor",
  "Claude Code",
  "Codex",
] as const;

const creditHighlights = [
  {
    icon: Code2,
    label: "Coding agents & IDEs",
    text: "VS Code, Cursor, Antigravity, Claude Desktop, Codex Desktop, Claude Code & Codex.",
  },
  { icon: Brain, label: "Thinking", text: "Mode thinking untuk reasoning yang lebih dalam." },
  { icon: Zap, label: "xhigh / ultra", text: "Weight tinggi untuk workload berat." },
  { icon: Sparkles, label: "RPM 20", text: "Rate limit default per API key baru." },
];

function formatTokenPriceIdr(usd: number | null | undefined, idrPerUsd: number): string {
  const idr = usdToIdr(usd, idrPerUsd);
  if (idr == null) return "—";
  // Keep whole rupiah for typical rates; show decimals only for sub-rupiah edge cases.
  const digits = idr >= 1 || idr === 0 ? 0 : 2;
  return formatIdr(idr, digits);
}

function formatUsdCredit(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function HomePage() {
  const [shop, setShop] = useState<ShopConfig | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setShopLoading(true);
      setShopError(null);
      try {
        const config = await fetchShopConfig();
        if (!cancelled) setShop(config);
      } catch (err) {
        if (!cancelled) {
          setShopError(err instanceof ApiError ? err.message : "Gagal memuat katalog model.");
        }
      } finally {
        if (!cancelled) setShopLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const amountIdr = shop?.amountIdr ?? STARTER_CREDIT.amountIdr;
  const usdCredit = shop?.usdCredit ?? STARTER_CREDIT.usdCredit;
  const idrPerUsd = shop?.idrPerUsd ?? STARTER_CREDIT.idrPerUsd;
  const rpm = shop?.requestsPerMinute ?? STARTER_CREDIT.requestsPerMinute;
  const models: ShopModelItem[] = [...(shop?.models ?? [])].sort((a, b) => {
    const byOutput =
      (b.pricing?.output ?? Number.NEGATIVE_INFINITY) -
      (a.pricing?.output ?? Number.NEGATIVE_INFINITY);
    if (byOutput !== 0) return byOutput;
    return a.id.localeCompare(b.id, undefined, { sensitivity: "base" });
  });

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <Atmosphere />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          {COMPANY.name}
          <span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/beli"
            className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:block"
          >
            Beli credit
          </Link>
          <Link
            to="/login"
            className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link to="/beli">
              <span className="sm:hidden">Beli</span>
              <span className="hidden sm:inline">Beli credit</span> <ArrowUpRight />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-6 sm:pt-16 md:px-10 md:pb-20 md:pt-24">
        <section className="grid items-center gap-10 sm:gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="rise-in mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> AI infrastructure
              online
            </div>
            <h1 className="brand-reveal max-w-3xl font-display text-[clamp(2.75rem,12vw,5rem)] font-extrabold leading-[.95] tracking-[-.06em] md:text-8xl">
              Build beyond
              <br />
              <span className="bg-gradient-to-r from-primary via-[var(--signal)] to-[var(--sky)] bg-clip-text text-transparent">
                the ordinary.
              </span>
            </h1>
            <p className="rise-in rise-in-delay-1 mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {COMPANY.name} menyatukan akses model, observability, dan billing AI dalam satu mission
              control untuk builder yang bergerak cepat.
            </p>
            <div className="rise-in rise-in-delay-2 mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/beli">
                  Beli credit <ArrowUpRight />
                </Link>
              </Button>
              <Link
                to="/login"
                className="group flex justify-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:justify-start"
              >
                <Command className="size-4 text-primary" /> Enter with API key
              </Link>
            </div>
            <div className="rise-in rise-in-delay-3 mt-10 flex justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:mt-12 sm:justify-start sm:gap-8">
              <span>
                <strong className="block font-mono text-lg text-foreground">01</strong>Control center
              </span>
              <span>
                <strong className="block font-mono text-lg text-foreground">24/7</strong>Telemetry
              </span>
              <span>
                <strong className="block font-mono text-lg text-foreground">∞</strong>Possibility
              </span>
            </div>
          </div>

          <div className="scale-in relative mx-auto aspect-square w-full max-w-[460px] sm:w-[min(100%,460px)]">
            <div className="absolute inset-[12%] rounded-full border border-primary/30 [animation:ringSpin_24s_linear_infinite]" />
            <div className="absolute inset-[23%] rounded-full border border-[var(--sky)]/25 [animation:ringSpinReverse_18s_linear_infinite]" />
            <div className="absolute inset-[34%] rounded-full border border-dashed border-white/15" />
            <div className="absolute left-1/2 top-1/2 flex size-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/50 bg-card/80 shadow-[0_0_80px_rgba(255,90,31,.22)] backdrop-blur-xl md:size-44">
              <Orbit className="mb-2 size-8 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">
                Mind Aku
              </span>
              <span className="mt-1 text-xs text-foreground">AI CORE / 01</span>
            </div>
            <div className="absolute left-[11%] top-[30%] animate-pulse rounded-lg border border-border bg-card/80 p-3 backdrop-blur-md">
              <Cpu className="size-5 text-[var(--sky)]" />
            </div>
            <div className="absolute bottom-[18%] right-[12%] animate-pulse rounded-lg border border-border bg-card/80 p-3 backdrop-blur-md [animation-delay:700ms]">
              <Gauge className="size-5 text-[var(--signal)]" />
            </div>
            <div className="absolute right-[4%] top-[17%] rounded-lg border border-border bg-card/80 p-3 backdrop-blur-md">
              <ShieldCheck className="size-5 text-primary" />
            </div>
          </div>
        </section>

        <section id="beli-credit" className="mt-20 border-t border-border pt-10 sm:mt-24 sm:pt-12">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">Starter credit</p>
              <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">Beli credit, langsung dapat API key.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Rate {formatIdrPerUsdRate(idrPerUsd)}. Bayar {formatIdr(amountIdr)}, dapat{" "}
                {formatUsdCredit(usdCredit)} credit di API key.
              </p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">PAYG · QRIS · RPM {rpm}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card/70 shadow-[0_0_60px_rgba(255,90,31,.08)] backdrop-blur-md">
            <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Paket tunggal
                </p>
                <p className="mt-3 font-display text-5xl font-extrabold tracking-tight text-foreground">
                  {formatIdr(amountIdr)}
                </p>
                <p className="mt-2 text-lg text-primary">= {formatUsdCredit(usdCredit)} credit</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatIdrPerUsdRate(idrPerUsd)}</p>

                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Compatible with
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {compatibleTools.map((tool) => (
                      <li
                        key={tool}
                        className="rounded-lg border border-border/80 bg-background/40 px-2.5 py-1.5 text-xs font-medium text-foreground"
                      >
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {creditHighlights.map(({ icon: Icon, label, text }) => (
                    <div key={label} className="rounded-xl border border-border/80 bg-background/40 p-4">
                      <Icon className="size-4 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>

                <Button asChild size="lg" className="mt-8 h-12 w-full">
                  <Link to="/beli">
                    Beli credit sekarang <ArrowUpRight />
                  </Link>
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Isi nama → bayar QRIS → API key langsung aktif
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Models
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Harga input / output per 1M tokens (IDR)
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {shopLoading ? "…" : `${models.length} models`}
                  </span>
                </div>

                {shopError ? (
                  <p className="rounded-xl border border-border bg-background/40 px-4 py-6 text-sm text-muted-foreground">
                    {shopError}
                  </p>
                ) : null}

                {shopLoading && !shopError ? (
                  <p className="rounded-xl border border-border bg-background/40 px-4 py-6 text-sm text-muted-foreground">
                    Memuat katalog model…
                  </p>
                ) : null}

                {!shopLoading && !shopError && models.length === 0 ? (
                  <p className="rounded-xl border border-border bg-background/40 px-4 py-6 text-sm text-muted-foreground">
                    Belum ada model yang tersedia di paket ini.
                  </p>
                ) : null}

                {!shopLoading && models.length > 0 ? (
                  <div className="max-h-[420px] overflow-auto rounded-xl border border-border bg-background/40">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model</TableHead>
                          <TableHead className="text-right">Input</TableHead>
                          <TableHead className="text-right">Output</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models.map((model) => (
                          <TableRow key={model.id}>
                            <TableCell className="font-mono text-xs sm:text-sm">
                              {model.id}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                              {formatTokenPriceIdr(model.pricing?.input, idrPerUsd)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                              {formatTokenPriceIdr(model.pricing?.output, idrPerUsd)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 border-t border-border pt-8">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">Mission systems</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Everything you need to ship AI.</h2>
            </div>
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">SYS.STATUS / NOMINAL</span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, label, text }) => (
              <div key={label} className="group bg-card/80 p-6 transition hover:bg-card">
                <Icon className="mb-10 size-5 text-primary transition group-hover:scale-110" />
                <p className="font-display text-lg font-semibold">{label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 border-t border-border pt-7 sm:mt-24">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.24em] text-muted-foreground">Resources</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground" aria-label="Public resources">
            <Link className="transition hover:text-primary" to="/faq">
              FAQ
            </Link>
            <Link className="transition hover:text-primary" to="/refund-policy">
              Refund policy
            </Link>
            <Link className="transition hover:text-primary" to="/terms-and-conditions">
              Terms &amp; conditions
            </Link>
            <Link className="transition hover:text-primary" to="/kontak">
              Kontak
            </Link>
          </nav>
        </section>
      </main>
    </div>
  );
}
