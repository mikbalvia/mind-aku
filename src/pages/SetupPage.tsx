import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ClientSetupCard } from "../components/ClientSetupCard";
import { PageHeader } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ToolId = "claude" | "codex";

const CLAUDE_DOCS = "https://code.claude.com/docs/en/quickstart";
const CODEX_DOCS = "https://learn.chatgpt.com/docs/codex/cli#getting-started";
const CLAUDE_VSCODE = "https://code.claude.com/docs/en/vs-code";
const CODEX_IDE = "https://learn.chatgpt.com/docs/codex/ide";

const tools: Record<
  ToolId,
  {
    label: string;
    short: string;
    blurb: string;
    docs: string;
    docsLabel: string;
    checkCmd: string;
    modelsNote: string;
    install: { label: string; command: string; id: string }[];
    ide: { editor: string; steps: string[]; docsHref: string; docsLabel: string };
  }
> = {
  claude: {
    label: "Claude Code",
    short: "Claude",
    blurb: "Agent coding Anthropic — cocok untuk workflow Claude di terminal & editor.",
    docs: CLAUDE_DOCS,
    docsLabel: "Claude Code Quickstart",
    checkCmd: "claude --version",
    modelsNote: "Default: claude-opus-4.8, claude-sonnet-5, claude-haiku-4.5.",
    install: [
      {
        label: "macOS / Linux / WSL",
        command: "curl -fsSL https://claude.ai/install.sh | bash",
        id: "claude-mac",
      },
      {
        label: "Windows PowerShell",
        command: "irm https://claude.ai/install.ps1 | iex",
        id: "claude-win",
      },
      {
        label: "macOS Homebrew (opsional)",
        command: "brew install --cask claude-code",
        id: "claude-brew",
      },
    ],
    ide: {
      editor: "VS Code, Cursor, atau Antigravity",
      steps: [
        "Buka Extensions / Marketplace di editor kamu.",
        "Cari dan install extension “Claude Code”.",
        "Pastikan CLI Claude Code sudah terpasang dan auto-config Mind Aku sudah dijalankan (langkah di atas).",
        "Pakai seperti biasa: buka panel Claude Code, chat, atau perintah agent — request akan lewat Mind Aku.",
      ],
      docsHref: CLAUDE_VSCODE,
      docsLabel: "Claude Code di VS Code",
    },
  },
  codex: {
    label: "Codex CLI",
    short: "Codex",
    blurb: "Agent coding OpenAI / ChatGPT — cocok untuk GPT di terminal & editor.",
    docs: CODEX_DOCS,
    docsLabel: "Codex CLI getting started",
    checkCmd: "codex --version",
    modelsNote: "Default: gpt-5.5. Combo lain: gpt-5.6-sol, gpt-5.6-terra, gpt-5.6-luna.",
    install: [
      {
        label: "macOS / Linux",
        command: "curl -fsSL https://chatgpt.com/codex/install.sh | sh",
        id: "codex-unix",
      },
      {
        label: "Windows PowerShell",
        command:
          'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"',
        id: "codex-win",
      },
    ],
    ide: {
      editor: "VS Code, Cursor, atau Antigravity",
      steps: [
        "Buka Extensions / Marketplace di editor kamu.",
        "Cari dan install extension “Codex” (OpenAI Codex).",
        "Pastikan CLI Codex sudah terpasang dan auto-config Mind Aku sudah dijalankan (langkah di atas).",
        "Pakai seperti biasa: buka panel Codex di editor — request akan lewat Mind Aku.",
      ],
      docsHref: CODEX_IDE,
      docsLabel: "Codex IDE",
    },
  },
};

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function InstallCommand({
  label,
  command,
  copyId,
  copied,
  onCopy,
}: {
  label: string;
  command: string;
  copyId: string;
  copied: string | null;
  onCopy: (id: string, value: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
        <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground">
          <code>{command}</code>
        </pre>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onCopy(copyId, command)}
        >
          {copied === copyId ? <Check /> : <Copy />}
          {copied === copyId ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function StepLabel({ n, children }: { n: number; children: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
        {n}
      </span>
      <p className="text-[11px] uppercase tracking-[0.16em] text-primary">{children}</p>
    </div>
  );
}

export function SetupPage() {
  const { apiKey } = useAuth();
  const [tool, setTool] = useState<ToolId | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function onCopy(id: string, value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(id);
    window.setTimeout(() => setCopied(null), 2000);
  }

  const selected = tool ? tools[tool] : null;

  return (
    <div>
      <PageHeader
        title="Setup"
        description="Pilih satu tool (Claude Code atau Codex), install, auto-config ke Mind Aku, lalu pakai di terminal atau editor."
      />

      <div className="space-y-5">
        <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-6">
            <StepLabel n={1}>Pilih tool</StepLabel>
            <h3 className="font-display text-xl font-medium text-foreground">
              Claude Code atau Codex — cukup salah satu
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Tidak perlu install keduanya. Pilih yang ingin kamu pakai; langkah berikutnya menyesuaikan pilihanmu.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(Object.keys(tools) as ToolId[]).map((id) => {
                const item = tools[id];
                const active = tool === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTool(id)}
                    className={cn(
                      "rounded-xl border px-4 py-4 text-left transition-all duration-200",
                      active
                        ? "border-primary/50 bg-accent shadow-sm"
                        : "border-border hover:border-border/80 hover:bg-card/80"
                    )}
                  >
                    <p className="font-display text-lg text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.blurb}</p>
                    {active ? (
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                        Dipilih
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {!selected ? (
          <Card className="border-dashed border-border/80 bg-card/50">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Pilih <strong className="text-foreground">Claude Code</strong> atau{" "}
              <strong className="text-foreground">Codex</strong> di atas untuk melihat
              perintah install, auto-config, dan integrasi editor.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="scale-in border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StepLabel n={2}>Install {selected.label}</StepLabel>
                    <h3 className="font-display text-xl font-medium text-foreground">
                      Pasang CLI di komputer kamu
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Install sesuai OS. Setelah selesai, cek dengan{" "}
                      <code>{selected.checkCmd}</code>.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.docs} target="_blank" rel="noopener noreferrer">
                      Docs <ExternalLink />
                    </a>
                  </Button>
                </div>

                <div className="mt-5 space-y-4">
                  {selected.install.map((cmd) => (
                    <InstallCommand
                      key={cmd.id}
                      label={cmd.label}
                      command={cmd.command}
                      copyId={cmd.id}
                      copied={copied}
                      onCopy={onCopy}
                    />
                  ))}
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Panduan resmi:{" "}
                  <a
                    href={selected.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selected.docsLabel}
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            <div>
              <StepLabel n={3}>Hubungkan ke Mind Aku</StepLabel>
              {apiKey ? (
                <ClientSetupCard
                  apiKey={apiKey}
                  toolLabel={selected.label}
                  modelsNote={selected.modelsNote}
                />
              ) : (
                <Card className="border-border/80 bg-card/90">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Login ulang diperlukan untuk menampilkan perintah auto-config dengan API key
                    kamu.
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="scale-in border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StepLabel n={4}>Editor (opsional)</StepLabel>
                    <h3 className="font-display text-xl font-medium text-foreground">
                      VS Code, Cursor, Antigravity
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Setelah CLI + auto-config siap, pasang extension {selected.short} di editor —
                      lalu gunakan seperti biasa.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.ide.docsHref} target="_blank" rel="noopener noreferrer">
                      Docs <ExternalLink />
                    </a>
                  </Button>
                </div>

                <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-foreground">
                  {selected.ide.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {["VS Code", "Cursor", "Antigravity"].map((name) => (
                    <div
                      key={name}
                      className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm"
                    >
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Install extension {selected.short}, lalu pakai seperti biasa.
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Detail extension:{" "}
                  <a
                    href={selected.ide.docsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selected.ide.docsLabel}
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
