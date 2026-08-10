import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchModels } from "../api/client";
import { ApiError } from "../api/types";
import type { ModelItem } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OPENAI_PRICING_URL = "https://platform.openai.com/docs/pricing";
const CLAUDE_PRICING_URL = "https://platform.claude.com/docs/en/about-claude/pricing";

function formatRate(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export function ModelsPage() {
  const { apiKey } = useAuth();
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchModels(apiKey!);
        if (!cancelled) {
          const sorted = [...(response.data ?? [])].sort((a, b) => {
            const byName = a.id.localeCompare(b.id, undefined, { sensitivity: "base" });
            if (byName !== 0) return byName;
            return (
              (b.pricing?.output ?? Number.NEGATIVE_INFINITY) -
              (a.pricing?.output ?? Number.NEGATIVE_INFINITY)
            );
          });
          setModels(sorted);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load models.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  async function copyModelId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div>
      <PageHeader
        title="Models"
        description="Katalog model yang bisa kamu tembak. Rate dalam USD per 1M tokens."
      />

      <Card className="mb-5 scale-in border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
        <CardContent className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Notes · Pricing
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            Dasar harga model mengikuti harga resmi provider (USD per 1M tokens). Nilai di
            tabel di bawah diambil dinamis dari API gateway; untuk referensi resmi lihat:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={OPENAI_PRICING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                OpenAI Pricing <ExternalLink className="size-3.5" />
              </a>
              <span className="text-muted-foreground"> — platform.openai.com/docs/pricing</span>
            </li>
            <li>
              <a
                href={CLAUDE_PRICING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                Claude Pricing <ExternalLink className="size-3.5" />
              </a>
              <span className="text-muted-foreground">
                {" "}
                — platform.claude.com/docs/en/about-claude/pricing
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <LoadingBlock label="Loading model catalog…" /> : null}

      {!loading && !error && models.length === 0 ? (
        <EmptyState
          title="Belum ada model"
          description="Minta admin unlock model untuk API key ini."
        />
      ) : null}

      {!loading && models.length > 0 ? (
        <Card className="scale-in overflow-hidden border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>Cached</TableHead>
                  <TableHead>Cache Creation</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-mono text-[13px] text-foreground">{model.id}</TableCell>
                    <TableCell className="tabular-nums">
                      {model.context_length != null ? model.context_length.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatRate(model.pricing?.input)}</TableCell>
                    <TableCell className="tabular-nums">{formatRate(model.pricing?.output)}</TableCell>
                    <TableCell className="tabular-nums">{formatRate(model.pricing?.cached)}</TableCell>
                    <TableCell className="tabular-nums">{formatRate(model.pricing?.cache_creation)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void copyModelId(model.id)}
                      >
                        {copiedId === model.id ? "Copied" : "Copy"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
