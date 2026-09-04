import { useEffect, useState } from "react";
import { DownloadSimple, Image as ImageIcon, Link as LinkIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchPortalModels } from "../api/client";
import {
  createImageEdit,
  createImageGeneration,
  imageSrcFromResult,
  type ImageOutputFormat,
  type ImageQuality,
  type ImageResponseFormat,
  type ImageResultItem,
  type ImageSize,
} from "../api/images";
import { ApiError } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { GatewayEndpointCard } from "../components/GatewayEndpointCard";
import { ErrorBanner, PageHeader } from "../components/page-chrome";
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

const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_PROMPT =
  "An orange tabby cat wearing an orange scarf, warm illustration style";

const SIZE_OPTIONS: ImageSize[] = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "3840x2160",
];

const QUALITY_OPTIONS: ImageQuality[] = ["low", "medium", "high", "auto"];
const RESPONSE_FORMAT_OPTIONS: ImageResponseFormat[] = ["url", "b64_json"];
const OUTPUT_FORMAT_OPTIONS: ImageOutputFormat[] = ["png", "jpeg"];

function isImageishModel(id: string): boolean {
  const lower = id.toLowerCase();
  return (
    lower.includes("image") ||
    lower.includes("dall-e") ||
    lower.includes("flux") ||
    lower.includes("imagen") ||
    lower.includes("grok-imagine")
  );
}

