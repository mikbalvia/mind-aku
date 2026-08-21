import { useCallback, useEffect, useState } from "react";
import { fetchLogDetail, fetchLogs } from "../api/client";
import { ApiError } from "../api/types";
import type { CallLog } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader } from "../components/page-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: number | null }) {
  if (status == null) {
    return <Badge variant="outline">—</Badge>;
  }
  if (status >= 400) {
    return <Badge variant="destructive">{status}</Badge>;
  }
  if (status >= 200 && status < 300) {
    return <Badge>{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function formatDuration(ms: number | null): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatSpend(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

export function LogsPage() {
  const { t } = useTranslation();
  const { apiKey } = useAuth();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<"" | "ok" | "error">("");
  const [model, setModel] = useState("");
  const [search, setSearch] = useState("");
  const [appliedModel, setAppliedModel] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CallLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(
    async (nextOffset: number) => {
      if (!apiKey) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetchLogs(apiKey, {
          limit: PAGE_SIZE,
          offset: nextOffset,
          status,
          model: appliedModel || undefined,
          search: appliedSearch || undefined,
        });
        setLogs(response.data);
        setTotal(response.total);
        setOffset(response.offset);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("Failed to load logs."));
      } finally {
        setLoading(false);
      }
    },
    [apiKey, status, appliedModel, appliedSearch]
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  async function openDetail(id: string) {
    if (!apiKey) return;
    setSheetOpen(true);
    setDetailLoading(true);
    setSelected(null);
    try {
      const detail = await fetchLogDetail(apiKey, id);
      setSelected(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load log detail.");
      setSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function applyFilters() {
    setAppliedModel(model.trim());
    setAppliedSearch(search.trim());
  }

  function closeSheet() {
    setSheetOpen(false);
    setSelected(null);
    setDetailLoading(false);
  }

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + logs.length, total);

  return (
    <div>
      <PageHeader
        title={t("Usage logs")}
        description={t("Request trail for this API key.")}
      />

      <Card className="scale-in scale-in-delay-1 mb-5 border-border bg-card shadow-sm">
        <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-[140px_1fr_1.4fr_auto] md:items-end">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("Status")}</Label>
            <Select
              value={status || "all"}
              onValueChange={(value) => setStatus(value === "all" ? "" : (value as "ok" | "error"))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("All")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
                <SelectItem value="ok">{t("OK")}</SelectItem>
                <SelectItem value="error">{t("Error")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("Model")}</Label>
            <Input
              placeholder={t("Filter by model")}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("Search")}</Label>
            <Input
              placeholder={t("Path, provider, correlation…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>
          <Button type="button" onClick={applyFilters} className="md:mb-0.5">
            {t("Apply")}
          </Button>
        </CardContent>
      </Card>

      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <LoadingBlock label={t("Loading request trail…")} /> : null}

      {!loading && !error && logs.length === 0 ? (
        <EmptyState
          title={t("No activity yet")}
          description={t("Requests made with this API key will appear here.")}
        />
      ) : null}

      {!loading && logs.length > 0 ? (
        <>
          <Card className="scale-in scale-in-delay-2 overflow-hidden border-border bg-card shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Model")}</TableHead>
                    <TableHead>{t("Tokens")}</TableHead>
                    <TableHead>{t("Spend")}</TableHead>
                    <TableHead>{t("Duration")}</TableHead>
                    <TableHead>{t("Time")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer"
                      onClick={() => void openDetail(log.id)}
                    >
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground">
                          {log.comboName || log.requestedModel || log.model || "—"}
                        </div>
                        {log.error ? (
                          <div className="mt-0.5 max-w-md truncate text-xs text-destructive">{log.error}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {log.tokens.in}/{log.tokens.out}
                      </TableCell>
                      <TableCell className="tabular-nums text-primary">
                        {formatSpend(log.spend?.totalUsd)}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatDuration(log.duration)}</TableCell>
                      <TableCell>{formatTime(log.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
            <p className="tabular-nums">
              {pageStart}–{pageEnd} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={offset <= 0}
                onClick={() => void load(Math.max(0, offset - PAGE_SIZE))}
              >
                {t("Previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => void load(offset + PAGE_SIZE)}
              >
                {t("Next")}
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={(open) => (!open ? closeSheet() : setSheetOpen(true))}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border pb-4">
            <div className="accent-line mb-3" />
            <SheetTitle className="font-heading text-2xl">Request</SheetTitle>
            <SheetDescription className="text-[10px] uppercase tracking-[0.18em]">
              Builder summary
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? <LoadingBlock label={t("Loading detail…")} /> : null}

          {selected ? (
            <div className="space-y-0 px-4 pb-6 text-sm">
              <dl className="space-y-0">
                {[
                  ["ID", selected.id],
                  ["Status", String(selected.status ?? "—")],
                  ["Method", selected.method ?? "—"],
                  ["Path", selected.path ?? "—"],
                  ["Model", selected.comboName || selected.requestedModel || selected.model || "—"],
                  ["Provider", selected.provider ?? "—"],
                  ["Duration", formatDuration(selected.duration)],
                  ["Tokens in/out", `${selected.tokens.in}/${selected.tokens.out}`],
                  [
                    "Cache read / write",
                    `${selected.tokens.cacheRead ?? selected.spend?.tokens.cacheRead ?? 0} / ${
                      selected.tokens.cacheWrite ?? selected.spend?.tokens.cacheCreation ?? 0
                    }`,
                  ],
                  [
                    "Reasoning tokens",
                    String(selected.tokens.reasoning ?? selected.spend?.tokens.reasoning ?? 0),
                  ],
                  ["Spend", formatSpend(selected.spend?.totalUsd)],
                  ["Correlation", selected.correlationId ?? "—"],
                  ["Time", formatTime(selected.timestamp)],
                  ["Error", selected.error ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-border py-3">
                    <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 break-all text-muted-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              {selected.spend?.formula ? (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Spend details
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {selected.spend.formula}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
