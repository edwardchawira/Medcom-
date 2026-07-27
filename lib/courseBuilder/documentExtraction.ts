import { PDFParse } from "pdf-parse";
import JSZip from "jszip";
import mammoth from "mammoth";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const MAX_FILES = 6;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 60 * 1024 * 1024;
const MAX_TEXT_CHARS = 60_000;
const MIN_TEXT_PER_FILE = 8_000;

export type ExtractedSourceFile = {
  name: string;
  type: string;
  size: number;
  format: string;
  chars: number;
  warning?: string;
};

export type ExtractedCourseSource = {
  titleHint: string;
  combinedText: string;
  files: ExtractedSourceFile[];
  truncated: boolean;
};

type ExtractedFileText = {
  format: string;
  text: string;
  warning?: string;
};

export async function extractCourseSourceFromFiles(files: File[]): Promise<ExtractedCourseSource> {
  if (files.length === 0) {
    throw new Error("Upload at least one source file.");
  }
  if (files.length > MAX_FILES) {
    throw new Error(`Upload up to ${MAX_FILES} files at once.`);
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error("Uploaded source files are too large. Use 60 MB or less in total.");
  }

  let truncated = false;
  const extractedFiles: ExtractedSourceFile[] = [];
  const extractedTexts: { name: string; text: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`${file.name} is too large. Use files up to 25 MB.`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractTextFromBuffer(file.name, file.type, buffer);
    const text = normalizeText(extracted.text);

    if (!text) {
      extractedFiles.push({
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        format: extracted.format,
        chars: 0,
        warning: extracted.warning ?? "No readable text found.",
      });
      continue;
    }

    extractedFiles.push({
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      format: extracted.format,
      chars: text.length,
      warning: extracted.warning,
    });
    extractedTexts.push({ name: file.name, text });
  }

  const packed = packExtractedTexts(extractedTexts);
  const combinedText = packed.text;
  truncated = truncated || packed.truncated;

  if (!combinedText.trim()) {
    throw new Error("I could not find readable text in those files.");
  }

  return {
    titleHint: inferTitleHint(files),
    combinedText,
    files: extractedFiles,
    truncated,
  };
}

function packExtractedTexts(files: { name: string; text: string }[]) {
  const readable = files.filter((file) => file.text.trim());
  if (readable.length === 0) return { text: "", truncated: false };

  const separatorBudget = Math.max(0, readable.length - 1) * 10;
  const headerBudget = readable.reduce((sum, file) => sum + `Source file: ${file.name}\n\n`.length, 0);
  const contentBudget = Math.max(0, MAX_TEXT_CHARS - separatorBudget - headerBudget);
  const minBudget = Math.min(MIN_TEXT_PER_FILE, Math.floor(contentBudget / readable.length));
  const budgets = readable.map((file) => Math.min(file.text.length, minBudget));

  let remainingBudget = contentBudget - budgets.reduce((sum, value) => sum + value, 0);
  let remainingNeed = readable.reduce(
    (sum, file, index) => sum + Math.max(0, file.text.length - budgets[index]),
    0
  );

  while (remainingBudget > 0 && remainingNeed > 0) {
    let changed = false;
    for (let index = 0; index < readable.length && remainingBudget > 0; index++) {
      const need = readable[index].text.length - budgets[index];
      if (need <= 0) continue;
      const share = Math.max(1, Math.floor((need / remainingNeed) * remainingBudget));
      const add = Math.min(need, share, remainingBudget);
      budgets[index] += add;
      remainingBudget -= add;
      remainingNeed -= add;
      changed = true;
    }
    if (!changed) break;
  }

  const sections = readable.map((file, index) => {
    const slice = file.text.slice(0, budgets[index]);
    return `Source file: ${file.name}\n\n${slice}`;
  });

  return {
    text: sections.join("\n\n---\n\n"),
    truncated: readable.some((file, index) => budgets[index] < file.text.length),
  };
}

async function extractTextFromBuffer(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<ExtractedFileText> {
  const ext = extensionFor(fileName);

  if (mimeType === "application/pdf" || ext === "pdf") {
    return { format: "PDF", text: await extractPdfText(buffer) };
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    ext === "pptx"
  ) {
    return { format: "PPTX", text: await extractPptxText(buffer) };
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      format: "DOCX",
      text: result.value,
      warning: result.messages?.length ? "Some Word document elements could not be converted." : undefined,
    };
  }

  if (isTextLike(mimeType, ext)) {
    const raw = buffer.toString("utf8");
    if (ext === "html" || ext === "htm" || mimeType === "text/html") {
      return { format: "HTML", text: htmlToText(raw) };
    }
    if (ext === "rtf" || mimeType === "application/rtf") {
      return { format: "RTF", text: rtfToText(raw) };
    }
    return { format: textFormatLabel(ext), text: raw };
  }

  throw new Error(`${fileName} is not a supported source format.`);
}

async function extractPdfText(buffer: Buffer) {
  configurePdfWorker();
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function configurePdfWorker() {
  const require = createRequire(import.meta.url);
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerPath).href);
}

async function extractPptxText(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort(naturalSort);

  const slides: string[] = [];
  for (const slideName of slideNames) {
    const xml = await zip.files[slideName].async("string");
    const text = xmlTextNodes(xml).join("\n").trim();
    if (text) {
      const slideNo = slideName.match(/slide(\d+)\.xml$/)?.[1] ?? "";
      slides.push(`Slide ${slideNo}\n${text}`);
    }
  }

  return slides.join("\n\n");
}

function xmlTextNodes(xml: string) {
  const nodes = xml.match(/<a:t(?:\s[^>]*)?>[\s\S]*?<\/a:t>/g) ?? [];
  return nodes
    .map((node) => node.replace(/^<a:t(?:\s[^>]*)?>/, "").replace(/<\/a:t>$/, ""))
    .map(decodeXmlEntities)
    .map((text) => text.trim())
    .filter(Boolean);
}

function htmlToText(input: string) {
  return decodeXmlEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function rtfToText(input: string) {
  return input
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/\\[a-z]+\d* ?/gi, " ")
    .replace(/[{}]/g, " ");
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeText(input: string) {
  return input
    .split(String.fromCharCode(0))
    .join(" ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extensionFor(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isTextLike(mimeType: string, ext: string) {
  return (
    mimeType.startsWith("text/") ||
    ["txt", "md", "markdown", "csv", "tsv", "html", "htm", "json", "rtf"].includes(ext)
  );
}

function textFormatLabel(ext: string) {
  if (ext === "md" || ext === "markdown") return "Markdown";
  if (ext === "csv") return "CSV";
  if (ext === "tsv") return "TSV";
  if (ext === "json") return "JSON";
  return "Text";
}

function inferTitleHint(files: File[]) {
  if (files.length !== 1) return "Uploaded source course";
  return files[0].name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Uploaded source course";
}

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
