import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowsClockwise,
  Robot,
  Brain,
  Bug,
  ChartLine,
  Check,
  Code,
  CreditCard,
  Database,
  Desktop,
  Flame,
  Folders,
  GitBranch,
  Lightning,
  Minus,
  Monitor,
  Plugs,
  ShieldCheck,
  Sparkle,
  Terminal,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
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
import { BrandIcon } from "../components/BrandIcon";
import { BrandLockup } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { AI_BASE_URL, STARTER_CREDIT } from "../config";
import { formatIdr, formatIdrPerUsdRate, formatUsd, usdToIdr } from "../lib/format";
import { excludeResellModels } from "../lib/models";
import { easeOut } from "../lib/motion";

const compatibleTools = [
  "Claude Code",
  "Cursor",
  "VS Code",
  "Antigravity",
  "Codex",
  "OpenClaw",
  "Claude Desktop",
  "Hermes",
] as const;

/** Promo claim vs typical market FX — used for savings badges on the landing page. */
const MARKET_FX_MULTIPLIER = 15;

function formatIdrPer1M(usd: number | null | undefined, idrPerUsd: number): string {
  return formatIdr(usdToIdr(usd, idrPerUsd));
}

function CompareMark({ value }: { value: boolean }) {
  return value ? (
    <Check weight="bold" className="mx-auto size-5 text-primary" aria-hidden />
  ) : (
    <Minus weight="bold" className="mx-auto size-5 text-muted-foreground/50" aria-hidden />
  );
}

