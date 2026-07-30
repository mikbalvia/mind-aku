export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DOC_CHARS = 100_000;

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".markdown", ".csv", ".json", ".log"]);
const PDF_EXTENSIONS = new Set([".pdf"]);
const DOCX_EXTENSIONS = new Set([".docx"]);

export type ExtractedDoc = {
  name: string;
  mimeType: string;
  charCount: number;
  truncated: boolean;
  text: string;
};

export class DocExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocExtractError";
  }
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function truncateText(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_DOC_CHARS) return { text, truncated: false };
  return {
    text: `${text.slice(0, MAX_DOC_CHARS)}\n\n[…truncated to ${MAX_DOC_CHARS.toLocaleString()} characters]`,
    truncated: true,
  };
}

function isSupported(name: string, mimeType: string): boolean {
  const ext = extensionOf(name);
  if (TEXT_EXTENSIONS.has(ext) || PDF_EXTENSIONS.has(ext) || DOCX_EXTENSIONS.has(ext)) return true;
  if (mimeType.startsWith("text/")) return true;
  if (mimeType === "application/json") return true;
  if (mimeType === "application/pdf") return true;
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return true;
  }
  return false;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite resolves the worker as a URL module.
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    if (pageText.trim()) {
      parts.push(`--- Page ${pageNum} ---\n${pageText}`);
    }
    // Stop early if already over the char budget (before truncation message).
    if (parts.join("\n\n").length >= MAX_DOC_CHARS) break;
  }

  await doc.cleanup();
  return parts.join("\n\n").trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value ?? "").trim();
}

async function extractPlainText(file: File): Promise<string> {
  return (await file.text()).trim();
}

export async function extractDocumentText(file: File): Promise<ExtractedDoc> {
  if (file.size > MAX_DOC_BYTES) {
    throw new DocExtractError(
      `File is too large (max ${Math.round(MAX_DOC_BYTES / (1024 * 1024))} MB).`
    );
  }

  const name = file.name || "document";
  const mimeType = file.type || "application/octet-stream";

  if (!isSupported(name, mimeType)) {
    throw new DocExtractError("Unsupported file type. Use PDF, DOCX, TXT, MD, CSV, or JSON.");
  }

  const ext = extensionOf(name);
  let raw = "";

  try {
    if (PDF_EXTENSIONS.has(ext) || mimeType === "application/pdf") {
      raw = await extractPdfText(file);
    } else if (
      DOCX_EXTENSIONS.has(ext) ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      raw = await extractDocxText(file);
    } else {
      raw = await extractPlainText(file);
    }
  } catch (error) {
    if (error instanceof DocExtractError) throw error;
    const message = error instanceof Error ? error.message : "Failed to read file.";
    throw new DocExtractError(message);
  }

  if (!raw) {
    throw new DocExtractError("No extractable text found in this file.");
  }

  const { text, truncated } = truncateText(raw);
  return {
    name,
    mimeType,
    charCount: text.length,
    truncated,
    text,
  };
}

export function formatAttachmentForPrompt(name: string, text: string): string {
  return `[Attached: ${name}]\n<<<\n${text}\n>>>`;
}
