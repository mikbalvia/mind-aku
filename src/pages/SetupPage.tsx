import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Copy, ArrowSquareOut } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { ClientSetupCard } from "../components/ClientSetupCard";
import { GatewayEndpointCard } from "../components/GatewayEndpointCard";
import { PageHeader } from "../components/page-chrome";
import { OMNIROUTE_BASE_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ToolId =
  | "vscode"
  | "cursor"
  | "cline"
  | "desktop"
  | "claude"
  | "codex"
  | "openclaw"
  | "hermes"
  | "opencode"
  | "kilocode";

const TOOL_ORDER: ToolId[] = [
  "vscode",
  "cursor",
  "cline",
  "desktop",
  "claude",
  "codex",
  "openclaw",
  "hermes",
  "opencode",
  "kilocode",
];

const CLAUDE_DOCS = "https://code.claude.com/docs/en/quickstart";
const CODEX_DOCS = "https://learn.chatgpt.com/docs/codex/cli#getting-started";
const CLAUDE_VSCODE = "https://code.claude.com/docs/en/vs-code";
const CODEX_IDE = "https://learn.chatgpt.com/docs/codex/ide";
const CLAUDE_DESKTOP_DOWNLOAD = "https://claude.com/download";
const OPENCLAW_DOCS = "https://docs.openclaw.ai/install";
const HERMES_DOCS = "https://hermes-agent.nousresearch.com/docs/getting-started/quickstart";
const OPENCODE_DOCS = "https://opencode.ai/docs";
const KILOCODE_DOCS = "https://kilo.ai/docs";
const CLINE_DOCS = "https://docs.cline.bot/";
const CURSOR_DOWNLOAD = "https://cursor.com";
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
    blurb: "Chat / Agent integration in Visual Studio Code via a Mind Aku Custom Endpoint.",
  },
  cursor: {
    kind: "curl-client",
    label: "Cursor",
    short: "Cursor",
    blurb: "Cursor Chat via Mind Aku OpenAI-compatible settings — one curl command.",
    docs: CURSOR_DOWNLOAD,
    docsLabel: "Cursor download",
    runCmd: "Quit & reopen Cursor, then Settings → Models",
    lead:
      "Run the one command below. The script writes Cursor AI settings to state.vscdb (SQLite) if Cursor is installed — Cursor does not use chatLanguageModels.json.",
    modelsNote:
      "Models are fetched live from /v1/models and registered in Cursor Settings → Models. Quit and reopen Cursor after setup.",
    afterTitle: "Use Cursor Chat",
    afterSteps: [
      "Quit Cursor completely, then reopen it (Reload Window is not enough for state.vscdb).",
      "Open Settings → Models and confirm OpenAI API Key and Override OpenAI Base URL are enabled.",
      "Open Chat and pick a Mind Aku model from the model list.",
      "If Agent mode fails, try Ask mode (custom endpoints use Chat Completions).",
    ],
  },
  cline: {
    kind: "curl-client",
    label: "Cline",
    short: "Cline",
    blurb: "Cline extension (VS Code / Cursor) to Mind Aku — one curl command.",
    docs: CLINE_DOCS,
    docsLabel: "Cline docs",
    runCmd: "Open Cline from the editor sidebar",
    lead:
      "Run the one command below. The script writes OpenAI Compatible settings to ~/.cline/data/globalState.json and your API key to secrets.json (modern Cline no longer uses VS Code settings.json).",
    modelsNote:
      "Provider: openai-compatible. Base URL and model ID are written automatically. Reload the editor after setup.",
    afterTitle: "Open Cline",
    afterSteps: [
      "Install the Cline extension from the marketplace if you have not already.",
      "After curl finishes, reload the VS Code or Cursor window.",
      "Open Cline and confirm API Provider is OpenAI Compatible with the Mind Aku /v1 endpoint.",
      "Pick the default model written by the script (claude-sonnet-5 when available).",
    ],
  },
  desktop: {
    kind: "desktop",
    label: "Claude Desktop",
    short: "Desktop",
    blurb: "Claude desktop app with the Mind Aku gateway (no Claude.ai account).",
  },
  openclaw: {
    kind: "curl-client",
    label: "OpenClaw",
    short: "OpenClaw",
    blurb: "OpenClaw agent to Mind Aku — one curl command.",
    docs: OPENCLAW_DOCS,
    docsLabel: "OpenClaw install docs",
    runCmd: "openclaw tui",
    lead: "Run the one command below. The script installs OpenClaw if needed, then writes the Mind Aku model catalog. Existing agent names and setup are left unchanged.",
    modelsNote:
      "Model catalog is fetched live from /v1/models. Default claude-sonnet-5 only if there is no primary yet. Then run: openclaw tui",
    afterTitle: "Open the OpenClaw agent",
    afterSteps: [
      "After curl finishes, run openclaw tui (this opens the agent chat, not the Crestodian setup assistant).",
      "Mind Aku models are listed at /models or via openclaw models list --provider mindaku.",
      "Pick a mindaku/… model in the picker. New default: claude-sonnet-5.",
    ],
  },
  hermes: {
    kind: "curl-client",
    label: "Hermes",
    short: "Hermes",
    blurb: "Hermes Agent to Mind Aku — one curl command.",
    docs: HERMES_DOCS,
    docsLabel: "Hermes quickstart",
    runCmd: "hermes",
    lead: "Run the one command below. The script installs Hermes if needed, then writes the Mind Aku model catalog. Existing agent names and models/setup are left unchanged.",
    modelsNote:
      "Model catalog is fetched live from /v1/models and providers.mindaku. Default claude-sonnet-5 only if no model is configured yet. Then run: hermes",
    afterTitle: "Open Hermes",
    afterSteps: [
      "After curl finishes, run hermes (or hermes --tui).",
      "See Mind Aku models via /model or hermes model.",
      "Pick a model from the mindaku provider. New default: claude-sonnet-5.",
    ],
  },
  opencode: {
    kind: "curl-client",
    label: "OpenCode",
    short: "OpenCode",
    blurb: "OpenCode CLI & Desktop to Mind Aku — one curl command.",
    docs: OPENCODE_DOCS,
    docsLabel: "OpenCode docs",
    runCmd: "opencode",
    lead:
      "Run the one command below. The script writes opencode.json to both CLI (~/.config/opencode/) and Desktop (~/Library/Application Support/ai.opencode.desktop/ on macOS), plus auth.json in each data directory.",
    modelsNote:
      "Quit and reopen OpenCode Desktop, then run /models or open the model picker. Default model: mindaku/claude-sonnet-5 when available.",
    afterTitle: "Open OpenCode",
    afterSteps: [
      "Quit OpenCode Desktop completely, then reopen it.",
      "Run /models in the TUI or open the model picker in Desktop.",
      "Pick provider mindaku and a model (e.g. mindaku/claude-sonnet-5).",
      "If mindaku is still missing, re-run curl setup after deploying the latest backend.",
    ],
  },
  kilocode: {
    kind: "curl-client",
    label: "KiloCode",
    short: "KiloCode",
    blurb: "KiloCode CLI & Desktop to Mind Aku — one curl command.",
    docs: KILOCODE_DOCS,
    docsLabel: "KiloCode docs",
    runCmd: "kilo",
    lead:
      "Run the one command below. The script writes ~/.config/kilo/kilo.jsonc (baseURL + models) and stores your API key in ~/.local/share/kilo/auth.json for Kilo Desktop.",
    modelsNote:
      "Kilo Desktop does not read shell env vars — auth.json + ~/.mindaku/api-key are written automatically. Default model: mindaku/claude-sonnet-5 when available.",
    afterTitle: "Open KiloCode",
    afterSteps: [
      "Quit and reopen Kilo Desktop (or open a new terminal for CLI).",
      "Pick provider mindaku and a model (e.g. mindaku/claude-sonnet-5).",
      "If auth fails, re-run the curl setup or check ~/.local/share/kilo/auth.json.",
    ],
  },
  claude: {
    kind: "cli",
    label: "Claude Code",
    short: "Claude",
    blurb: "Coding agent in the terminal & editor (VS Code / Cursor / Antigravity).",
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
        label: "macOS Homebrew (optional)",
        command: "brew install --cask claude-code",
        id: "claude-brew",
      },
    ],
    ide: {
      steps: [
        "Open Extensions / Marketplace in your editor.",
        "Search for and install the “Claude Code” extension.",
        "Make sure the Claude Code CLI is installed and Mind Aku auto-config has been run.",
        "Use it as usual — requests go through Mind Aku.",
      ],
      docsHref: CLAUDE_VSCODE,
      docsLabel: "Claude Code in VS Code",
    },
  },
  codex: {
    kind: "cli",
    label: "Codex CLI",
    short: "Codex",
    blurb: "OpenAI / ChatGPT coding agent in the terminal & editor.",
    docs: CODEX_DOCS,
    docsLabel: "Codex CLI getting started",
    checkCmd: "codex --version",
    modelsNote: "Default: gpt-5.5. Other combos: gpt-5.6-sol, gpt-5.6-terra, gpt-5.6-luna.",
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
        "Open Extensions / Marketplace in your editor.",
        "Search for and install the “Codex” extension (OpenAI Codex).",
        "Make sure the Codex CLI is installed and Mind Aku auto-config has been run.",
        "Use it as usual — requests go through Mind Aku.",
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
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t(label)}</p>
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
          {copied === copyId ? t("Copied") : t("Copy")}
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
  const { t } = useTranslation();
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
              <StepLabel n={2}>{t("Prepare Visual Studio Code")}</StepLabel>
              <h3 className="font-heading text-xl font-medium text-foreground">
                Chat + Language Models
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {t(
                  "Use Chat in VS Code with Mind Aku models via a Custom Endpoint. Auto-config writes chatLanguageModels.json and force-sets env keys in your shell. For Cursor, pick Cursor above — it uses state.vscdb instead."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={VSCODE_DOWNLOAD} target="_blank" rel="noopener noreferrer">
                  {t("Download VS Code")} <ArrowSquareOut />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={VSCODE_LM_DOCS} target="_blank" rel="noopener noreferrer">
                  {t("Docs")} <ArrowSquareOut />
                </a>
              </Button>
            </div>
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>{t("Install the latest Visual Studio Code (stable or Insiders).")}</li>
            <li>{t("Make sure the Chat feature is available (Chat panel in the sidebar).")}</li>
            <li>
              {t(
                "For Cursor IDE, use the Cursor tab — setup writes OpenAI API settings to state.vscdb, not chatLanguageModels.json."
              )}
            </li>
          </ol>

          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {t(
              "Mind Aku models appear in the mindaku group in the Chat model picker. Default thinking effort: high for all models from the models API. Model endpoint URLs use the gateway base without /v1 — VS Code adds the API path. Auto-config sends the API key via requestHeaders.Authorization (VS Code ignores plaintext apiKey)."
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <StepLabel n={3}>{t("Auto-config Mind Aku")}</StepLabel>
        {apiKey ? (
          <ClientSetupCard
            apiKey={apiKey}
            toolLabel="VS Code"
            modelsNote="This command fills chatLanguageModels.json (all models from the API, URLs without /v1), force-sets OPENAI_API_KEY + ANTHROPIC_API_KEY in your shell profile, then Chat is ready."
          />
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {t("Sign in again to show the auto-config command with your API key.")}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <StepLabel n={4}>{t("Reload & pick a model")}</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              {t("Enable mindaku models in Chat")}
            </h3>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              {t(
                "After auto-config finishes, in VS Code run Developer: Reload Window (Command Palette)."
              )}
            </li>
            <li>{t("Open the Chat panel, then open the model picker.")}</li>
            <li>{t("Pick a model in the mindaku group (list follows the gateway models API).")}</li>
            <li>
              {t(
                "Click the > arrow next to the model name → set Thinking Effort (recommended: High)."
              )}
            </li>
          </ol>

          <ManualShot
            src="/setup-guides/vscode-models.png"
            alt={t("VS Code Chat model picker showing mindaku models")}
            caption={t(
              "Example model picker: choose a model from the mindaku group (claude-opus-5, gpt-5.5, deepseek, etc.)"
            )}
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: t("macOS path"),
                text: "~/Library/Application Support/Code/User/chatLanguageModels.json",
              },
              {
                title: t("Windows path"),
                text: "%APPDATA%\\Code\\User\\chatLanguageModels.json",
              },
              {
                title: t("Linux path"),
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
            {t("If the gateway model list changes, re-run the auto-config command.")}
          </p>
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <StepLabel n={5}>{t("Manual (optional)")}</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              {t("Add a Custom Endpoint yourself")}
            </h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t(
                "Only if auto-config fails. In VS Code: model picker → Manage Language Models → Add Models → Custom Endpoint."
              )}
            </p>
          </div>

          <div className="space-y-3">
            <WizardField label={t("Vendor / group name")} value="mindaku" mono={false} />
            <WizardField
              label={t("API type")}
              value="chat-completions"
              copyId="vscode-api-type"
              copied={copied}
              onCopy={onCopy}
            />
            <WizardField
              label={t("URL (base, without /v1)")}
              value={baseUrl}
              copyId="vscode-base"
              copied={copied}
              onCopy={onCopy}
            />
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("API key")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("Paste your Mind Aku API key")}
                {apiKey
                  ? t(" (from this portal login session).")
                  : t(" (from the portal after login).")}
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
                    {copied === "vscode-key" ? t("Copied") : t("Copy")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {t(
              "Do not put /v1 in the model URL. With apiType: chat-completions, VS Code will call {{url}}/v1/chat/completions itself.",
              { url: baseUrl }
            )}
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              {t(
                'In chatLanguageModels.json, set per model: thinking: true, supportsReasoningEffort: ["low","medium","high"], reasoningEffortFormat: "chat-completions", and url = gateway base without /v1.'
              )}
            </li>
            <li>
              {t('In the provider settings, set "reasoningEffort": "high" per model id.')}
            </li>
            <li>{t("Save the file → Reload Window → pick a mindaku model in Chat.")}</li>
          </ol>

          <p className="text-xs text-muted-foreground">
            {t("Official reference:")}{" "}
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
  const { t } = useTranslation();
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
            <StepLabel n={2}>{t("Download Claude Desktop")}</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              {t("Install the official Anthropic app")}
            </h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t(
                "Download Claude Desktop for macOS or Windows, then install. You do not need to sign in to Claude.ai when using the Mind Aku gateway."
              )}
            </p>
          </div>
          <div className="flex justify-end">
            <Button asChild size="sm">
              <a href={CLAUDE_DESKTOP_DOWNLOAD} target="_blank" rel="noopener noreferrer">
                {t("Download")} <ArrowSquareOut />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Source:")}{" "}
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
            <StepLabel n={3}>{t("Enable Developer Mode")}</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              {t("Open the Developer menu")}
            </h3>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {t(
              "Important: if you are already signed in to a Claude.ai account in this app, log out first before continuing. The Mind Aku gateway is used without Claude.ai sign-in."
            )}
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              {t(
                "Open the Claude Desktop app (make sure you are logged out if you previously signed in)."
              )}
            </li>
            <li>{t("In the menu bar: Help → Troubleshooting → Enable Developer Mode.")}</li>
            <li>{t("Once enabled, the Developer menu appears in the menu bar.")}</li>
          </ol>
          <ManualShot
            src="/setup-guides/manual-1.png"
            alt={t("Enable Developer Mode in Claude Desktop")}
            caption="Help → Troubleshooting → Enable Developer Mode"
          />
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <StepLabel n={4}>{t("Open gateway settings")}</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              Configure Third-Party Inference
            </h3>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>{t("Click Developer → Configure Third-Party Inference…")}</li>
            <li>{t("Set the connection type to Gateway.")}</li>
          </ol>
          <ManualShot
            src="/setup-guides/manual-2.png"
            alt={t("Configure Third-Party Inference in Claude Desktop")}
            caption="Developer → Configure Third-Party Inference…"
          />
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <StepLabel n={5}>{t("Enter Mind Aku credentials")}</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              {t("Gateway credentials")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("On the Connection tab, fill in the following (match the screenshot):")}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("Gateway base URL")}
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
                  {copied === "gw-url" ? t("Copied") : t("Copy")}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("Gateway API key")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t("Paste your Mind Aku API key")}
                {apiKey
                  ? t(" (from this portal login session).")
                  : t(" (from the portal after login).")}
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
                    {copied === "gw-key" ? t("Copied") : t("Copy")}
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("Gateway auth scheme")}
              </p>
              <p className="mt-1 font-medium text-foreground">
                <code>x-api-key</code>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("Credential kind")}
              </p>
              <p className="mt-1 font-medium text-foreground">{t("Static API key")}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("Optional: click Test connection to verify the gateway is reachable.")}
          </p>

          <ManualShot
            src="/setup-guides/manual-3.png"
            alt={t("Fill in Gateway base URL and Mind Aku API key")}
            caption={`Gateway base URL = ${gatewayUrl}, auth scheme = x-api-key`}
          />
        </CardContent>
      </Card>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <StepLabel n={6}>{t("Configure models")}</StepLabel>
            <h3 className="font-heading text-xl font-medium text-foreground">
              {t("Model discovery & add 3 models")}
            </h3>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            <li>
              {t("Turn on Model discovery so models are fetched from {{url}}/v1/models.", {
                url: gatewayUrl,
              })}
            </li>
            <li>{t("In Model list, click the + Add button below.")}</li>
            <li>
              {t("Fill the model form like the screenshot below:")}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>{t("Model ID and Display name the same, e.g. claude-opus-5")}</li>
                <li>{t("Offer 1M-context variant: turn ON")}</li>
                <li>{t("Tier alias: can be left empty")}</li>
              </ul>
              <ManualShot
                src="/setup-guides/manual-4b.png"
                alt={t("Model form: Model ID, Display name, Offer 1M-context ON")}
                caption={t("Fill Model ID + Display name; Offer 1M-context variant ON")}
              />
            </li>
            <li>
              {t("Repeat until 3 models are listed:")}
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
              {t(
                "When the list is complete (Model discovery ON + 3 models), click Apply Changes."
              )}
              <ManualShot
                src="/setup-guides/manual-4b.png"
                alt={t("Model discovery ON and 3 Claude models in the list")}
                caption={t("Model discovery ON + 3 models, then Apply Changes")}
              />
            </li>
            <li>
              {t(
                "Fully quit Claude Desktop, then reopen it. On the welcome screen choose Continue (without Claude.ai sign-in)."
              )}
              <ManualShot
                src="/setup-guides/login-claude.png"
                alt={t("Welcome to Claude — Continue with custom gateway")}
                caption={t("Choose Continue — local gateway, no Claude.ai account")}
              />
            </li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            {t(
              "This flow follows third-party gateway integration patterns (similar to OpenRouter guides for Claude Desktop), adapted for Mind Aku."
            )}
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
  const { t } = useTranslation();
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
            {copied === copyId ? t("Copied") : t("Copy")}
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
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <StepLabel n={2}>{t("Auto-config Mind Aku")}</StepLabel>
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
              {t("Sign in again to show the auto-config command with your API key.")}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="scale-in border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <StepLabel n={3}>{t(tool.afterTitle)}</StepLabel>
              <h3 className="font-heading text-xl font-medium text-foreground">
                {t("After curl finishes")}
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {t(
                  "No need to fill Custom Provider manually. The model catalog is already written by the script."
                )}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={tool.docs} target="_blank" rel="noopener noreferrer">
                {t("Docs")} <ArrowSquareOut />
              </a>
            </Button>
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-foreground">
            {tool.afterSteps.map((step) => (
              <li key={step}>{t(step)}</li>
            ))}
          </ol>

          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("Run")}
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground">
              <code>{tool.runCmd}</code>
            </pre>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("Official guide:")}{" "}
            <a
              href={tool.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t(tool.docsLabel)}
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
  const { t } = useTranslation();
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
        title={t("Setup")}
        description={t("Pick one tool and connect it to Mind Aku.")}
      />

      <div className="space-y-5">
        <GatewayEndpointCard className="scale-in-delay-1" />

        <Card className="scale-in scale-in-delay-1 border-border bg-card shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <StepLabel n={1}>{t("Choose a tool")}</StepLabel>
              <h3 className="font-heading text-xl font-medium text-foreground">
                {t("Pick just one")}
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {t(
                  "Start with VS Code Chat, Cursor, Cline, Claude Desktop, Claude Code, Codex, OpenClaw, Hermes, OpenCode, or KiloCode. Next steps follow your choice."
                )}
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
                          {t("Selected")}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t(item.blurb)}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {!selected ? (
          <Card className="border-dashed border-border bg-muted/40">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {t(
                "Pick a tool above — VS Code Chat, Cursor, Cline, Claude Desktop, Claude Code, Codex CLI, OpenClaw, Hermes, OpenCode, or KiloCode — to see the full guide."
              )}
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
                    <StepLabel n={2}>
                      {t("Install {{label}}", { label: selected.label })}
                    </StepLabel>
                    <h3 className="font-heading text-xl font-medium text-foreground">
                      {t("Install the CLI on your machine")}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      {t("Install for your OS. When done, verify with")}{" "}
                      <code>{selected.checkCmd}</code>.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.docs} target="_blank" rel="noopener noreferrer">
                      {t("Docs")} <ArrowSquareOut />
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
                  {t("Official guide:")}{" "}
                  <a
                    href={selected.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t(selected.docsLabel)}
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            <div>
              <StepLabel n={3}>{t("Connect to Mind Aku")}</StepLabel>
              {apiKey ? (
                <ClientSetupCard
                  apiKey={apiKey}
                  toolLabel={selected.label}
                  modelsNote={selected.modelsNote}
                />
              ) : (
                <Card className="border-border bg-card">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    {t("Sign in again to show the auto-config command with your API key.")}
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="scale-in border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StepLabel n={4}>{t("Editor (optional)")}</StepLabel>
                    <h3 className="font-heading text-xl font-medium text-foreground">
                      VS Code, Cursor, Antigravity
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      {t(
                        "After the CLI + auto-config are ready, install the {{tool}} extension in your editor — then use it as usual.",
                        { tool: selected.short }
                      )}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={selected.ide.docsHref} target="_blank" rel="noopener noreferrer">
                      {t("Docs")} <ArrowSquareOut />
                    </a>
                  </Button>
                </div>

                <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-foreground">
                  {selected.ide.steps.map((step) => (
                    <li key={step}>{t(step)}</li>
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
                        {t("Install the {{tool}} extension, then use it as usual.", {
                          tool: selected.short,
                        })}
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