function formatTokenPriceUsd(usd: number | null | undefined): string {
  if (usd == null || Number.isNaN(usd)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(usd);
}

function formatCreditRateNote(idrPerUsd: number, t: (k: string, o?: Record<string, string>) => string): string {
  const n = idrPerUsd.toLocaleString("id-ID");
  return t("$1 = {{n}} rupiah · or $ = IDR / {{n}} (divisor)", { n });
}

export function HomePage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [shop, setShop] = useState<ShopConfig | null>(null);
  const [catalog, setCatalog] = useState<ModelItem[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);

  const features = useMemo(
    () => [
      { icon: Robot, label: t("Models"), text: t("One door to AI models ready to use.") },
      { icon: ChartLine, label: t("Usage"), text: t("Track tokens and spend without guessing.") },
      { icon: Terminal, label: t("Logs"), text: t("Trace usage metadata — not prompt content.") },
      { icon: Database, label: t("Top up"), text: t("Manage balance and experiment with confidence.") },
    ],
    [t]
  );

  const creditHighlights = useMemo(
    () => [
      {
        icon: Code,
        label: t("Coding agents & IDEs"),
        text: t("VS Code, Cursor, Antigravity, Claude Desktop, Codex Desktop, Claude Code & Codex."),
      },
      { icon: Brain, label: t("Thinking"), text: t("Thinking mode for deeper reasoning.") },
      { icon: Lightning, label: t("xhigh / ultra"), text: t("High weight for heavy workloads.") },
      { icon: Sparkle, label: t("RPM 20"), text: t("Default rate limit per new API key.") },
      {
        icon: ShieldCheck,
        label: t("Zero Data Retention"),
        text: t("Your prompts stay private — Zero Data Retention for request content."),
      },
    ],
    [t]
  );

  const whySwitch = useMemo(
    () => [
      {
        title: t("Official rates drain your budget"),
        text: t(
          "Coding agents resend system prompts every turn; official token rates add up fast. {{name}} credit is priced far below typical FX.",
          { name: COMPANY.name }
        ),
      },
      {
        title: t("Foreign card payments are a hassle"),
        text: t("Many official APIs only accept international cards. Top up with QRIS from {{amount}} — pay in rupiah.", {
          amount: formatIdr(STARTER_CREDIT.amountIdr),
        }),
      },
      {
        title: t("Single provider, single failure point"),
        text: t("If the primary provider is down, your work stops. Routing and failover help keep requests moving."),
      },
      {
        title: t("Switching models means rewriting integration"),
        text: t("One OpenAI-compatible gateway — change models with a parameter, not a rewrite."),
      },
    ],
    [t]
  );

  const devFeatures = useMemo(
    () => [
      {
        icon: Code,
        label: t("AI coding agents"),
        text: t(
          "Works with Claude Code, Codex CLI, Cursor, OpenClaw, Hermes, and any OpenAI or Anthropic-compatible tool."
        ),
      },
      {
        icon: GitBranch,
        label: t("Multi-model access"),
        text: t("Switch between GPT, Claude, Gemini, and more from one endpoint."),
      },
      {
        icon: CreditCard,
        label: t("Pay as you go"),
        text: t("Top up balance and pay only for tokens you use — transparent per-request pricing."),
      },
      {
        icon: Plugs,
        label: t("OpenAI compatible"),
        text: t("Point your existing SDK at our base URL — swap API key and URL, keep your code."),
      },
      {
        icon: ArrowsClockwise,
        label: t("Fast and reliable"),
        text: t("Retries, load balancing, and routing built in so requests reach an available provider."),
      },
    ],
    [t]
  );

  const howItWorks = useMemo(
    () => [
      { step: "01", title: t("Get your API key"), text: t("Buy credit and receive an API key right after payment.") },
      {
        step: "02",
        title: t("Point to {{name}}", { name: COMPANY.name }),
        text: t("Set the base URL — no need to rewrite the rest of your stack."),
      },
      { step: "03", title: t("Start building"), text: t("Send requests. We route, meter usage, and keep you within quota.") },
    ],
    [t]
  );

  const codingAgents = useMemo(
    () => [
      { name: "Claude Code", vendor: "Anthropic", text: t("Anthropic CLI — connect with base URL swap.") },
      { name: "Codex", vendor: "OpenAI", text: t("OpenAI CLI — point at Mind Aku gateway.") },
      { name: "Cursor", vendor: "IDE", text: t("IDE agent — Custom Endpoint / gateway config.") },
      { name: "Claude Desktop", vendor: "Anthropic", text: t("Desktop app — Developer Mode gateway fields.") },
    ],
    [t]
  );

  const compareRows = useMemo(
    () => [
      { label: t("All top AI models through one API"), us: true, them: false },
      { label: t("Auto routing when a provider has issues"), us: true, them: false },
      { label: t("Drop-in for Claude Code, Codex, Cursor, and more"), us: true, them: false },
      { label: t("No monthly subscription — pay only when you use"), us: true, them: false },
      { label: t("Transparent per-token pricing"), us: true, them: true },
      { label: t("Local top-up via QRIS — no foreign card"), us: true, them: false },
    ],
    [t]
  );

  const homeFaq = useMemo(
    () => [
      {
        q: t("Do I need a credit card?"),
        a: t("No. Buy credit with QRIS from {{amount}} — no international card required.", {
          amount: formatIdr(STARTER_CREDIT.amountIdr),
        }),
      },
      {
        q: t("What if my balance runs out?"),
        a: t(
          "Requests are checked before they run — top up anytime from the console or buy more credit. Unused balance never expires."
        ),
      },
      {
        q: t("Can I use Claude Code, Codex CLI, and Cursor?"),
        a: t(
          "Yes. Mind Aku speaks OpenAI-compatible APIs — change base URL and API key; your existing tools keep working."
        ),
      },
      {
        q: t("Is there a monthly subscription?"),
        a: t("No. Pure pay-as-you-go — you only pay for tokens you actually use."),
      },
      {
        q: t("Is my data safe?"),
        a: t(
          "We handle auth and routing only. Request content is not kept for training — see our privacy policy for details."
        ),
      },
    ],
    [t]
  );

  const officialTools = useMemo(
    () => [
      {
        name: "Claude Code",
        text: t("Claude Code · Official Anthropic CLI & extension for terminal or editor."),
      },
      {
        name: "Codex",
        text: t("Codex · OpenAI coding agent — swap base URL and go."),
      },
      {
        name: "OpenClaw",
        text: t("OpenClaw · Coding agent & gateway with full tool-calling support."),
      },
      {
        name: "Hermes",
        text: t("Hermes · Custom provider setup in a few steps."),
      },
    ],
    [t]
  );

  const supportedEditors = useMemo(
    () => ["VS Code", "Cursor", "Antigravity", "Claude Desktop"],
    []
  );

  const useCases = useMemo(
    () => [
      {
        tab: t("Understand codebase"),
        title: t("Understand a legacy project"),
        text: t(
          "Ask a flagship model to map the repo, dependencies, and data flow — without opening every file yourself."
        ),
        prompt: t("I'm new to this repo. Explain the architecture."),
        icon: Folders,
      },
      {
        tab: t("Fix a bug"),
        title: t("From bug report to patch"),
        text: t("Paste an error or QA issue — let the agent find the cause and prepare a fix."),
        prompt: t("Checkout fails: \"total NaN\" when a voucher is applied."),
        icon: Bug,
      },
      {
        tab: t("Refactor & test"),
        title: t("Refactor across files"),
        text: t("Large multi-file changes stay safer when each step is checked before you approve."),
        prompt: t("Move invoice logic from the controller into a service."),
        icon: Code,
      },
    ],
    [t]
  );

  const workplaces = useMemo(
    () => [
      {
        icon: Terminal,
        title: t("Start from the terminal"),
        text: t("Use Claude Code, Codex CLI, and your favorite command-line agents with the same balance."),
        href: "#how-it-works",
        cta: t("See how it works"),
      },
      {
        icon: Desktop,
        title: t("Built into the editor"),
        text: t("VS Code, Cursor, Antigravity, Claude Desktop — one API key across your stack."),
        href: "/beli",
        cta: t("Sign up & top up"),
      },
      {
        icon: Monitor,
        title: t("Monitor from anywhere"),
        text: t("Check balance and usage per model from the portal on desktop or phone."),
        href: "/login",
        cta: t("Open console"),
      },
    ],
    [t]
  );

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
          setShopError(
            err instanceof ApiError ? err.message : t("Failed to load model catalog.")
          );
        }
      } finally {
        if (!cancelled) setShopLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const amountIdr = shop?.amountIdr ?? STARTER_CREDIT.amountIdr;
  const usdCredit = shop?.usdCredit ?? STARTER_CREDIT.usdCredit;
  const idrPerUsd = shop?.idrPerUsd ?? STARTER_CREDIT.idrPerUsd;
  const rpm = shop?.requestsPerMinute ?? STARTER_CREDIT.requestsPerMinute;
  const activeDays = shop?.activePeriodDays ?? STARTER_CREDIT.activePeriodDays;
  const models: Array<ShopModelItem | ModelItem> = excludeResellModels([
    ...(catalog.length > 0 ? catalog : (shop?.models ?? [])),
  ]).sort((a, b) => {
    const byOutput =
      (b.pricing?.output ?? Number.NEGATIVE_INFINITY) -
      (a.pricing?.output ?? Number.NEGATIVE_INFINITY);
    if (byOutput !== 0) return byOutput;
    return a.id.localeCompare(b.id, undefined, { sensitivity: "base" });
  });

  const featuredModels = models.slice(0, 3);
  const pickerModels = models.slice(0, 6);
  const fxSavePct = Math.round((1 - 1 / MARKET_FX_MULTIPLIER) * 100);
  const marketIdrPerUsd = idrPerUsd * MARKET_FX_MULTIPLIER;
  const baseUrlDisplay = AI_BASE_URL.replace(/\/$/, "");
  const rateLabel = formatIdr(idrPerUsd);
  const marketRateLabel = formatIdr(marketIdrPerUsd);

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <Atmosphere />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-6 md:px-10">
        <Link to="/">
          <BrandLockup
            showTagline={false}
            markClassName="size-8"
            nameClassName="font-sans text-xl"
            className="gap-2.5"
          />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher className="mr-1" />
          <Link
            to="/beli"
            className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:block"
          >
            {t("Buy credit")}
          </Link>
          <Link
            to="/login"
            className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:block"
          >
            {t("Sign in")}
          </Link>
          <Button asChild size="sm">
            <Link to="/beli">
              <span className="sm:hidden">{t("Buy")}</span>
              <span className="hidden sm:inline">{t("Buy credit")}</span>{" "}
              <ArrowUpRight weight="bold" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-6 sm:pt-10 md:px-10 md:pb-20 md:pt-14">
        <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="rise-in inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            {t("$1 AI credit for only {{rate}}", { rate: rateLabel })}
          </div>

          <h1 className="rise-in mt-7 text-balance font-sans text-[clamp(2.25rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.03em] text-foreground">
            {t("Claude Code credit")}
            <span className="mt-1 block text-[clamp(2.5rem,7vw,4.5rem)] text-primary">
              {t("$1 only {{rate}}", { rate: rateLabel })}
            </span>
          </h1>

          <p className="rise-in rise-in-delay-1 mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            {t(
              "Access Claude Opus, Sonnet, GPT, and Gemini in Cursor through VS Code. No monthly subscription — top up from {{amount}}, pay as you go, and unused balance never expires.",
              { amount: formatIdr(amountIdr) }
            )}
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <motion.div whileTap={reduceMotion ? undefined : { scale: 0.97 }} className="w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto glow-primary">
                <Link to="/beli">
                  {t("Sign up & top up")} <ArrowUpRight weight="bold" />
                </Link>
              </Button>
            </motion.div>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <a href="#how-it-works">{t("See how it works")}</a>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("Save up to {{pct}}% vs official FX ≈{{market}} per $1.", {
              pct: String(fxSavePct),
              market: marketRateLabel,
            })}
          </p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOut, delay: 0.12 }}
            className="relative mt-12 w-full max-w-md"
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-[#12131a] shadow-[0_32px_80px_-28px_rgba(0,0,0,0.85)]">
              <div className="flex justify-center border-b border-white/5 px-4 py-4">
                <BrandIcon brand="claude" imgClassName="size-6" className="size-11 rounded-xl" />
              </div>
              <div className="px-3 pb-3 pt-2">
                <p className="px-2 py-2 text-left text-sm font-medium text-foreground">
                  {t("Select a model")}
                </p>
                <div className="space-y-1">
                  {shopLoading && pickerModels.length === 0 ? (
                    <p className="px-3 py-6 text-left text-sm text-muted-foreground">
                      {t("Loading model catalog…")}
                    </p>
                  ) : null}
                  {!shopLoading && pickerModels.length === 0 ? (
                    <p className="px-3 py-6 text-left text-sm text-muted-foreground">
                      {t("No models available in this package yet.")}
                    </p>
                  ) : null}
                  {pickerModels.map((model, index) => {
                    const input = formatTokenPriceUsd(model.pricing?.input);
                    const output = formatTokenPriceUsd(model.pricing?.output);
                    const selected = index === 0;
                    return (
                      <div
                        key={model.id}
                        className={
                          selected
                            ? "rounded-xl bg-white/[0.08] px-3 py-2.5 text-left"
                            : "rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <BrandIcon
                              model={model.id}
                              className="mt-0.5 size-7 rounded-md"
                              imgClassName="size-4"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {selected ? t("Default (recommended)") : model.id}
                              </p>
                              <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                {selected ? model.id : null}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 pt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                            {t("{{input}} / {{output}} per 1M tok", { input, output })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-14 w-full">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              {t("Works with")}
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {compatibleTools.map((tool) => (
                <li
                  key={tool}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <BrandIcon tool={tool} className="size-6 rounded-md border-0" imgClassName="size-3.5" />
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="kompatibilitas" className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {t("Compatibility")}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold md:text-3xl">
              {t("Official extensions supported")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {t("Use {{name}} credit through the tools and editors you already use every day.", {
                name: COMPANY.name,
              })}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t("Official tools")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {officialTools.map((tool) => (
                  <div key={tool.name} className="rounded-2xl border border-border/60 bg-card/80 p-5">
                    <BrandIcon tool={tool.name} className="size-10 rounded-xl" imgClassName="size-6" />
                    <p className="mt-3 font-heading text-base font-semibold">{tool.name}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t("Supported editors")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {supportedEditors.map((editor) => (
                  <div
                    key={editor}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-5"
                  >
                    <BrandIcon tool={editor} className="size-9 rounded-xl" imgClassName="size-5" />
                    <p className="font-heading text-sm font-semibold">{editor}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                {t("OpenAI & Anthropic compatible")} —{" "}
                {t(
                  "Any tool that accepts Base URL + API key can connect — Cursor, Cline, n8n, Dify, and your own SDK."
                )}
              </p>
            </div>
          </div>
        </section>

        <section id="model" className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {t("Premium models")}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold md:text-3xl">
                {t("Best premium models")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("One balance for everything. Prices shown per 1M tokens.")} · {formatIdrPerUsdRate(idrPerUsd)}
              </p>
            </div>
            <a
              href="#beli-credit"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("See all {{count}} models", { count: String(models.length || "…") })}{" "}
              <ArrowUpRight weight="bold" className="size-4" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shopLoading && featuredModels.length === 0 ? (
              <p className="col-span-full rounded-xl border border-border/60 bg-card/80 px-4 py-8 text-sm text-muted-foreground">
                {t("Loading model catalog…")}
              </p>
            ) : null}
            {(models.length > 0 ? models.slice(0, 9) : featuredModels).map((model) => (
              <div
                key={model.id}
                className="rounded-2xl border border-border/60 bg-card/80 p-5 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <BrandIcon model={model.id} className="size-9 rounded-xl" imgClassName="size-5" />
                  <p className="min-w-0 break-all font-mono text-sm font-semibold text-foreground">
                    {model.id}
                  </p>
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("IN")}</p>
                    <p className="mt-0.5 font-semibold tabular-nums">
                      {formatIdrPer1M(model.pricing?.input, idrPerUsd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("OUT")}</p>
                    <p className="mt-0.5 font-semibold tabular-nums">
                      {formatIdrPer1M(model.pricing?.output, idrPerUsd)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="topup" className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {t("Top up balance")}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold md:text-3xl">
              {t("Premium models, no monthly subscription.")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {t(
                "Not a subscription. Top up once, use as you go — {{rate}} per $1 credit. Unused balance never expires.",
                { rate: rateLabel }
              )}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t("Pay-as-you-go")}
              </p>
              <p className="mt-3 font-heading text-2xl font-bold">{t("No subscription fee · Pay for what you use")}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("Top up balance and pay only for tokens you use — transparent per-request pricing.")}
              </p>
            </div>
            <div className="relative rounded-2xl border border-primary/40 bg-primary/10 p-6 shadow-[0_0_40px_-16px_rgba(249,115,22,0.45)]">
              <span className="absolute -top-3 left-5 rounded-full border border-primary/40 bg-background px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {t("Most popular")}
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {t("Minimum top up")}
              </p>
              <p className="mt-3 font-sans text-4xl font-bold tracking-tight">{formatIdr(amountIdr)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("≈ {{credit}} AI credit · active {{days}} days", {
                  credit: formatUsd(usdCredit),
                  days: String(activeDays),
                })}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("Smallest amount to fund your balance. Pay once, use until it runs out.")}
              </p>
              <Button asChild size="lg" className="mt-6 w-full glow-primary">
                <Link to="/beli">
                  {t("Top up {{amount}}", { amount: formatIdr(amountIdr) })} <ArrowUpRight weight="bold" />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t("Promo credit")}
              </p>
              <p className="mt-3 font-heading text-2xl font-bold">{t("Up to 15× cheaper than market FX.")}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("Save up to {{pct}}% vs official FX ≈{{market}} per $1.", {
                  pct: String(fxSavePct),
                  market: marketRateLabel,
                })}
              </p>
              <Button asChild size="lg" variant="outline" className="mt-6 w-full">
                <Link to="/beli">{t("Claim promo")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="contoh" className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {t("What can you get done?")}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold md:text-3xl">
              {t("What can you get done?")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("Same models as official — the difference is how you pay.")}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {useCases.map(({ icon: Icon, tab, title, text, prompt }) => (
              <div key={title} className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80">
                <div className="border-b border-border/60 bg-black/30 px-4 py-3 font-mono text-[11px] text-muted-foreground">
                  zsh — {tab.toLowerCase().replace(/\s+/g, "-")}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-mono text-xs leading-6 text-primary">
                    {">"} {prompt}
                  </p>
                  <div className="mt-5 flex items-start gap-3">
                    <Icon weight="duotone" className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-heading text-base font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="tempat-kerja" className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">
              {t("Fits where you already code")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("No need to change habits. {{name}} credit works in the tools you open every day.", {
                name: COMPANY.name,
              })}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workplaces.map(({ icon: Icon, title, text, href, cta }) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-card/80 p-6">
                <Icon weight="duotone" className="size-6 text-primary" />
                <p className="mt-4 font-heading text-lg font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                {href.startsWith("/") ? (
                  <Link to={href} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {cta} <ArrowUpRight weight="bold" className="size-4" />
                  </Link>
                ) : (
                  <a href={href} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {cta} <ArrowUpRight weight="bold" className="size-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-4 border-y border-border/60 py-10 sm:grid-cols-3 sm:gap-6">
          <div className="text-center sm:text-left">
            <p className="font-mono text-2xl font-bold text-foreground md:text-3xl">
              {shopLoading ? "…" : models.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("Active AI models")}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-mono text-2xl font-bold text-foreground md:text-3xl">PAYG</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("Pay-as-you-go")}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-mono text-2xl font-bold text-foreground md:text-3xl">{formatIdr(amountIdr)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("Top up")} · QRIS</p>
          </div>
        </section>

        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">
              {t("Why developers switch to {{name}}", { name: COMPANY.name })}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {t("Pain points with official APIs — and how {{name}} fixes them.", { name: COMPANY.name })}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {whySwitch.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-card/80 p-6 transition-colors hover:border-primary/30"
              >
                <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {t("Built for AI-powered development")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              {t("Everything you need to run coding agents, chatbots, and AI apps through one simple API.")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devFeatures.map(({ icon: Icon, label, text }) => (
              <div key={label} className="rounded-2xl border border-border/60 bg-card/80 p-5">
                <Icon weight="duotone" className="size-5 text-primary" />
                <p className="mt-4 font-heading text-base font-semibold">{label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">{t("How it works")}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {t("Your request flows through {{name}} in milliseconds — we handle routing, billing, and failover.", {
                name: COMPANY.name,
              })}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,0.9fr)] lg:gap-10">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {howItWorks.map((item) => (
                <div key={item.step} className="flex gap-4 rounded-2xl border border-border/60 bg-card/80 p-5">
                  <span className="font-mono text-lg font-bold text-primary">{item.step}</span>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/60 bg-black/40 p-5 font-mono text-xs leading-6 text-muted-foreground sm:text-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Base URL</p>
              <code className="mt-2 block break-all text-foreground">{baseUrlDisplay}</code>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Authorization</p>
              <code className="mt-2 block text-foreground">Bearer YOUR_API_KEY</code>
            </div>
          </div>
        </section>

        <section className="mt-20 border-t border-border/60 pt-12">
          <h2 className="mb-8 font-heading text-2xl font-bold md:text-3xl">
            {t("Works with your favorite coding agents")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {codingAgents.map((agent) => (
              <div key={agent.name} className="rounded-2xl border border-border/60 bg-card/80 p-5">
                <BrandIcon tool={agent.name} className="size-10 rounded-xl" imgClassName="size-6" />
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {agent.vendor}
                </p>
                <p className="mt-1 font-heading text-lg font-semibold">{agent.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{agent.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">{t("No reason to stay on the old way")}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("What you gain by switching to {{name}} versus paying official APIs directly.", {
                name: COMPANY.name,
              })}
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-card/90 hover:bg-card/90">
                  <TableHead>{t("Feature")}</TableHead>
                  <TableHead className="text-center">{COMPANY.name}</TableHead>
                  <TableHead className="text-center">{t("The old way")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="text-sm">{row.label}</TableCell>
                    <TableCell className="text-center">
                      <CompareMark value={row.us} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CompareMark value={row.them} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="glow-primary">
              <Link to="/beli">
                {t("Feel the difference — buy credit today")} <ArrowUpRight weight="bold" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="beli-credit" className="mt-20 border-t border-border/60 pt-10 sm:mt-24 sm:pt-12">
          <div className="mb-6 overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 sm:mb-8 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/20 text-primary">
                  <Flame weight="fill" className="size-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    {t("Promo credit")}
                  </p>
                  <p className="mt-1 font-heading text-lg font-bold text-foreground sm:text-xl">
                    {t("Up to 15× cheaper than market FX.")}
                  </p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {t(
                      "Rate {{rate}}. Pay in rupiah, get far more USD credit — unused balance never expires.",
                      { rate: formatCreditRateNote(idrPerUsd, t) }
                    )}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0 self-stretch sm:self-center">
                <Link to="/beli">
                  {t("Claim promo")} <ArrowUpRight weight="bold" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">
                {t("Starter credit")}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold md:text-3xl">
                {t("Buy credit, get an API key instantly.")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t(
                  "Rate {{rate}}. Pay {{amount}}, get {{credit}} credit · active {{days}} days · unused balance never expires.",
                  {
                    rate: formatIdrPerUsdRate(idrPerUsd),
                    amount: formatIdr(amountIdr),
                    credit: formatUsd(usdCredit),
                    days: String(activeDays),
                  }
                )}
              </p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              PAYG · {activeDays} · QRIS · RPM {rpm}
            </p>
          </div>

          <div className="gradient-border overflow-hidden rounded-2xl bg-card/90 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.7)]">
            <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="border-b border-border/60 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("Single package")}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    <Flame weight="fill" className="size-3" />
                    {t("15× cheaper badge")}
                  </span>
                </div>
                <p className="mt-3 font-sans text-4xl font-bold tracking-tight text-foreground md:text-[2.75rem]">
                  {formatIdr(amountIdr)}
                </p>
                <p className="mt-2 text-lg text-gradient">
                  {t("= {{credit}} credit", { credit: formatUsd(usdCredit) })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{formatIdrPerUsdRate(idrPerUsd)}</p>

                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("Compatible with")}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {compatibleTools.map((tool) => (
                      <li
                        key={tool}
                        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/10"
                      >
                        <BrandIcon
                          tool={tool}
                          className="size-5 rounded-md border-0"
                          imgClassName="size-3.5"
                        />
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.div
                  initial={reduceMotion ? false : "hidden"}
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
                      whileHover={reduceMotion ? undefined : { y: -2 }}
                      className="rounded-xl border border-border/60 bg-white/[0.03] p-4 transition-colors hover:border-primary/30 hover:bg-white/[0.05]"
                    >
                      <Icon weight="duotone" className="size-4 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                  <Button asChild size="lg" className="mt-8 h-12 w-full">
                    <Link to="/beli">
                      {t("Buy credit now")} <ArrowUpRight weight="bold" />
                    </Link>
                  </Button>
                </motion.div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {t("Enter name → pay with QRIS → API key active {{days}} days", {
                    days: String(activeDays),
                  })}
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("Models")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("Input / output / cache price per 1M tokens ($)")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("Rate {{rate}}. Pay in rupiah, get far more USD credit — unused balance never expires.", {
                        rate: formatCreditRateNote(idrPerUsd, t),
                      }).split(".")[0]}
                      .
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {shopLoading ? "…" : t("{{count}} models", { count: String(models.length) })}
                  </span>
                </div>

                {shopError ? (
                  <p className="rounded-xl border border-border/60 bg-white/[0.03] px-4 py-6 text-sm text-muted-foreground">
                    {shopError}
                  </p>
                ) : null}

                {shopLoading && !shopError ? (
                  <p className="rounded-xl border border-border/60 bg-white/[0.03] px-4 py-6 text-sm text-muted-foreground">
                    {t("Loading model catalog…")}
                  </p>
                ) : null}

                {!shopLoading && !shopError && models.length === 0 ? (
                  <p className="rounded-xl border border-border/60 bg-white/[0.03] px-4 py-6 text-sm text-muted-foreground">
                    {t("No models available in this package yet.")}
                  </p>
                ) : null}

                {!shopLoading && models.length > 0 ? (
                  <div className="max-h-[420px] overflow-auto rounded-xl border border-border/60 bg-white/[0.02]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("Model")}</TableHead>
                          <TableHead className="text-right">{t("Input")}</TableHead>
                          <TableHead className="text-right">{t("Output")}</TableHead>
                          <TableHead className="text-right">{t("Cached")}</TableHead>
                          <TableHead className="text-right">{t("Cache Creation")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models.map((model) => (
                          <TableRow key={model.id}>
                            <TableCell className="font-mono text-xs sm:text-sm">
                              <span className="inline-flex items-center gap-2">
                                <BrandIcon
                                  model={model.id}
                                  className="size-6 rounded-md"
                                  imgClassName="size-3.5"
                                />
                                <span>{model.id}</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                              {formatTokenPriceUsd(model.pricing?.input)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                              {formatTokenPriceUsd(model.pricing?.output)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                              {formatTokenPriceUsd(model.pricing?.cached)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                              {formatTokenPriceUsd(model.pricing?.cache_creation)}
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
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">
                {t("Built for company review")}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold">
                {t("Evidence your security team can check in minutes.")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t(
                  "Zero Data Retention for request content, no training on your data, metadata-only logs, and a printable policy for procurement."
                )}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
              <Link to="/privacy-policy">
                {t("Open trust policy")} <ArrowUpRight weight="bold" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: t("No content archive"),
                text: t("Prompts and outputs are not kept by Mind Aku after delivery."),
              },
              {
                title: t("No model training"),
                text: t("Your code and documents are not used to train or fine-tune models."),
              },
              {
                title: t("Metadata-only logs"),
                text: t("Portal logs show tokens, model, status, and spend — not transcripts."),
              },
              {
                title: t("Printable for vendors"),
                text: t("Share the policy URL or print the one-pager for internal approval."),
              },
            ].map((item) => (
              <div key={item.title} className="bg-card/90 p-5 sm:p-6">
                <div className="mb-4 flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                  <ShieldCheck weight="fill" className="size-4 text-primary" />
                </div>
                <p className="font-heading text-base font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 border-t border-border/60 pt-8">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">
                {t("Mission systems")}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold">
                {t("Everything you need to ship AI.")}
              </h2>
            </div>
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              SYS.STATUS / NOMINAL
            </span>
          </div>
          <motion.div
            initial={reduceMotion ? false : "hidden"}
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
                whileHover={reduceMotion ? undefined : { y: -2 }}
                className="group relative bg-card/90 p-6 transition-colors hover:bg-white/[0.04]"
              >
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

        <section className="mt-20 border-t border-border/60 pt-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold md:text-3xl">{t("Common questions before you buy")}</h2>
            </div>
            <Link to="/faq" className="text-sm font-medium text-primary hover:underline">
              {t("View full FAQ")} →
            </Link>
          </div>
          <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/80">
            {homeFaq.map((item) => (
              <details key={item.q} className="group px-5 py-4 sm:px-6">
                <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-20 overflow-hidden rounded-3xl border border-primary/35 bg-gradient-to-br from-primary/20 via-card/90 to-card/90 p-8 text-center sm:p-12">
          <h2 className="font-heading text-2xl font-bold md:text-3xl">
            {t("Start saving — use {{name}} today", { name: COMPANY.name })}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {t(
              "Create an account path via credit purchase, grab your API key, and connect Claude Code, Codex, or any agent in minutes."
            )}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto glow-primary">
              <Link to="/beli">
                {t("Buy credit now")} <ArrowUpRight weight="bold" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/faq">{t("View documentation")}</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20 border-t border-border/60 pt-7 sm:mt-24">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.24em] text-muted-foreground">
            {t("Resources")}
          </p>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground"
            aria-label={t("Public resources")}
          >
            <Link className="transition hover:text-primary" to="/faq">
              {t("FAQ")}
            </Link>
            <Link className="transition hover:text-primary" to="/refund-policy">
              {t("Refund policy")}
            </Link>
            <Link className="transition hover:text-primary" to="/terms-and-conditions">
              {t("Terms & conditions")}
            </Link>
            <Link className="transition hover:text-primary" to="/privacy-policy">
              {t("Privacy & data retention")}
            </Link>
            <Link className="transition hover:text-primary" to="/kontak">
              {t("Contact")}
            </Link>
          </nav>
        </section>
      </main>
    </div>
  );
}
