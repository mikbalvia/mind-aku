import { useEffect, useState } from "react";
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
  const { apiKey, logout } = useAuth();
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
        if (!cancelled) setModels(response.data ?? []);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "unauthorized") {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "Failed to load models.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiKey, logout]);

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
