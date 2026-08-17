import { OMNIROUTE_BASE_URL } from "../config";
import { ApiError, type ChatCompletionChunk, type ChatMessage } from "./types";

export type StreamChatParams = {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
};

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as {
      error?: string | { message?: string };
      message?: string;
    };
    if (typeof body?.error === "string" && body.error) return body.error;
    if (body?.error && typeof body.error === "object" && body.error.message) {
      return body.error.message;
    }
    if (typeof body?.message === "string" && body.message) return body.message;
  } catch {
    // ignore parse errors
  }
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
      "This API key is not allowed to use chat completions. Ask your admin to enable it.",
      403,
      "forbidden"
    );
  }
  if (status === 402) {
    return new ApiError(
      message || "Quota exhausted. Top up to continue chatting.",
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

/**
 * Stream OpenAI-compatible chat completions from OmniRoute.
 * Yields assistant text deltas as they arrive.
 */
export async function* streamChatCompletions(
  apiKey: string,
  params: StreamChatParams
): AsyncGenerator<string, void, undefined> {
  let response: Response;
  try {
    response = await fetch(`${OMNIROUTE_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: true,
      }),
      signal: params.signal,
    });
  } catch {
    if (params.signal?.aborted) return;
    throw new ApiError("Unable to reach Mind Aku. Check the base URL and CORS settings.", 0, "network");
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw mapHttpError(response.status, message);
  }

  if (!response.body) {
    throw new ApiError("Streaming is not available from this gateway response.", 0, "unknown");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload) continue;
        if (payload === "[DONE]") return;

        let chunk: ChatCompletionChunk;
        try {
          chunk = JSON.parse(payload) as ChatCompletionChunk;
        } catch {
          continue;
        }

        if (chunk.error?.message) {
          throw mapHttpError(response.status || 500, chunk.error.message);
        }

        const delta = chunk.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          yield delta;
        }
      }
    }

    // Flush any trailing complete SSE frame without a final newline.
    const trailing = buffer.trim();
    if (trailing.startsWith("data:")) {
      const payload = trailing.slice(5).trim();
      if (payload && payload !== "[DONE]") {
        try {
          const chunk = JSON.parse(payload) as ChatCompletionChunk;
          const delta = chunk.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) yield delta;
        } catch {
          // ignore
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

export type CreateChatCompletionParams = {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
};

export type CreateChatCompletionResult = {
  ok: boolean;
  status: number;
  body: unknown;
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

/**
 * Non-streaming OpenAI-compatible chat completion. Returns the raw JSON body
 * (including gateway errors) so the Sample API page can display it.
 */
export async function createChatCompletion(
  apiKey: string,
  params: CreateChatCompletionParams
): Promise<CreateChatCompletionResult> {
  let response: Response;
  try {
    response = await fetch(`${OMNIROUTE_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: false,
      }),
      signal: params.signal,
    });
  } catch (err) {
    if (params.signal?.aborted) throw err;
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      "Unable to reach Mind Aku. Check the base URL and CORS settings.",
      0,
      "network"
    );
  }

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
      error: mapHttpError(response.status, message),
    };
  }

  return { ok: true, status: response.status, body };
}
