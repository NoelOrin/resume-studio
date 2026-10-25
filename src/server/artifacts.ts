/**
 * Server-side artifact rendering: turns a document into a real PDF or a
 * full-height PNG by driving a headless chromium-family browser, the same way
 * `scripts/template-preview.tsx` does. No npm dependency — the browser binary
 * is probed (EDGE_BIN → Edge → Chrome → Chromium → PATH) and the render fails
 * with `NO_BROWSER` when none is installed.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileBase } from "../lib/backend";
import { renderResumeHtml } from "../mcp/render";
import { pageCountOf } from "../templates/types";
import type { ResumeData } from "../types";

const execFileAsync = promisify(execFile);

/** A4 at 96 dpi, as laid out by `.tpl-page` in `src/styles/pages.ts`. */
const A4_PX = { width: 794, height: 1123 };

/** Multi-page PNGs grow fast at 2× scale; refuse absurd documents. */
export const MAX_PNG_PAGES = 20;

const DEFAULT_TIMEOUT_MS = 30_000;

export class NoBrowserError extends Error {
  readonly code = "NO_BROWSER";

  constructor() {
    super("未找到可用的 Edge / Chrome / Chromium，无法服务端导出 PDF / PNG。");
    this.name = "NoBrowserError";
  }
}

const MAC_APPS = [
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

const PATH_NAMES = ["microsoft-edge", "google-chrome", "chromium"];

/** Ordered candidate list: `EDGE_BIN` wins, then bundled apps, then PATH. */
export function defaultBrowserCandidates(): string[] {
  const candidates: string[] = [];
  const envBin = process.env.EDGE_BIN?.trim();
  if (envBin) candidates.push(envBin);
  candidates.push(...MAC_APPS);
  const pathDirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const name of PATH_NAMES) {
    for (const dir of pathDirs) {
      candidates.push(path.join(dir, name));
    }
  }
  return candidates;
}

export function probeBrowserBin(candidates: string[] = defaultBrowserCandidates()): string | null {
  return candidates.find((bin) => existsSync(bin)) ?? null;
}

export function pdfArgs(htmlUrl: string, outPath: string): string[] {
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    `--print-to-pdf=${outPath}`,
    htmlUrl,
  ];
}

/** Viewport tall enough for every page plus a 2px white buffer. */
export function pngWindowHeight(pages: number): number {
  return pages * A4_PX.height + 2;
}

export function pngArgs(htmlUrl: string, outPath: string, pages: number): string[] {
  if (pages > MAX_PNG_PAGES) {
    throw new Error(`PNG 导出最多支持 ${MAX_PNG_PAGES} 页，当前 ${pages} 页。`);
  }
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--window-size=${A4_PX.width},${pngWindowHeight(pages)}`,
    `--screenshot=${outPath}`,
    htmlUrl,
  ];
}

/**
 * The export shell centers pages with gaps and a grey background (`EXPORT_PAGE_CSS`).
 * A long PNG wants the pages stacked flush on white, so the override reuses the
 * print layout in a screen context.
 */
const PNG_FLAT_CSS = `/* artifact-png-css */
html,body{background:#fff}
body{margin:0;padding:0;display:block}
.tpl-export{display:block;gap:0}
.tpl-page{box-shadow:none;margin:0}
`;

export type Artifact = {
  bytes: Buffer;
  filename: string;
  pages: number;
  templateId: string;
  templateName: string;
};

export async function buildArtifact(
  format: "pdf" | "png",
  data: ResumeData,
  title: string,
  options: { browserBin?: string; candidates?: string[]; timeoutMs?: number } = {},
): Promise<Artifact> {
  const bin = options.browserBin ?? probeBrowserBin(options.candidates ?? defaultBrowserCandidates());
  if (!bin) throw new NoBrowserError();

  const rendered = renderResumeHtml(data, title);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const dir = await mkdtemp(path.join(tmpdir(), "resume-artifact-"));
  try {
    let html = rendered.html;
    if (format === "png") {
      html = html.replace("</head>", `<style>${PNG_FLAT_CSS}</style></head>`);
    }
    const htmlPath = path.join(dir, "doc.html");
    await writeFile(htmlPath, html, "utf8");

    const outPath = path.join(dir, `out.${format}`);
    const args =
      format === "pdf"
        ? pdfArgs(`file://${htmlPath}`, outPath)
        : pngArgs(`file://${htmlPath}`, outPath, rendered.pages);

    try {
      await execFileAsync(bin, args, { timeout: timeoutMs, killSignal: "SIGKILL", maxBuffer: 16 * 1024 * 1024 });
    } catch (err) {
      if ((err as { killed?: boolean }).killed) {
        throw new Error(`浏览器渲染超时（${timeoutMs}ms），已终止。`);
      }
      throw err;
    }

    let bytes: Buffer;
    try {
      bytes = await readFile(outPath);
    } catch {
      throw new Error(`浏览器没有产出 ${format.toUpperCase()} 文件（命令已退出但产物缺失）。`);
    }

    return {
      bytes,
      filename: `${fileBase(title)}.${format}`,
      pages: rendered.pages,
      templateId: rendered.templateId,
      templateName: rendered.templateName,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// Re-exported so route handlers can report page counts without another import.
export { pageCountOf };
