export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DOC_CHARS = 100_000;
const MAX_OCR_PAGES = 15;
const OCR_MIN_TEXT_CHARS = 20;

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

type PdfJsModule = typeof import("pdfjs-dist");
type PdfDocument = Awaited<ReturnType<PdfJsModule["getDocument"]>["promise"]>;
type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

let pdfWorkerReady: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfWorkerReady) {
    pdfWorkerReady = (async () => {
      const pdfjs = await import("pdfjs-dist");
      // Vite emits a hashed .mjs worker URL. Some hosts serve .mjs as
      // application/octet-stream; wrap as a JS blob URL for module workers.
      const workerMod = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      const workerRes = await fetch(workerMod.default);
      if (!workerRes.ok) {
        throw new DocExtractError("Failed to load PDF worker.");
      }
      const typedWorker = new Blob([await workerRes.blob()], { type: "text/javascript" });
      pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(typedWorker);
      return pdfjs;
    })().catch((error) => {
      pdfWorkerReady = null;
      throw error;
    });
  }
  return pdfWorkerReady;
}

function textFromContentItems(items: PdfPage extends never ? never : Awaited<ReturnType<PdfPage["getTextContent"]>>["items"]): string {
  let out = "";
  for (const item of items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    out += item.str;
    if ("hasEOL" in item && item.hasEOL) out += "\n";
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractEmbeddedPdfText(doc: PdfDocument): Promise<string> {
  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent({
      includeMarkedContent: false,
      disableNormalization: false,
    });
    const pageText = textFromContentItems(content.items);
    if (pageText) {
      parts.push(`--- Page ${pageNum} ---\n${pageText}`);
    }
    if (parts.join("\n\n").length >= MAX_DOC_CHARS) break;
  }
  return parts.join("\n\n").trim();
}

async function ocrPdfPages(doc: PdfDocument): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+ind");
  const parts: string[] = [];

  try {
    const pageLimit = Math.min(doc.numPages, MAX_OCR_PAGES);
    for (let pageNum = 1; pageNum <= pageLimit; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      } as Parameters<PdfPage["render"]>[0]);
      await renderTask.promise;

      const result = await worker.recognize(canvas);
      const pageText = (result.data.text ?? "").trim();
      canvas.width = 0;
      canvas.height = 0;

      if (pageText) {
        parts.push(`--- Page ${pageNum} (OCR) ---\n${pageText}`);
      }
      if (parts.join("\n\n").length >= MAX_DOC_CHARS) break;
    }
  } finally {
    await worker.terminate();
  }

  return parts.join("\n\n").trim();
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  try {
    const embedded = await extractEmbeddedPdfText(doc);
    if (embedded.replace(/\s+/g, "").length >= OCR_MIN_TEXT_CHARS) {
      return embedded;
    }

    // Scanned / image-only PDFs have little or no text layer — OCR pages.
    const ocrText = await ocrPdfPages(doc);
    if (ocrText) return ocrText;

    if (embedded) return embedded;

    throw new DocExtractError(
      "No extractable text found. This PDF may be empty or image-only; try a text PDF, DOCX, or TXT."
    );
  } finally {
    await doc.cleanup();
    await loadingTask.destroy().catch(() => undefined);
  }
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
