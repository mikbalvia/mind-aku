import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { OMNIROUTE_BASE_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  apiKey: string;
};

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function ClientSetupCard({ apiKey }: Props) {
  const [copied, setCopied] = useState<"mac" | "win" | null>(null);

  const setupBase = OMNIROUTE_BASE_URL.replace(/\/$/, "");
  const setupUrl = useMemo(() => {
    const url = new URL(`${setupBase}/setup`);
    url.searchParams.set("token", apiKey);
    return url.toString();
  }, [apiKey, setupBase]);

  const macCmd = `curl -fsSL "${setupUrl}" | bash`;
  const winCmd = `irm "${setupUrl}" | iex`;

  async function onCopy(kind: "mac" | "win", value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
      <CardContent className="p-6">
        <h3 className="font-display text-xl font-medium text-foreground">
          Auto-config ke Mind Aku
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Setelah Claude Code / Codex terpasang, jalankan satu perintah ini. Script mengarahkan
          CLI ke gateway Mind Aku dengan combo model kamu. Token ikut di URL — jangan bagikan.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              macOS / Linux
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground">
                <code>{macCmd}</code>
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => void onCopy("mac", macCmd)}
              >
                {copied === "mac" ? <Check /> : <Copy />}
                {copied === "mac" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Windows (PowerShell)
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground">
                <code>{winCmd}</code>
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => void onCopy("win", winCmd)}
              >
                {copied === "win" ? <Check /> : <Copy />}
                {copied === "win" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Default Claude: <code>claude-opus-4.8</code>,{" "}
          <code>claude-sonnet-5</code>, <code>claude-haiku-4.5</code>. Codex
          default: <code>gpt-5.5</code>. Combo GPT lain:{" "}
          <code>gpt-5.6-sol</code>, <code>gpt-5.6-terra</code>,{" "}
          <code>gpt-5.6-luna</code>.
        </p>
      </CardContent>
    </Card>
  );
}
