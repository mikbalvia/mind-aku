import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  Check,
  CaretRight,
  Copy,
  Flame,
  Gauge,
  Sparkle,
  X,
  Lightning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ModelHighlight = {
  id: string;
  name: string;
  family: string;
  badge: string;
  accent: string;
  glow: string;
  icon: ReactNode;
  description: string;
  input: number;
  output: number;
  context: string;
  bestFor: string;
};

const PRICING_NOTE = "USD per 1M tokens";

const NEW_MODELS: ModelHighlight[] = [
  {
    id: "deepseek-v4-pro",
    name: "deepseek-v4-pro",
    family: "DeepSeek",
    badge: "Pro",
    accent: "from-primary/30 via-primary/15 to-transparent",
    glow: "rgba(249, 115, 22, 0.45)",
    icon: <Gauge weight="duotone" className="size-4" />,
    description:
      "Reasoning dalam untuk agent, code review, dan analisis panjang. Kualitas setingkat flagship, harga inference.",
    input: 0.35,
    output: 1.30,
    context: "128K",
    bestFor: "Agent · Code · Reasoning",
  },
  {
    id: "deepseek-v4-flash",
    name: "deepseek-v4-flash",
    family: "DeepSeek",
    badge: "Flash",
    accent: "from-primary/25 via-primary/10 to-transparent",
    glow: "rgba(251, 146, 60, 0.45)",
    icon: <Lightning weight="duotone" className="size-4" />,
    description:
      "Latency rendah, throughput tinggi. Ideal untuk chat harian, autocomplete, dan pipeline RAG volume besar.",
    input: 0.08,
    output: 0.30,
    context: "128K",
    bestFor: "Chat · RAG · Bulk",
  },
  {
    id: "minimax-m3",
    name: "minimax-m3",
    family: "MiniMax",
    badge: "M3",
    accent: "from-primary/30 via-primary/15 to-transparent",
    glow: "rgba(249, 115, 22, 0.45)",
    icon: <Sparkle weight="duotone" className="size-4" />,
    description:
      "Model multimodal yang ringan. Multibahasa kuat, cocok untuk customer support dan ringkasan dokumen.",
    input: 0.20,
    output: 0.80,
    context: "256K",
    bestFor: "Support · Multilingual",
  },
  {
    id: "glm-5.2",
    name: "glm-5.2",
    family: "Zhipu · GLM",
    badge: "5.2",
    accent: "from-primary/30 via-primary/15 to-transparent",
    glow: "rgba(249, 115, 22, 0.45)",
    icon: <Flame weight="duotone" className="size-4" />,
    description:
      "Generasi terbaru GLM, akurasi lebih tinggi pada tool use dan structured output. Premium murah untuk workflow produksi.",
    input: 0.50,
    output: 2.00,
    context: "128K",
    bestFor: "Tools · Production",
  },
];

const REFERENCE = {
  sonnet: { label: "Claude Sonnet 4.5", input: 3.0, output: 15.0 },
  opus: { label: "Claude Opus 5", input: 15.0, output: 75.0 },
};

const COMPARISON_TARGET = REFERENCE.sonnet;

function formatRate(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value);
}

function savings(input: number, output: number): number {
  // Weighted blend 70% output / 30% input — typical chat workload is output-heavy.
  const ours = 0.3 * input + 0.7 * output;
  const ref = 0.3 * COMPARISON_TARGET.input + 0.7 * COMPARISON_TARGET.output;
  return Math.round((1 - ours / ref) * 100);
}

