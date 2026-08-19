import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Robot,
  Brain,
  ChartLine,
  Code,
  Command,
  Cpu,
  Database,
  Gauge,
  Atom,
  ShieldCheck,
  Sparkle,
  Terminal,
  Lightning,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchPublicPortalModels, fetchShopConfig } from "../api/client";
import { ApiError } from "../api/types";
import type { ModelItem, ShopConfig, ShopModelItem } from "../api/types";
import { COMPANY } from "../lib/company";
import { Atmosphere } from "../components/Atmosphere";
import { BrandLockup } from "../components/BrandLogo";
import { STARTER_CREDIT } from "../config";
import { formatIdr, formatIdrPerUsdRate, usdToIdr } from "../lib/format";
import { easeOut } from "../lib/motion";

const features = [
  { icon: Robot, label: "Models", text: "Satu pintu ke model AI yang siap dipakai." },
  { icon: ChartLine, label: "Usage", text: "Pantau token dan biaya tanpa menebak." },
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
    icon: Code,
    label: "Coding agents & IDEs",
    text: "VS Code, Cursor, Antigravity, Claude Desktop, Codex Desktop, Claude Code & Codex.",
  },
  { icon: Brain, label: "Thinking", text: "Mode thinking untuk reasoning yang lebih dalam." },
  { icon: Lightning, label: "xhigh / ultra", text: "Weight tinggi untuk workload berat." },
  { icon: Sparkle, label: "RPM 20", text: "Rate limit default per API key baru." },
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
  const [catalog, setCatalog] = useState<ModelItem[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setShopLoading(true);
      setShopError(null);
      try {
        const [config, publicModels] = await Promise.all([
          fetchShopConfig(),
          fetchPublicPortalModels().catch(() => null),
        ]);
        if (cancelled) return;
        setShop(config);
        setCatalog(publicModels?.data ?? []);
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
  const models: Array<ShopModelItem | ModelItem> = [
    ...(catalog.length > 0 ? catalog : (shop?.models ?? [])),
  ].sort((a, b) => {
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
        <Link to="/">
          <BrandLockup
            showTagline={false}
            markClassName="size-8"
            nameClassName="font-sans text-xl"
            className="gap-2.5"
          />
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
              <span className="hidden sm:inline">Beli credit</span> <ArrowUpRight weight="bold" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-6 sm:pt-16 md:px-10 md:pb-20 md:pt-24">
        <section className="grid items-center gap-10 sm:gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="rise-in mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              AI infrastructure online
            </div>
            <h1 className="rise-in max-w-3xl text-balance font-sans text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-6xl lg:text-[4.75rem]">
              Build beyond
              <br />
              <span className="text-gradient">the ordinary.</span>
            </h1>
            <p className="rise-in rise-in-delay-1 mt-7 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {COMPANY.name} menyatukan akses model, observability, dan billing AI dalam satu mission
              control untuk builder yang bergerak cepat.
            </p>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button asChild size="lg" className="w-full sm:w-auto glow-primary">
                  <Link to="/beli">
                    Beli credit <ArrowUpRight weight="bold" />
                  </Link>
                </Button>
              </motion.div>
              <Link
                to="/login"
                className="group flex justify-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:justify-start"
              >
                <Command weight="duotone" className="size-4 text-primary" /> Enter with API key
              </Link>
            </div>
            <div className="rise-in rise-in-delay-3 mt-10 flex justify-between gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:mt-12 sm:justify-start sm:gap-8">
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

          <div className="relative mx-auto aspect-square w-full max-w-[460px] sm:w-[min(100%,460px)]">
            <div className="absolute inset-[12%] rounded-full border border-primary/30 [animation:ringSpinSlow_24s_linear_infinite]" />
            <div className="absolute inset-[23%] rounded-full border border-primary/25 [animation:ringSpinReverse_18s_linear_infinite]" />
            <div className="absolute inset-[34%] rounded-full border border-dashed border-white/15" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
              className="absolute left-1/2 top-1/2 flex size-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/40 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 shadow-[0_0_60px_-12px_rgba(249,115,22,0.55)] backdrop-blur-xl md:size-44"
            >
              <Atom weight="duotone" className="mb-2 size-8 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">
                Mind Aku
              </span>
              <span className="mt-1 text-xs text-foreground">AI CORE / 01</span>
            </motion.div>
            <div className="absolute left-[11%] top-[30%] rounded-lg border border-border/60 bg-card/70 p-3 shadow-[0_0_24px_-8px_rgba(249,115,22,0.35)] backdrop-blur-md [animation:pulseGlow_3.2s_ease-in-out_infinite]">
              <Cpu weight="duotone" className="size-5 text-primary" />
            </div>
            <div className="absolute bottom-[18%] right-[12%] rounded-lg border border-border/60 bg-card/70 p-3 shadow-[0_0_24px_-8px_rgba(249,115,22,0.35)] backdrop-blur-md [animation:pulseGlow_3.6s_ease-in-out_infinite_700ms]">
              <Gauge weight="duotone" className="size-5 text-primary" />
            </div>
            <div className="absolute right-[4%] top-[17%] rounded-lg border border-border/60 bg-card/70 p-3 shadow-[0_0_24px_-8px_rgba(249,115,22,0.35)] backdrop-blur-md [animation:pulseGlow_3s_ease-in-out_infinite_1400ms]">
              <ShieldCheck weight="duotone" className="size-5 text-accent" />
            </div>
          </div>
        </section>

        <section id="beli-credit" className="mt-20 border-t border-border/60 pt-10 sm:mt-24 sm:pt-12">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">Starter credit</p>
              <h2 className="mt-2 font-heading text-2xl font-bold md:text-3xl">
                Beli credit, langsung dapat API key.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Rate {formatIdrPerUsdRate(idrPerUsd)}. Bayar {formatIdr(amountIdr)}, dapat{" "}
                {formatUsdCredit(usdCredit)} credit · aktif {shop?.activePeriodDays ?? STARTER_CREDIT.activePeriodDays}{" "}
                hari · sisa saldo tidak hangus.
              </p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              PAYG · {shop?.activePeriodDays ?? STARTER_CREDIT.activePeriodDays} hari · QRIS · RPM {rpm}
            </p>
          </div>

          <div className="gradient-border overflow-hidden rounded-2xl bg-card/60 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md">
            <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="border-b border-border/60 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Paket tunggal
                </p>
                <p className="mt-3 font-sans text-4xl font-bold tracking-tight text-foreground md:text-[2.75rem]">
                  {formatIdr(amountIdr)}
                </p>
                <p className="mt-2 text-lg text-gradient">= {formatUsdCredit(usdCredit)} credit</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatIdrPerUsdRate(idrPerUsd)}</p>

                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Compatible with
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {compatibleTools.map((tool) => (
                      <li
                        key={tool}
                        className="rounded-lg border border-border/60 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/10"
                      >
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-10% 0px" }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                  className="mt-8 grid gap-4 sm:grid-cols-2"
                >
                  {creditHighlights.map(({ icon: Icon, label, text }) => (
                    <motion.div
                      key={label}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOut } },
                      }}
                      whileHover={{ y: -2 }}
                      className="rounded-xl border border-border/60 bg-white/[0.03] p-4 transition-colors hover:border-primary/30 hover:bg-white/[0.05]"
                    >
                      <Icon weight="duotone" className="size-4 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button asChild size="lg" className="mt-8 h-12 w-full">
                    <Link to="/beli">
                      Beli credit sekarang <ArrowUpRight weight="bold" />
                    </Link>
                  </Button>
                </motion.div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Isi nama → bayar QRIS → API key aktif {shop?.activePeriodDays ?? STARTER_CREDIT.activePeriodDays} hari
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
                  <p className="rounded-xl border border-border/60 bg-white/[0.03] px-4 py-6 text-sm text-muted-foreground">
                    {shopError}
                  </p>
                ) : null}

                {shopLoading && !shopError ? (
                  <p className="rounded-xl border border-border/60 bg-white/[0.03] px-4 py-6 text-sm text-muted-foreground">
                    Memuat katalog model…
                  </p>
                ) : null}

                {!shopLoading && !shopError && models.length === 0 ? (
                  <p className="rounded-xl border border-border/60 bg-white/[0.03] px-4 py-6 text-sm text-muted-foreground">
                    Belum ada model yang tersedia di paket ini.
                  </p>
                ) : null}

                {!shopLoading && models.length > 0 ? (
                  <div className="max-h-[420px] overflow-auto rounded-xl border border-border/60 bg-white/[0.02]">
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

        <section className="mt-24 border-t border-border/60 pt-8">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">
                Mission systems
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold">
                Everything you need to ship AI.
              </h2>
            </div>
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              SYS.STATUS / NOMINAL
            </span>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px" }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map(({ icon: Icon, label, text }) => (
              <motion.div
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: easeOut } },
                }}
                whileHover={{ y: -2 }}
                className="group relative bg-card/60 p-6 backdrop-blur-md transition-colors hover:bg-white/[0.04]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(400px 200px at 50% 0%, rgba(167,139,250,0.18), transparent 70%)",
                  }}
                />
                <Icon
                  weight="duotone"
                  className="relative mb-10 size-5 text-primary transition-transform group-hover:scale-110"
                />
                <p className="relative font-heading text-lg font-semibold">{label}</p>
                <p className="relative mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="mt-20 border-t border-border/60 pt-7 sm:mt-24">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.24em] text-muted-foreground">
            Resources
          </p>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground"
            aria-label="Public resources"
          >
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