function formatJson(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function downloadImage(src: string, index: number, outputFormat: ImageOutputFormat) {
  const ext = outputFormat === "jpeg" ? "jpg" : "png";
  const filename = `mindaku-image-${index + 1}.${ext}`;
  const anchor = document.createElement("a");
  anchor.href = src;
  anchor.download = filename;
  anchor.rel = "noopener";
  if (src.startsWith("http")) {
    anchor.target = "_blank";
  }
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function FieldSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as T)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ResultGallery({
  images,
  outputFormat,
}: {
  images: ImageResultItem[];
  outputFormat: ImageOutputFormat;
}) {
  const { t } = useTranslation();
  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No image in the response. Check the JSON tab or try again.")}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {images.map((item, index) => {
        const src = imageSrcFromResult(item);
        if (!src) return null;
        return (
          <div
            key={`${index}-${item.url ?? item.b64_json?.slice(0, 24) ?? "img"}`}
            className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3"
          >
            <div className="overflow-hidden rounded-lg bg-black/30">
              <img
                src={src}
                alt={t("Generated image {{n}}", { n: index + 1 })}
                className="mx-auto max-h-[28rem] w-full object-contain"
              />
            </div>
            {item.revised_prompt ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.revised_prompt}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => downloadImage(src, index, outputFormat)}
              >
                <DownloadSimple weight="bold" className="size-3.5" />
                {t("Download")}
              </Button>
              {item.url ? (
                <Button type="button" size="sm" variant="ghost" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <LinkIcon weight="bold" className="size-3.5" />
                    {t("Open URL")}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ImageGenerationPage() {
  const { t } = useTranslation();
  const { apiKey } = useAuth();

  const [models, setModels] = useState<string[]>([DEFAULT_MODEL]);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [quality, setQuality] = useState<ImageQuality>("high");
  const [responseFormat, setResponseFormat] =
    useState<ImageResponseFormat>("url");
  const [outputFormat, setOutputFormat] = useState<ImageOutputFormat>("png");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ok: boolean;
    status: number;
    latencyMs: number;
    body: unknown;
    images: ImageResultItem[];
  } | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchPortalModels(apiKey);
        const ids = (res.data ?? []).map((m) => m.id).filter(Boolean);
        const imageIds = ids.filter(isImageishModel);
        const next = imageIds.length > 0 ? imageIds : [DEFAULT_MODEL];
        if (!next.includes(DEFAULT_MODEL)) next.unshift(DEFAULT_MODEL);
        if (cancelled) return;
        setModels(Array.from(new Set(next)));
        setModel((current) =>
          next.includes(current) ? current : next[0] ?? DEFAULT_MODEL
        );
      } catch {
        if (!cancelled) setModels([DEFAULT_MODEL]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const sharedFieldsDisabled = sending;

  const sharedControls = (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="image-model">{t("Model")}</Label>
          <Select
            value={model}
            onValueChange={setModel}
            disabled={sharedFieldsDisabled}
          >
            <SelectTrigger id="image-model" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FieldSelect
          id="image-size"
          label={t("Size")}
          value={size}
          options={SIZE_OPTIONS}
          onChange={setSize}
          disabled={sharedFieldsDisabled}
        />
        <FieldSelect
          id="image-quality"
          label={t("Quality")}
          value={quality}
          options={QUALITY_OPTIONS}
          onChange={setQuality}
          disabled={sharedFieldsDisabled}
        />
        <FieldSelect
          id="image-response-format"
          label={t("Response format")}
          value={responseFormat}
          options={RESPONSE_FORMAT_OPTIONS}
          onChange={setResponseFormat}
          disabled={sharedFieldsDisabled}
        />
        <FieldSelect
          id="image-output-format"
          label={t("Output format")}
          value={outputFormat}
          options={OUTPUT_FORMAT_OPTIONS}
          onChange={setOutputFormat}
          disabled={sharedFieldsDisabled}
        />

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="image-n">{t("n")}</Label>
          <input
            id="image-n"
            type="text"
            value="1"
            readOnly
            disabled
            className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            {t("Keep n = 1. Request more images one at a time.")}
          </p>
        </div>
      </div>
  );

  async function runGenerate() {
    if (!apiKey || sending) return;
    const content = prompt.trim();
    if (!content) {
      setSendError(t("Enter a prompt first."));
      return;
    }

    setSending(true);
    setSendError(null);
    setResult(null);
    const started = performance.now();
    try {
      const response = await createImageGeneration(apiKey, {
        model,
        prompt: content,
        size,
        quality,
        response_format: responseFormat,
        output_format: outputFormat,
        n: 1,
      });
      setResult({
        ok: response.ok,
        status: response.status,
        latencyMs: Math.round(performance.now() - started),
        body: response.body,
        images: response.images,
      });
      if (!response.ok) {
        setSendError(
          response.error?.message ?? `Request failed (${response.status})`
        );
      } else if (response.images.length === 0) {
        setSendError(
          t("Request succeeded but no image was returned. Check the JSON response.")
        );
      }
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : t("Request failed."));
    } finally {
      setSending(false);
    }
  }

  async function runEdit() {
    if (!apiKey || sending) return;
    const content = prompt.trim();
    if (!content) {
      setSendError(t("Enter a prompt first."));
      return;
    }
    if (!editFile) {
      setSendError(t("Choose an image file to edit."));
      return;
    }

    setSending(true);
    setSendError(null);
    setResult(null);
    const started = performance.now();
    try {
      const response = await createImageEdit(apiKey, {
        model,
        prompt: content,
        image: editFile,
        size,
        quality,
        response_format: responseFormat,
        output_format: outputFormat,
      });
      setResult({
        ok: response.ok,
        status: response.status,
        latencyMs: Math.round(performance.now() - started),
        body: response.body,
        images: response.images,
      });
      if (!response.ok) {
        setSendError(
          response.error?.message ?? `Request failed (${response.status})`
        );
      } else if (response.images.length === 0) {
        setSendError(
          t("Request succeeded but no image was returned. Check the JSON response.")
        );
      }
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : t("Request failed."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Studio")}
        title={t("Image")}
        description={t(
          "Generate or edit images with the OpenAI Images API. Use this page — not Chat — for image models."
        )}
        actions={
          <Button variant="outline" asChild>
            <Link to="/image-guide">
              <ImageIcon weight="duotone" className="size-4" />
              {t("Image Guide")}
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <GatewayEndpointCard />

        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card/70 to-transparent">
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t("Important")}</p>
            <p>
              {t(
                "Call POST /v1/images/generations or /v1/images/edits. Do not use /v1/chat/completions for gpt-image-2 — size, quality, and output_format will not apply correctly."
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <Tabs
              defaultValue="generate"
              onValueChange={() => {
                setSendError(null);
                setResult(null);
              }}
            >
              <TabsList>
                <TabsTrigger value="generate">{t("Generate")}</TabsTrigger>
                <TabsTrigger value="edit">{t("Edit")}</TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-5">
                {sendError ? <ErrorBanner message={sendError} /> : null}
                {sharedControls}
                <div className="space-y-2">
                  <Label htmlFor="image-prompt">{t("Prompt")}</Label>
                  <textarea
                    id="image-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    disabled={sending}
                    placeholder={DEFAULT_PROMPT}
                    className="min-h-[6rem] w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => void runGenerate()}
                    disabled={sending || !prompt.trim()}
                  >
                    {sending ? t("Generating…") : t("Generate image")}
                  </Button>
                  {result ? (
                    <p className="text-sm text-muted-foreground">
                      HTTP {result.status}
                      {result.ok ? " OK" : ""} · {result.latencyMs} ms
                    </p>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="edit" className="space-y-5">
                {sendError ? <ErrorBanner message={sendError} /> : null}
                {sharedControls}
                <div className="space-y-2">
                  <Label htmlFor="image-file">{t("Image")}</Label>
                  <input
                    id="image-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    disabled={sending}
                    onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Upload the source image (multipart field: image). Describe what to keep and what to change in the prompt."
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-edit-prompt">{t("Prompt")}</Label>
                  <textarea
                    id="image-edit-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    disabled={sending}
                    placeholder={t(
                      "Keep the subject, change the background to a rainy neon city"
                    )}
                    className="min-h-[6rem] w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => void runEdit()}
                    disabled={sending || !prompt.trim() || !editFile}
                  >
                    {sending ? t("Editing…") : t("Edit image")}
                  </Button>
                  {result ? (
                    <p className="text-sm text-muted-foreground">
                      HTTP {result.status}
                      {result.ok ? " OK" : ""} · {result.latencyMs} ms
                    </p>
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>

            {result ? (
              <Tabs
                defaultValue="preview"
                key={`${result.status}-${result.latencyMs}`}
              >
                <TabsList>
                  <TabsTrigger value="preview">{t("Preview")}</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="preview">
                  <ResultGallery
                    images={result.images}
                    outputFormat={outputFormat}
                  />
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
