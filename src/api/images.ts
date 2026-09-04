import { AI_BASE_URL } from "../config";
import { ApiError } from "./types";

const IMAGE_TIMEOUT_MS = 180_000;

export type ImageResponseFormat = "url" | "b64_json";
export type ImageOutputFormat = "png" | "jpeg";
export type ImageQuality = "low" | "medium" | "high" | "auto";
export type ImageSize =
  | "auto"
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "3840x2160";

export type ImageGenerationParams = {
  model: string;
  prompt: string;
  size: ImageSize;
  quality: ImageQuality;
  response_format: ImageResponseFormat;
  output_format: ImageOutputFormat;
  n?: number;
  signal?: AbortSignal;
};

export type ImageEditParams = {
  model: string;
  prompt: string;
  image: File;
  size: ImageSize;
  quality: ImageQuality;
  response_format: ImageResponseFormat;
  output_format?: ImageOutputFormat;
  signal?: AbortSignal;
};

export type ImageResultItem = {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
};

export type ImageApiResult = {
  ok: boolean;
  status: number;
  body: unknown;
  images: ImageResultItem[];
  error?: ApiError;
};

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") {
    return typeof body === "string" && body.trim() ? body : fallback;
  }
  const record = body as { error?: unknown; message?: unknown };
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (record.error && typeof record.error === "object") {
    const nested = (record.error as { message?: unknown }).message;
    if (typeof nested === "string" && nested.trim()) return nested;
  }
  if (typeof record.message === "string" && record.message.trim()) return record.message;
  return fallback;
}

function mapHttpError(status: number, message: string): ApiError {
  const lower = message.toLowerCase();
  if (status === 401) {
    if (
      lower.includes("expired") ||
      lower.includes("kadaluarsa") ||
      lower.includes("masa aktif")
    ) {
      return new ApiError(
        "Masa aktif habis. Top up minimal Rp 100.000 untuk perpanjang 30 hari.",
        401,
        "expired"
      );
    }
    return new ApiError("Invalid or expired API key.", 401, "unauthorized");
  }
  if (status === 403) {
    return new ApiError(
      message ||
        "This API key is not allowed to use image generation. Ask your admin to enable it.",
      403,
      "forbidden"
    );
  }
  if (status === 402) {
    return new ApiError(
      message || "Quota exhausted. Top up to continue generating images.",
      402,
      "quota"
    );
  }
  if (status === 429) {
    return new ApiError(message || "Rate limited. Try again in a moment.", 429, "rate_limit");
  }
  if (
    lower.includes("quota") ||
    lower.includes("lifetime") ||
    lower.includes("insufficient") ||
    lower.includes("budget") ||
    lower.includes("usage limit")
  ) {
    return new ApiError(message, status, "quota");
  }
  return new ApiError(message, status, "unknown");
}

function parseImages(body: unknown): ImageResultItem[] {
  if (!body || typeof body !== "object") return [];
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  const images: ImageResultItem[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as ImageResultItem;
    if (typeof row.url === "string" && row.url) {
      images.push({
        url: row.url,
        revised_prompt:
          typeof row.revised_prompt === "string" ? row.revised_prompt : undefined,
      });
      continue;
    }
    if (typeof row.b64_json === "string" && row.b64_json) {
      images.push({
        b64_json: row.b64_json,
        revised_prompt:
          typeof row.revised_prompt === "string" ? row.revised_prompt : undefined,
      });
    }
  }
  return images;
}

function withTimeoutSignal(
  outer: AbortSignal | undefined,
  ms: number
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);

  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener("abort", onOuterAbort);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timer);
      if (outer) outer.removeEventListener("abort", onOuterAbort);
    },
  };
}

async function postImageRequest(
  path: string,
  apiKey: string,
  init: {
    body: BodyInit;
    headers?: HeadersInit;
    signal?: AbortSignal;
  }
): Promise<ImageApiResult> {
  const { signal, cleanup } = withTimeoutSignal(init.signal, IMAGE_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${AI_BASE_URL.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init.headers ?? {}),
      },
      body: init.body,
      signal,
    });
  } catch (err) {
    cleanup();
    if (err instanceof DOMException && err.name === "AbortError") {
      if (init.signal?.aborted) throw err;
      throw new ApiError(
        "Image generation timed out. Try again or check proxy timeout settings.",
        0,
        "network"
      );
    }
    throw new ApiError(
      "Unable to reach Mind Aku. Check the base URL and CORS settings.",
      0,
      "network"
    );
  }
  cleanup();

  const raw = await response.text();
  let body: unknown = raw || null;
  if (raw) {
    try {
      body = JSON.parse(raw) as unknown;
    } catch {
      body = raw;
    }
  }

  if (!response.ok) {
    const message = messageFromBody(body, `Request failed (${response.status})`);
    return {
      ok: false,
      status: response.status,
      body,
      images: [],
      error: mapHttpError(response.status, message),
    };
  }

  return {
    ok: true,
    status: response.status,
    body,
    images: parseImages(body),
  };
}

export async function createImageGeneration(
  apiKey: string,
  params: ImageGenerationParams
): Promise<ImageApiResult> {
  return postImageRequest("/images/generations", apiKey, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      size: params.size,
      quality: params.quality,
      response_format: params.response_format,
      output_format: params.output_format,
      n: params.n ?? 1,
    }),
    signal: params.signal,
  });
}

export async function createImageEdit(
  apiKey: string,
  params: ImageEditParams
): Promise<ImageApiResult> {
  const form = new FormData();
  form.append("model", params.model);
  form.append("prompt", params.prompt);
  form.append("image", params.image);
  form.append("size", params.size);
  form.append("quality", params.quality);
  form.append("response_format", params.response_format);
  if (params.output_format) {
    form.append("output_format", params.output_format);
  }

  // Do not set Content-Type — browser must include multipart boundary.
  return postImageRequest("/images/edits", apiKey, {
    body: form,
    signal: params.signal,
  });
}

export function imageSrcFromResult(item: ImageResultItem): string | null {
  if (item.url) return item.url;
  if (item.b64_json) {
    const raw = item.b64_json;
    if (raw.startsWith("data:")) return raw;
    return `data:image/png;base64,${raw}`;
  }
  return null;
}
