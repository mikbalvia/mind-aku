import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "@phosphor-icons/react";
import { AI_BASE_URL, OMNIROUTE_BASE_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CONFIGURED_CLIENTS = [
  "Claude Code",
  "Codex CLI",
  "OpenClaw",
  "Hermes Agent",
  "OpenCode",
  "KiloCode",
  "Cline",
  "VS Code",
  "Cursor",
] as const;

type Props = {
  apiKey: string;
  toolLabel?: string;
  modelsNote?: string;
  lead?: string;
};

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function ClientSetupCard({ apiKey, toolLabel, modelsNote, lead }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<"mac" | "win" | "base" | "v1" | null>(null);

  const baseUrl = OMNIROUTE_BASE_URL.replace(/\/$/, "");
  const v1Url = AI_BASE_URL.replace(/\/$/, "");
  const setupUrl = useMemo(
    () => `${baseUrl}/setup?token=${encodeURIComponent(apiKey)}`,
    [apiKey, baseUrl]
  );

  const macCmd = `curl -fsSL "${setupUrl}" | bash`;
  const winCmd = `irm "${setupUrl}" | iex`;

  async function onCopy(kind: "mac" | "win" | "base" | "v1", value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-heading text-xl font-semibold text-foreground">
          {t("Auto-config to Mind Aku")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {lead
            ? t(lead)
            : toolLabel
              ? t("After {{tool}} is installed, run one command below. Your API key token is already in the URL.", { tool: toolLabel })
              : t("Run one command below. Your API key token is already in the URL.")}{" "}
          <strong className="text-foreground">{t("Do not share this command")}</strong>.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("Gateway base URL")}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{baseUrl}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => void onCopy("base", baseUrl)}
              >
                {copied === "base" ? <Check weight="bold" /> : <Copy weight="bold" />}
                {copied === "base" ? t("Copied") : null}
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("OpenAI endpoint (/v1)")}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{v1Url}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => void onCopy("v1", v1Url)}
              >
                {copied === "v1" ? <Check weight="bold" /> : <Copy weight="bold" />}
                {copied === "v1" ? t("Copied") : null}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t("macOS / Linux")}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-5 text-foreground">
                <code>{macCmd}</code>
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => void onCopy("mac", macCmd)}
              >
                {copied === "mac" ? <Check weight="bold" /> : <Copy weight="bold" />}
                {copied === "mac" ? t("Copied") : t("Copy")}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t("Windows (PowerShell)")}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-5 text-foreground">
                <code>{winCmd}</code>
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => void onCopy("win", winCmd)}
              >
                {copied === "win" ? <Check weight="bold" /> : <Copy weight="bold" />}
                {copied === "win" ? t("Copied") : t("Copy")}
              </Button>
            </div>
          </div>
        </div>

        {modelsNote ? (
          <p className="mt-4 text-xs text-muted-foreground">{t(modelsNote)}</p>
        ) : null}

        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("Configured clients")}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {CONFIGURED_CLIENTS.map((client) => (
              <li key={client}>{t(client)}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {t(
              "Reload your editor after setup to apply model and extension settings."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
