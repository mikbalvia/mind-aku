import { useMemo, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { createChatCompletion } from "../api/chat";
import { ApiError } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { GatewayEndpointCard } from "../components/GatewayEndpointCard";
import { ErrorBanner, PageHeader } from "../components/page-chrome";
import { AI_BASE_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_PROMPT = "Hello! Reply in one sentence.";

const SAMPLE_MODELS = [
  { id: "deepseek-v4-pro", label: "DeepSeek Pro" },
  { id: "claude-opus-5", label: "Claude Opus" },
] as const;

type SampleModelId = (typeof SAMPLE_MODELS)[number]["id"];

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function formatJson(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function assistantText(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as { message?: { content?: unknown } } | undefined;
  const content = first?.message?.content;
  if (typeof content === "string" && content.trim()) return content;
  return null;
}

function ModelPicker({
  value,
  onChange,
  disabled,
  id,
}: {
  value: SampleModelId;
  onChange: (id: SampleModelId) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as SampleModelId)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full max-w-md">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SAMPLE_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function buildSnippets(opts: {
  v1Url: string;
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const { v1Url, apiKey, model, prompt } = opts;
  const chatUrl = `${v1Url}/chat/completions`;
  const modelsUrl = `${v1Url}/models`;
  const payload = JSON.stringify(
    {
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    },
    null,
    2
  );
  const keyLit = JSON.stringify(apiKey);
  const baseLit = JSON.stringify(v1Url);
  const modelLit = JSON.stringify(model);
  const promptLit = JSON.stringify(prompt);

  const curl = [
    `curl -sS ${shellSingleQuote(chatUrl)} \\`,
    `  -H ${shellSingleQuote(`Authorization: Bearer ${apiKey}`)} \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d ${shellSingleQuote(payload)}`,
    ``,
    `# List models`,
    `curl -sS ${shellSingleQuote(modelsUrl)} \\`,
    `  -H ${shellSingleQuote(`Authorization: Bearer ${apiKey}`)}`,
  ].join("\n");

  const python = [
    `from openai import OpenAI`,
    ``,
    `client = OpenAI(`,
    `    api_key=${keyLit},`,
    `    base_url=${baseLit},`,
    `)`,
    ``,
    `completion = client.chat.completions.create(`,
    `    model=${modelLit},`,
    `    messages=[{"role": "user", "content": ${promptLit}}],`,
    `)`,
    `print(completion.choices[0].message.content)`,
    ``,
    `# List models`,
    `print(client.models.list())`,
  ].join("\n");

  const javascript = [
    `const res = await fetch(${JSON.stringify(chatUrl)}, {`,
    `  method: "POST",`,
    `  headers: {`,
    `    Authorization: ${JSON.stringify(`Bearer ${apiKey}`)},`,
    `    "Content-Type": "application/json",`,
    `  },`,
    `  body: JSON.stringify({`,
    `    model: ${modelLit},`,
    `    messages: [{ role: "user", content: ${promptLit} }],`,
    `    stream: false,`,
    `  }),`,
    `});`,
    `const data = await res.json();`,
    `console.log(data);`,
    ``,
    `// List models`,
    `const models = await fetch(${JSON.stringify(modelsUrl)}, {`,
    `  headers: { Authorization: ${JSON.stringify(`Bearer ${apiKey}`)} },`,
    `});`,
    `console.log(await models.json());`,
  ].join("\n");

  return { curl, python, javascript };
}

export function SampleApiPage() {
  const { apiKey } = useAuth();
  const v1Url = AI_BASE_URL.replace(/\/$/, "");

  const [selectedModel, setSelectedModel] = useState<SampleModelId>("deepseek-v4-pro");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [copied, setCopied] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ok: boolean;
    status: number;
    latencyMs: number;
    body: unknown;
  } | null>(null);

  const snippets = useMemo(
    () =>
      buildSnippets({
        v1Url,
        apiKey: apiKey ?? "YOUR_API_KEY",
        model: selectedModel,
        prompt: prompt.trim() || DEFAULT_PROMPT,
      }),
    [v1Url, apiKey, selectedModel, prompt]
  );

  async function onCopy(id: string, value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 2000);
  }

  async function onSend() {
    if (!apiKey || sending) return;
    const content = prompt.trim();
    if (!content) {
      setSendError("Isi prompt dulu.");
      return;
    }

    setSending(true);
    setSendError(null);
    setResult(null);
    const started = performance.now();
    try {
      const response = await createChatCompletion(apiKey, {
        model: selectedModel,
        messages: [{ role: "user", content }],
      });
      setResult({
        ok: response.ok,
        status: response.status,
        latencyMs: Math.round(performance.now() - started),
        body: response.body,
      });
      if (!response.ok) {
        setSendError(response.error?.message ?? `Request failed (${response.status})`);
      }
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Request failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Developer"
        title="Sample API"
        description="Contoh request OpenAI-compatible untuk DeepSeek Pro dan Claude Opus, plus form untuk coba POST /v1/chat/completions dengan API key sesi ini."
      />

      <div className="space-y-6">
        <GatewayEndpointCard />

        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Snippets
              </p>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Copy-paste ke client kamu
              </h3>
              <p className="text-sm text-muted-foreground">
                Contoh memakai DeepSeek Pro (<code className="text-foreground">deepseek-v4-pro</code>)
                dan Claude Opus (<code className="text-foreground">claude-opus-5</code>), plus API key
                dari sesi login.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="snippet-model">Model</Label>
              <ModelPicker
                id="snippet-model"
                value={selectedModel}
                onChange={setSelectedModel}
              />
            </div>

            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <SnippetBlock
                  copyId="curl"
                  code={snippets.curl}
                  copied={copied}
                  onCopy={onCopy}
                />
              </TabsContent>
              <TabsContent value="python">
                <SnippetBlock
                  copyId="python"
                  code={snippets.python}
                  copied={copied}
                  onCopy={onCopy}
                />
              </TabsContent>
              <TabsContent value="javascript">
                <SnippetBlock
                  copyId="javascript"
                  code={snippets.javascript}
                  copied={copied}
                  onCopy={onCopy}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Try request
              </p>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Kirim sample chat completion
              </h3>
              <p className="text-sm text-muted-foreground">
                Request ini memakai kuota seperti Chat. Response bisa dilihat sebagai kalimat atau JSON.
              </p>
            </div>

            {sendError ? <ErrorBanner message={sendError} /> : null}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sample-model">Model</Label>
                <ModelPicker
                  id="sample-model"
                  value={selectedModel}
                  onChange={setSelectedModel}
                  disabled={sending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sample-prompt">Prompt</Label>
                <textarea
                  id="sample-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  disabled={sending}
                  placeholder={DEFAULT_PROMPT}
                  className="min-h-[5.5rem] w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void onSend()}
                disabled={sending || !prompt.trim()}
              >
                {sending ? "Sending…" : "Kirim request"}
              </Button>
              {result ? (
                <p className="text-sm text-muted-foreground">
                  HTTP {result.status}
                  {result.ok ? " OK" : ""} · {result.latencyMs} ms
                </p>
              ) : null}
            </div>

            {result ? (
              <Tabs defaultValue="text" key={`${result.status}-${result.latencyMs}`}>
                <TabsList>
                  <TabsTrigger value="text">Kalimat</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="text">
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-6 text-foreground">
                    {assistantText(result.body) ?? "Tidak ada teks di response."}
                  </div>
                </TabsContent>
                <TabsContent value="json">
                  <pre className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground">
                    <code>{formatJson(result.body)}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SnippetBlock({
  copyId,
  code,
  copied,
  onCopy,
}: {
  copyId: string;
  code: string;
  copied: string | null;
  onCopy: (id: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground">
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => onCopy(copyId, code)}
      >
        {copied === copyId ? <Check weight="bold" /> : <Copy weight="bold" />}
        {copied === copyId ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
