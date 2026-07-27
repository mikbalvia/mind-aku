import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ClientSetupCard } from "../components/ClientSetupCard";
import { PageHeader } from "../components/page-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CLAUDE_DOCS = "https://code.claude.com/docs/en/quickstart";
const CODEX_DOCS = "https://learn.chatgpt.com/docs/codex/cli#getting-started";

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

export function SetupPage() {
  const { apiKey } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  async function onCopy(id: string, value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(id);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <PageHeader
        title="Setup"
        description="Install Claude Code dan Codex CLI dulu, lalu jalankan auto-config Mind Aku."
      />

      <div className="space-y-5">
        <Card className="scale-in scale-in-delay-1 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Step 1</p>
                <h3 className="mt-1 font-display text-xl font-medium text-foreground">
                  Install Claude Code
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  CLI terminal resmi Anthropic. Setelah terpasang, lanjut ke auto-config di bawah
                  agar request lewat Mind Aku (tanpa login Anthropic).
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={CLAUDE_DOCS} target="_blank" rel="noopener noreferrer">
                  Docs <ExternalLink />
                </a>
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              <InstallCommand
                label="macOS / Linux / WSL (native, recommended)"
                command="curl -fsSL https://claude.ai/install.sh | bash"
                copyId="claude-mac"
                copied={copied}
                onCopy={onCopy}
              />
              <InstallCommand
                label="Windows PowerShell"
                command="irm https://claude.ai/install.ps1 | iex"
                copyId="claude-win"
                copied={copied}
                onCopy={onCopy}
              />
              <InstallCommand
                label="macOS Homebrew (opsional)"
                command="brew install --cask claude-code"
                copyId="claude-brew"
                copied={copied}
                onCopy={onCopy}
              />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Cek instalasi: <code>claude --version</code>. Panduan lengkap:{" "}
              <a
                href={CLAUDE_DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Claude Code Quickstart
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="scale-in scale-in-delay-2 border-border/80 bg-card/90 shadow-sm backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary">Step 2</p>
                <h3 className="mt-1 font-display text-xl font-medium text-foreground">
                  Install Codex CLI
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  CLI coding agent dari OpenAI / ChatGPT. Setelah terpasang, auto-config akan
                  mengarahkan provider ke Mind Aku.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={CODEX_DOCS} target="_blank" rel="noopener noreferrer">
                  Docs <ExternalLink />
                </a>
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              <InstallCommand
                label="macOS / Linux (standalone installer)"
                command="curl -fsSL https://chatgpt.com/codex/install.sh | sh"
                copyId="codex-unix"
                copied={copied}
                onCopy={onCopy}
              />
              <InstallCommand
                label="Windows PowerShell"
                command='powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"'
                copyId="codex-win"
                copied={copied}
                onCopy={onCopy}
              />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Setelah install, jalankan <code>codex</code> di folder project. Panduan:{" "}
              <a
                href={CODEX_DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Codex CLI getting started
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <div className="scale-in scale-in-delay-3">
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-primary">Step 3</p>
          {apiKey ? (
            <ClientSetupCard apiKey={apiKey} />
          ) : (
            <Card className="border-border/80 bg-card/90">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Login ulang diperlukan untuk menampilkan perintah auto-config dengan API key kamu.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