function ModelCard({ model }: { model: ModelHighlight }) {
  const pct = savings(model.input, model.output);
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      style={
        {
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 18px 40px -22px ${model.glow}`,
        } as React.CSSProperties
      }
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${model.accent} opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-background/70 text-foreground"
              style={{ color: model.glow }}
            >
              {model.icon}
            </span>
            <div className="leading-tight">
              <p className="font-mono text-[13px] font-semibold text-foreground">{model.name}</p>
              <p className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:block">
                {model.family}
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-success">
            <ArrowDown weight="bold" className="mr-0.5 size-3" />
            {pct}%
          </span>
        </div>

        <p className="mt-3 hidden text-[12px] leading-snug text-muted-foreground sm:block">
          {model.description}
        </p>

        <div className="mt-3 flex items-baseline gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              In
            </p>
            <p className="font-heading text-sm font-semibold text-foreground tabular-nums">
              {formatRate(model.input)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Out
            </p>
            <p className="font-heading text-sm font-semibold text-foreground tabular-nums">
              {formatRate(model.output)}
            </p>
          </div>
          <p className="ml-auto hidden items-center gap-1 rounded-full border border-border/80 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            <Check weight="bold" className="size-3 text-primary" />
            {model.bestFor}
          </p>
        </div>
      </div>
    </div>
  );
}

function CompareRow() {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Perbandingan {PRICING_NOTE}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Claude Opus 5
          </p>
          <p className="font-heading text-sm font-semibold text-foreground/70 tabular-nums line-through decoration-1">
            {formatRate(REFERENCE.opus.input)}/{formatRate(REFERENCE.opus.output)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Sonnet 4.5
          </p>
          <p className="font-heading text-sm font-semibold text-foreground/70 tabular-nums line-through decoration-1">
            {formatRate(REFERENCE.sonnet.input)}/{formatRate(REFERENCE.sonnet.output)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-primary">
            Model Baru
          </p>
          <p className="font-heading text-sm font-semibold text-foreground tabular-nums">
            mulai $0.08
          </p>
        </div>
      </div>
    </div>
  );
}

const ANNOUNCEMENT_ID = "new-models-2026-08-05";

function storageKey(id: string) {
  return `new-clients.announcement.dismissed.${id}`;
}

export function AnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey(ANNOUNCEMENT_ID)) === "1") return;
    } catch {
      // ignore
    }
    setOpen(true);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(ANNOUNCEMENT_ID), "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  async function copyModel(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(
        () => setCopiedId((current) => (current === id ? null : current)),
        1500
      );
    } catch {
      // ignore clipboard failures
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <Card className="scale-in relative w-full max-w-2xl overflow-hidden max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Tutup"
        >
          <X weight="bold" className="size-4" />
        </button>

        <CardContent className="relative p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkle weight="duotone" className="size-3.5" />
              4 Model Baru
            </div>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:inline">
              {PRICING_NOTE}
            </span>
          </div>

          <h2
            id="announcement-title"
            className="mt-4 font-heading text-xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl"
          >
            Lebih murah dari Claude &amp; Sonnet.
            <span className="block font-heading text-xl font-bold leading-tight tracking-tight text-primary sm:text-3xl">
              Mulai $0.08 / 1M token.
            </span>
          </h2>
          <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground sm:block">
            Tambahan 4 model inference cepat untuk workflow kamu. Pilih sesuai kasus —
            dari chat harian sampai agent &amp; code review — tanpa kompromi harga.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:gap-3 sm:grid-cols-2">
            {NEW_MODELS.map((model) => (
              <div key={model.id} className="relative">
                <ModelCard model={model} />
                <button
                  type="button"
                  onClick={() => void copyModel(model.id)}
                  className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                  aria-label={`Copy model id ${model.name}`}
                  title={model.id}
                >
                  {copiedId === model.id ? (
                    <>
                      <Check weight="bold" className="size-3 text-primary" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy weight="bold" className="size-3" />
                      <span className="hidden sm:inline">{model.id}</span>
                      <span className="sm:hidden">Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 hidden sm:block sm:mt-5">
            <CompareRow />
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-[11px] leading-snug text-muted-foreground sm:block">
              Sudah tersedia di API key-mu. Tinggal pilih di menu{" "}
              <strong className="text-foreground">Models</strong> atau langsung dari{" "}
              <strong className="text-foreground">Chat</strong>.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={dismiss} className="flex-1 sm:flex-none">
                Nanti saja
              </Button>
              <Button asChild onClick={dismiss} className="flex-1 sm:flex-none">
                <Link to="/models" className="inline-flex items-center">
                  Lihat di Models
                  <CaretRight weight="bold" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
