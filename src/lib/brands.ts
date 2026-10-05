/** Brand / model-family icon keys under `/brands/*.svg`. */
export type BrandKey =
  | "claude"
  | "openai"
  | "gemini"
  | "deepseek"
  | "grok"
  | "qwen"
  | "kimi"
  | "meta"
  | "mistral"
  | "huggingface"
  | "google"
  | "anthropic"
  | "vscode"
  | "cursor"
  | "openclaw"
  | "hermes"
  | "antigravity"
  | "continue"
  | "cline"
  | "opencode"
  | "kilocode"
  | "default";

const BRAND_FILES: Record<BrandKey, string> = {
  claude: "/brands/claude.svg",
  openai: "/brands/openai.svg",
  gemini: "/brands/gemini.svg",
  deepseek: "/brands/deepseek.svg",
  grok: "/brands/grok.svg",
  qwen: "/brands/qwen.svg",
  kimi: "/brands/kimi.svg",
  meta: "/brands/meta.svg",
  mistral: "/brands/mistral.svg",
  huggingface: "/brands/huggingface.svg",
  google: "/brands/google.svg",
  anthropic: "/brands/anthropic.svg",
  vscode: "/brands/vscode.svg",
  cursor: "/brands/cursor.svg",
  openclaw: "/brands/openclaw.svg",
  hermes: "/brands/hermes.svg",
  antigravity: "/brands/antigravity.svg",
  continue: "/brands/continue.svg",
  cline: "/brands/cline.svg",
  opencode: "/brands/opencode.svg",
  kilocode: "/brands/kilocode.svg",
  default: "/brands/default.svg",
};

/** Icons that are mostly black — need a light plate on dark UI. */
const DARK_INK_BRANDS = new Set<BrandKey>([
  "cursor",
  "openai",
  "grok",
  "anthropic",
  "meta",
  "opencode",
]);

export function brandSrc(key: BrandKey): string {
  return BRAND_FILES[key] ?? BRAND_FILES.default;
}

export function brandNeedsLightPlate(key: BrandKey): boolean {
  return DARK_INK_BRANDS.has(key);
}

/** Resolve setup tool id (vscode, claude, …) to a brand icon. */
export function brandKeyForToolId(id: string): BrandKey {
  const key = id.toLowerCase().trim();
  if (key === "vscode" || key === "vs-code") return "vscode";
  if (key === "cursor") return "cursor";
  if (key === "cline") return "cline";
  if (key === "desktop" || key === "claude") return "claude";
  if (key === "codex") return "openai";
  if (key === "openclaw") return "openclaw";
  if (key === "hermes") return "hermes";
  if (key === "opencode") return "opencode";
  if (key === "kilocode" || key === "kilo") return "kilocode";
  return brandKeyForTool(id);
}

/** Resolve a tool / product label to a brand icon. */
export function brandKeyForTool(label: string): BrandKey {
  const s = label.toLowerCase().replace(/\s+/g, " ").trim();
  if (s.includes("opencode") || s === "open code") return "opencode";
  if (s.includes("kilocode") || s.includes("kilo")) return "kilocode";
  if (s.includes("claude")) return "claude";
  if (s.includes("codex") || s.includes("openai")) return "openai";
  if (s.includes("cursor")) return "cursor";
  if (s.includes("vs code") || s.includes("vscode") || s === "visual studio code") return "vscode";
  if (s.includes("openclaw")) return "openclaw";
  if (s.includes("hermes")) return "hermes";
  if (s.includes("antigravity")) return "antigravity";
  if (s.includes("continue")) return "continue";
  if (s.includes("cline")) return "cline";
  if (s.includes("gemini") || s.includes("google")) return "gemini";
  return "default";
}

/**
 * Resolve a model id (e.g. `claude-opus-5`, `gpt-5.6-sol`, `fable-5`) to a family icon.
 * Claude family includes opus / sonnet / haiku / fable.
 */
export function brandKeyForModel(modelId: string): BrandKey {
  const id = modelId.toLowerCase();

  if (
    id.includes("claude") ||
    id.includes("anthropic") ||
    id.includes("opus") ||
    id.includes("sonnet") ||
    id.includes("haiku") ||
    id.includes("fable")
  ) {
    return "claude";
  }
  if (
    id.includes("gpt") ||
    id.includes("openai") ||
    id.includes("o1") ||
    id.includes("o3") ||
    id.includes("o4") ||
    id.includes("codex") ||
    id.includes("chatgpt")
  ) {
    return "openai";
  }
  if (id.includes("gemini") || id.includes("gemma")) return "gemini";
  if (id.includes("deepseek")) return "deepseek";
  if (id.includes("grok") || id.includes("xai")) return "grok";
  if (id.includes("qwen") || id.includes("qwq")) return "qwen";
  if (id.includes("kimi") || id.includes("moonshot")) return "kimi";
  if (id.includes("llama") || id.includes("meta-")) return "meta";
  if (id.includes("mistral") || id.includes("mixtral") || id.includes("codestral")) return "mistral";
  if (id.includes("huggingface") || id.includes("hf-")) return "huggingface";

  return "default";
}
