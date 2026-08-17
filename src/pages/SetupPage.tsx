import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Copy, ArrowSquareOut } from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";
import { ClientSetupCard } from "../components/ClientSetupCard";
import { GatewayEndpointCard } from "../components/GatewayEndpointCard";
import { PageHeader } from "../components/page-chrome";
import { OMNIROUTE_BASE_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ToolId = "vscode" | "desktop" | "claude" | "codex" | "openclaw" | "hermes";

const TOOL_ORDER: ToolId[] = ["vscode", "desktop", "claude", "codex", "openclaw", "hermes"];

const CLAUDE_DOCS = "https://code.claude.com/docs/en/quickstart";
const CODEX_DOCS = "https://learn.chatgpt.com/docs/codex/cli#getting-started";
const CLAUDE_VSCODE = "https://code.claude.com/docs/en/vs-code";
const CODEX_IDE = "https://learn.chatgpt.com/docs/codex/ide";
const CLAUDE_DESKTOP_DOWNLOAD = "https://claude.com/download";
const OPENCLAW_DOCS = "https://docs.openclaw.ai/install";
const HERMES_DOCS = "https://hermes-agent.nousresearch.com/docs/getting-started/quickstart";
const VSCODE_LM_DOCS = "https://code.visualstudio.com/docs/copilot/customization/language-models";
const VSCODE_DOWNLOAD = "https://code.visualstudio.com/download";

type CliTool = {
  kind: "cli";
  label: string;
  short: string;
  blurb: string;
  docs: string;
  docsLabel: string;
  checkCmd: string;
  modelsNote: string;
  install: { label: string; command: string; id: string }[];
  ide: { steps: string[]; docsHref: string; docsLabel: string };
};

type DesktopTool = {
  kind: "desktop";
  label: string;
  short: string;
  blurb: string;
};

type CurlClientTool = {
  kind: "curl-client";
  label: string;
  short: string;
  blurb: string;
  docs: string;
  docsLabel: string;
  runCmd: string;
  lead: string;
  modelsNote: string;
  afterTitle: string;
  afterSteps: string[];
};

type VsCodeTool = {
  kind: "vscode";
  label: string;
  short: string;
  blurb: string;
};

const tools: Record<ToolId, CliTool | DesktopTool | CurlClientTool | VsCodeTool> = {
  vscode: {
    kind: "vscode",
    label: "VS Code Chat",
    short: "VS Code",
    blurb: "Integrasi Chat / Agent di Visual Studio Code via Custom Endpoint Mind Aku.",
  },
  desktop: {
    kind: "desktop",
    label: "Claude Desktop",
    short: "Desktop",
    blurb: "Aplikasi desktop Claude dengan gateway Mind Aku (tanpa akun Claude.ai).",
  },
  openclaw: {
    kind: "curl-client",
    label: "OpenClaw",
    short: "OpenClaw",
    blurb: "Agent OpenClaw ke Mind Aku — cukup satu perintah curl.",
    docs: OPENCLAW_DOCS,
    docsLabel: "OpenClaw install docs",
    runCmd: "openclaw tui",
    lead: "Jalankan satu perintah di bawah. Script akan memasang OpenClaw jika belum ada, lalu menulis katalog model Mind Aku. Nama agen dan setup lama tidak diubah.",
    modelsNote:
      "Katalog model diambil live dari /v1/models. Default claude-sonnet-5 hanya jika belum ada primary. Lalu jalankan: openclaw tui",
    afterTitle: "Buka agen OpenClaw",
    afterSteps: [
      "Setelah curl selesai, jalankan openclaw tui (ini masuk chat agen, bukan asisten setup Crestodian).",
      "Daftar model Mind Aku ada di /models atau openclaw models list --provider mindaku.",
      "Pilih model mindaku/… di picker. Default baru: claude-sonnet-5.",
    ],
  },
  hermes: {
    kind: "curl-client",
    label: "Hermes",
    short: "Hermes",
    blurb: "Hermes Agent ke Mind Aku — cukup satu perintah curl.",
    docs: HERMES_DOCS,
    docsLabel: "Hermes quickstart",
    runCmd: "hermes",
    lead: "Jalankan satu perintah di bawah. Script akan memasang Hermes jika belum ada, lalu menulis katalog model Mind Aku. Nama agen dan model/setup yang sudah ada tidak diubah.",
    modelsNote:
      "Katalog model diambil live dari /v1/models dan providers.mindaku. Default claude-sonnet-5 hanya jika model belum dikonfigurasi. Lalu jalankan: hermes",
    afterTitle: "Buka Hermes",
    afterSteps: [
      "Setelah curl selesai, jalankan hermes (atau hermes --tui).",
      "Lihat daftar model Mind Aku lewat /model atau hermes model.",
      "Pilih model dari provider mindaku. Default baru: claude-sonnet-5.",
    ],
  },
  claude: {
    kind: "cli",
    label: "Claude Code",
    short: "Claude",
    blurb: "Agent coding di terminal & editor (VS Code / Cursor / Antigravity).",
    docs: CLAUDE_DOCS,
    docsLabel: "Claude Code Quickstart",
    checkCmd: "claude --version",
    modelsNote: "Default: claude-opus-5, claude-sonnet-5, claude-haiku-4.5.",
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
      steps: [
        "Buka Extensions / Marketplace di editor kamu.",
        "Cari dan install extension “Claude Code”.",
        "Pastikan CLI Claude Code sudah terpasang dan auto-config Mind Aku sudah dijalankan.",
        "Pakai seperti biasa — request akan lewat Mind Aku.",
      ],
      docsHref: CLAUDE_VSCODE,
      docsLabel: "Claude Code di VS Code",
    },
  },
  codex: {
    kind: "cli",
    label: "Codex CLI",
    short: "Codex",
    blurb: "Agent coding OpenAI / ChatGPT di terminal & editor.",
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
      steps: [
        "Buka Extensions / Marketplace di editor kamu.",
        "Cari dan install extension “Codex” (OpenAI Codex).",
        "Pastikan CLI Codex sudah terpasang dan auto-config Mind Aku sudah dijalankan.",
        "Pakai seperti biasa — request akan lewat Mind Aku.",
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
          {copied === copyId ? <Check weight="bold" /> : <Copy weight="bold" />}
          {copied === copyId ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
        {n}
      </span>
      <p className="text-[11px] uppercase tracking-[0.16em] text-primary">{children}</p>
    </div>
  );
}

function ManualShot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/20">
      <img src={src} alt={alt} className="w-full object-contain object-top" loading="lazy" />
      <figcaption className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

function VsCodeChatGuide({ apiKey }: { apiKey: string | null }) {
  const baseUrl = OMNIROUTE_BASE_URL.replace(/\/$/, "");
  const [copied, setCopied] = useState<string | null>(null);

  async function onCopy(id: string, value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(id);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-5">
      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <StepLabel n={2}>Siapkan Visual Studio Code</StepLabel>
              <h3 className="font-heading text-xl font-medium text-foreground">
                Chat + Language Models
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Pakai Chat di VS Code (atau Cursor) dengan model Mind Aku lewat{" "}
                <strong className="text-foreground">Custom Endpoint</strong>. Auto-config akan
                menulis <code>chatLanguageModels.json</code> dan force env key di shell kamu.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={VSCODE_DOWNLOAD} target="_blank" rel="noopener noreferrer">
                  Download VS Code <ArrowSquareOut />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={VSCODE_LM_DOCS} target="_blank" rel="noopener noreferrer">
                  Docs <ArrowSquareOut />
                </a>
              </Button>
            </div>
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>Install Visual Studio Code terbaru (stabil atau Insiders).</li>
            <li>
              Pastikan fitur <strong>Chat</strong> tersedia (panel Chat di sidebar).
            </li>
            <li>
              Opsional: Cursor juga didukung — auto-config menulis ke folder User Cursor jika
              terpasang.
            </li>
          </ol>

          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            Model Mind Aku muncul di grup <strong>mindaku</strong> di model picker Chat. Thinking
            effort default: <strong>high</strong> untuk semua model dari API models. URL endpoint
            model memakai base gateway <strong>tanpa</strong> <code>/v1</code> — VS Code yang
            menambahkan path API. Auto-config mengirim API key lewat{" "}
            <code>requestHeaders.Authorization</code> (VS Code mengabaikan apiKey plaintext).
          </div>
        </CardContent>
      </Card>

      <div>
        <StepLabel n={3}>Auto-config Mind Aku</StepLabel>
        {apiKey ? (
          <ClientSetupCard
            apiKey={apiKey}
            toolLabel="VS Code"
            modelsNote="Perintah ini mengisi chatLanguageModels.json (semua model dari API, URL tanpa /v1), force OPENAI_API_KEY + ANTHROPIC_API_KEY ke shell profile, lalu siap dipakai di Chat."
          />
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Login ulang diperlukan untuk menampilkan perintah auto-config dengan API key kamu.
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <StepLabel n={4}>Reload & pilih model</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Aktifkan model mindaku di Chat
            </h3>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              Setelah auto-config selesai, di VS Code jalankan{" "}
              <strong>Developer: Reload Window</strong> (Command Palette).
            </li>
            <li>
              Buka panel <strong>Chat</strong>, lalu buka <strong>model picker</strong>.
            </li>
            <li>
              Pilih model di grup <strong>mindaku</strong> (daftar mengikuti API models gateway).
            </li>
            <li>
              Klik panah <strong>&gt;</strong> di samping nama model → set{" "}
              <strong>Thinking Effort</strong> (disarankan <strong>High</strong>).
            </li>
          </ol>

          <ManualShot
            src="/setup-guides/vscode-models.png"
            alt="Model picker VS Code Chat menampilkan model mindaku"
            caption="Contoh model picker: pilih model dari grup mindaku (claude-opus-5, gpt-5.5, deepseek, dll.)"
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "macOS path",
                text: "~/Library/Application Support/Code/User/chatLanguageModels.json",
              },
              {
                title: "Windows path",
                text: "%APPDATA%\\Code\\User\\chatLanguageModels.json",
              },
              {
                title: "Linux path",
                text: "~/.config/Code/User/chatLanguageModels.json",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm"
              >
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Kalau daftar model di gateway berubah, jalankan ulang perintah auto-config.
          </p>
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <StepLabel n={5}>Manual (opsional)</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Tambah Custom Endpoint sendiri
            </h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Hanya jika auto-config gagal. Di VS Code: model picker →{" "}
              <strong className="text-foreground">Manage Language Models</strong> →{" "}
              <strong className="text-foreground">Add Models</strong> →{" "}
              <strong className="text-foreground">Custom Endpoint</strong>.
            </p>
          </div>

          <div className="space-y-3">
            <WizardField label="Vendor / group name" value="mindaku" mono={false} />
            <WizardField
              label="API type"
              value="chat-completions"
              copyId="vscode-api-type"
              copied={copied}
              onCopy={onCopy}
            />
            <WizardField
              label="URL (base, tanpa /v1)"
              value={baseUrl}
              copyId="vscode-base"
              copied={copied}
              onCopy={onCopy}
            />
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                API key
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tempel API key Mind Aku kamu
                {apiKey ? " (dari sesi login portal ini)." : " (dari portal setelah login)."}
              </p>
              {apiKey ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="max-w-full truncate text-sm text-foreground">{apiKey}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onCopy("vscode-key", apiKey)}
                  >
                    {copied === "vscode-key" ? <Check weight="bold" /> : <Copy weight="bold" />}
                    {copied === "vscode-key" ? "Copied" : "Copy"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            Jangan isi <code>/v1</code> di URL model. Dengan <code>apiType: chat-completions</code>,
            VS Code akan memanggil <code>{baseUrl}/v1/chat/completions</code> sendiri.
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              Di <code>chatLanguageModels.json</code>, set per model:{" "}
              <code>thinking: true</code>,{" "}
              <code>supportsReasoningEffort: [&quot;low&quot;,&quot;medium&quot;,&quot;high&quot;]</code>
              , <code>reasoningEffortFormat: &quot;chat-completions&quot;</code>, dan{" "}
              <code>url</code> = base gateway tanpa <code>/v1</code>.
            </li>
            <li>
              Di <code>settings</code> provider, set{" "}
              <code>&quot;reasoningEffort&quot;: &quot;high&quot;</code> per model id.
            </li>
            <li>Save file → Reload Window → pilih model mindaku di Chat.</li>
          </ol>

          <p className="text-xs text-muted-foreground">
            Referensi resmi:{" "}
            <a
              href={VSCODE_LM_DOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              AI language models in VS Code
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ClaudeDesktopGuide({ apiKey }: { apiKey: string | null }) {
  const gatewayUrl = OMNIROUTE_BASE_URL.replace(/\/$/, "");
  const [copied, setCopied] = useState<string | null>(null);

  async function onCopy(id: string, value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(id);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-5">
      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <StepLabel n={2}>Download Claude Desktop</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Pasang aplikasi resmi Anthropic
            </h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Unduh Claude Desktop untuk macOS atau Windows, lalu instal. Kamu{" "}
              <strong className="text-foreground">tidak perlu login Claude.ai</strong> jika
              memakai gateway Mind Aku.
            </p>
          </div>
          <div className="flex justify-end">
            <Button asChild size="sm">
              <a href={CLAUDE_DESKTOP_DOWNLOAD} target="_blank" rel="noopener noreferrer">
                Download <ArrowSquareOut />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Sumber:{" "}
            <a
              href={CLAUDE_DESKTOP_DOWNLOAD}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              claude.com/download
            </a>
            .
          </p>
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <StepLabel n={3}>Aktifkan Developer Mode</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Buka menu Developer
            </h3>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <strong>Penting:</strong> jika kamu sudah login ke akun Claude.ai di aplikasi ini,
            <strong> logout dulu</strong> sebelum lanjut. Gateway Mind Aku dipakai tanpa
            sign-in Claude.ai.
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>Buka aplikasi Claude Desktop (pastikan sudah logout jika sebelumnya login).</li>
            <li>
              Di menu bar: <strong>Help → Troubleshooting → Enable Developer Mode</strong>.
            </li>
            <li>
              Setelah aktif, menu <strong>Developer</strong> akan muncul di menu bar.
            </li>
          </ol>
          <ManualShot
            src="/setup-guides/manual-1.png"
            alt="Enable Developer Mode di Claude Desktop"
            caption="Help → Troubleshooting → Enable Developer Mode"
          />
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <StepLabel n={4}>Buka pengaturan gateway</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Configure Third-Party Inference
            </h3>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              Klik <strong>Developer → Configure Third-Party Inference…</strong>
            </li>
            <li>
              Pastikan tipe koneksi: <strong>Gateway</strong>.
            </li>
          </ol>
          <ManualShot
            src="/setup-guides/manual-2.png"
            alt="Configure Third-Party Inference di Claude Desktop"
            caption="Developer → Configure Third-Party Inference…"
          />
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <StepLabel n={5}>Isi kredensial Mind Aku</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Gateway credentials
            </h3>
            <p className="text-sm text-muted-foreground">
              Di tab <strong>Connection</strong>, isi seperti berikut (sesuaikan dengan screenshot):
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Gateway base URL
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="text-foreground">{gatewayUrl}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void onCopy("gw-url", gatewayUrl)}
                >
                  {copied === "gw-url" ? <Check weight="bold" /> : <Copy weight="bold" />}
                  {copied === "gw-url" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Gateway API key
              </p>
              <p className="mt-1 text-muted-foreground">
                Tempel API key Mind Aku kamu
                {apiKey ? " (dari sesi login portal ini)." : " (dari portal setelah login)."}
              </p>
              {apiKey ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="max-w-full truncate text-foreground">{apiKey}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onCopy("gw-key", apiKey)}
                  >
                    {copied === "gw-key" ? <Check weight="bold" /> : <Copy weight="bold" />}
                    {copied === "gw-key" ? "Copied" : "Copy"}
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Gateway auth scheme
              </p>
              <p className="mt-1 font-medium text-foreground">
                <code>x-api-key</code>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Credential kind
              </p>
              <p className="mt-1 font-medium text-foreground">Static API key</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Opsional: klik <strong>Test connection</strong> untuk memastikan gateway terjangkau.
          </p>

          <ManualShot
            src="/setup-guides/manual-3.png"
            alt="Isi Gateway base URL dan API key Mind Aku"
            caption={`Gateway base URL = ${gatewayUrl}, auth scheme = x-api-key`}
          />
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <StepLabel n={6}>Atur model</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Model discovery & tambah 3 model
            </h3>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              Nyalakan <strong>Model discovery</strong> agar model diambil dari{" "}
              <code>{gatewayUrl}/v1/models</code>.
            </li>
            <li>
              Di bagian <strong>Model list</strong>, klik tombol <strong>+ Add</strong> di bawah.
            </li>
            <li>
              Isi form model seperti screenshot di bawah:
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Model ID</strong> dan{" "}
                  <strong className="text-foreground">Display name</strong> sama, misalnya{" "}
                  <code className="text-foreground">claude-opus-5</code>
                </li>
                <li>
                  <strong className="text-foreground">Offer 1M-context variant</strong>: nyalakan
                  (ON)
                </li>
                <li>
                  <strong className="text-foreground">Tier alias</strong>: boleh dikosongkan
                </li>
              </ul>
              <ManualShot
                src="/setup-guides/manual-4b.png"
                alt="Form model: Model ID, Display name, Offer 1M-context ON"
                caption="Isi Model ID + Display name; Offer 1M-context variant ON"
              />
            </li>
            <li>
              Ulangi sampai total <strong>3 model</strong> terdaftar:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <code>claude-opus-5</code>
                </li>
                <li>
                  <code>claude-sonnet-5</code>
                </li>
                <li>
                  <code>claude-haiku-4.5</code>
                </li>
              </ul>
            </li>
            <li>
              Pastikan daftar sudah lengkap (Model discovery ON + 3 model), lalu klik{" "}
              <strong>Apply Changes</strong>.
              <ManualShot
                src="/setup-guides/manual-4b.png"
                alt="Model discovery ON dan 3 model Claude di daftar"
                caption="Model discovery ON + 3 model, lalu Apply Changes"
              />
            </li>
            <li>
              Tutup sepenuhnya Claude Desktop, lalu buka lagi. Di layar awal pilih{" "}
              <strong>Continue</strong> (tanpa sign-in Claude.ai).
              <ManualShot
                src="/setup-guides/login-claude.png"
                alt="Welcome to Claude — Continue dengan custom gateway"
                caption="Pilih Continue — gateway lokal, tanpa akun Claude.ai"
              />
            </li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            Alur ini mengikuti pola integrasi gateway pihak ketiga (mirip panduan OpenRouter untuk
            Claude Desktop), disesuaikan ke Mind Aku.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function WizardField({
  label,
  value,
  copyId,
  copied,
  onCopy,
  mono = true,
}: {
  label: string;
  value: string;
  copyId?: string;
  copied?: string | null;
  onCopy?: (id: string, value: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className={cn("min-w-0 flex-1 break-all text-sm text-foreground", mono && "font-mono")}>
          {value}
        </p>
        {copyId && onCopy ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => onCopy(copyId, value)}
          >
            {copied === copyId ? <Check weight="bold" /> : <Copy weight="bold" />}
            {copied === copyId ? "Copied" : "Copy"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CurlClientGuide({
  apiKey,
  tool,
}: {
  apiKey: string | null;
  tool: CurlClientTool;
}) {
  return (
    <div className="space-y-5">
      <div>
        <StepLabel n={2}>Auto-config Mind Aku</StepLabel>
        {apiKey ? (
          <ClientSetupCard
            apiKey={apiKey}
            toolLabel={tool.label}
            lead={tool.lead}
            modelsNote={tool.modelsNote}
          />
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Login ulang diperlukan untuk menampilkan perintah auto-config dengan API key kamu.
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <StepLabel n={3}>{tool.afterTitle}</StepLabel>
              <h3 className="font-heading text-xl font-medium text-foreground">
                Setelah curl selesai
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Tidak perlu isi Custom Provider manual. Katalog model sudah ditulis script.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={tool.docs} target="_blank" rel="noopener noreferrer">
                Docs <ArrowSquareOut />
              </a>
            </Button>
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            {tool.afterSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Jalankan
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground">
              <code>{tool.runCmd}</code>
            </pre>
          </div>

          <p className="text-xs text-muted-foreground">
            Panduan resmi:{" "}
            <a
              href={tool.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {tool.docsLabel}
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function parseToolParam(value: string | null): ToolId | null {
  if (!value) return null;
  return (TOOL_ORDER as string[]).includes(value) ? (value as ToolId) : null;
}

export function SetupPage() {
  const { apiKey } = useAuth();
  const [searchParams] = useSearchParams();
  const [tool, setTool] = useState<ToolId | null>(() =>
    parseToolParam(searchParams.get("tool"))
  );
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
        description="Pilih satu tool: VS Code Chat, Claude Desktop, Claude Code, Codex CLI, OpenClaw, atau Hermes — lalu ikuti langkahnya."
      />

      <div className="space-y-5">
        <GatewayEndpointCard className="scale-in-delay-1" />

        <Card className="scale-in scale-in-delay-1 border-border bg-card shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <StepLabel n={1}>Pilih tool</StepLabel>
              <h3 className="font-heading text-xl font-medium text-foreground">
                Cukup pilih salah satu
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Mulai dari <strong className="text-foreground">VS Code Chat</strong>, atau pilih
                Claude Desktop / Claude Code / Codex / OpenClaw / Hermes. Langkah berikutnya
                menyesuaikan pilihanmu.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {TOOL_ORDER.map((id) => {
                const item = tools[id];
                const active = tool === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTool(id)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all duration-200",
                      active
                        ? "border-primary bg-primary/15 text-foreground shadow-[0_0_0_1px_var(--primary),0_8px_24px_-12px_rgba(249,115,22,0.5)]"
                        : "border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-heading text-lg text-foreground">{item.label}</p>
                      {active ? (
                        <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                          Dipilih
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.blurb}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {!selected ? (
          <Card className="border-dashed border-border bg-muted/40">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Pilih <strong className="text-foreground">VS Code Chat</strong>,{" "}
              <strong className="text-foreground">Claude Desktop</strong>,{" "}
              <strong className="text-foreground">Claude Code</strong>,{" "}
              <strong className="text-foreground">Codex CLI</strong>,{" "}
              <strong className="text-foreground">OpenClaw</strong>, atau{" "}
              <strong className="text-foreground">Hermes</strong> di atas untuk melihat panduan
              lengkap.
            </CardContent>
          </Card>
        ) : selected.kind === "vscode" ? (
          <VsCodeChatGuide apiKey={apiKey} />
        ) : selected.kind === "desktop" ? (
          <ClaudeDesktopGuide apiKey={apiKey} />
        ) : selected.kind === "curl-client" ? (
          <CurlClientGuide apiKey={apiKey} tool={selected} />
        ) : (
          <>
            <Card className="scale-in border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StepLabel n={2}>Install {selected.label}</StepLabel>
                    <h3 className="font-heading text-xl font-medium text-foreground">
                      Pasang CLI di komputer kamu
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Install sesuai OS. Setelah selesai, cek dengan{" "}
                      <code>{selected.checkCmd}</code>.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.docs} target="_blank" rel="noopener noreferrer">
                      Docs <ArrowSquareOut />
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
                <Card className="border-border bg-card">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Login ulang diperlukan untuk menampilkan perintah auto-config dengan API key
                    kamu.
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="scale-in border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StepLabel n={4}>Editor (opsional)</StepLabel>
                    <h3 className="font-heading text-xl font-medium text-foreground">
                      VS Code, Cursor, Antigravity
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      Setelah CLI + auto-config siap, pasang extension {selected.short} di editor —
                      lalu gunakan seperti biasa.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.ide.docsHref} target="_blank" rel="noopener noreferrer">
                      Docs <ArrowSquareOut />
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
