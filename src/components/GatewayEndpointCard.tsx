import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { AI_BASE_URL, OMNIROUTE_BASE_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

type Props = {
  className?: string;
  /** Shorter copy for dashboard / models. */
  compact?: boolean;
};

export function GatewayEndpointCard({ className, compact = false }: Props) {
  const [copied, setCopied] = useState<"base" | "v1" | null>(null);
  const baseUrl = OMNIROUTE_BASE_URL.replace(/\/$/, "");
  const v1Url = AI_BASE_URL.replace(/\/$/, "");

  async function onCopy(id: "base" | "v1", value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(id);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            API Gateway
          </p>
          <h3 className="font-heading text-lg font-semibold text-foreground sm:text-xl">
            Base URL Mind Aku
          </h3>
          {!compact ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              Pakai URL ini di Claude Desktop, Claude Code, Codex, atau client OpenAI-compatible.
              Semua request model lewat gateway ini — bukan langsung ke OpenAI/Anthropic.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Arahkan client ke gateway ini + API key dari portal.
            </p>
          )}
        </div>

        <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
          <EndpointRow
            label="Gateway base URL"
            value={baseUrl}
            hint="Claude Desktop · auto-config · OmniRoute"
            copied={copied === "base"}
            onCopy={() => void onCopy("base", baseUrl)}
          />
          <EndpointRow
            label="OpenAI-compatible endpoint"
            value={v1Url}
            hint="Chat Completions · /v1/models · SDK OpenAI"
            copied={copied === "v1"}
            onCopy={() => void onCopy("v1", v1Url)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EndpointRow({
  label,
  value,
  hint,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  hint: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-foreground">{value}</code>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onCopy}>
          {copied ? <Check weight="bold" /> : <Copy weight="bold" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}