/**
 * Archive library: every exported artifact (JSON / HTML / PDF / PNG) lands here
 * right after it is produced, so the user can re-download or clean up from the
 * editor's archive panel.
 *
 * Storage layout mirrors `.data/docs` / `.data/published`: plain files under
 * `RESUME_DATA_DIR/archive/`, plus an `index.json` holding the records. Single
 * user, single process — a read-modify-write of the index is enough.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileBase } from "../lib/backend";
import { isValidId } from "./store";

const ROOT = process.env.RESUME_DATA_DIR ?? path.join(process.cwd(), ".data");
const ARCHIVE_DIR = path.join(ROOT, "archive");
const INDEX_PATH = path.join(ARCHIVE_DIR, "index.json");

export const ARCHIVE_FORMATS = ["json", "html", "pdf", "png"] as const;
export type ArchiveFormat = (typeof ARCHIVE_FORMATS)[number];

const EXT: Record<ArchiveFormat, string> = { json: "json", html: "html", pdf: "pdf", png: "png" };

/** Archives are rendered resumes — 20 MB is far beyond any real one. */
export const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;

export type ArchiveRecord = {
  id: string;
  title: string;
  format: ArchiveFormat;
  /** Display / download name (sanitised, canonical extension). */
  filename: string;
  bytes: number;
  createdAt: string;
  templateId?: string;
  pages?: number;
  docId?: string;
};

export type StoredArchive = { record: ArchiveRecord; content: Buffer };

async function ensureDir(): Promise<void> {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
}

async function readIndex(): Promise<ArchiveRecord[]> {
  try {
    const raw = JSON.parse(await fs.readFile(INDEX_PATH, "utf8")) as ArchiveRecord[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

async function writeIndex(records: ArchiveRecord[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(INDEX_PATH, JSON.stringify(records, null, 2), "utf8");
}

function isArchiveFormat(value: unknown): value is ArchiveFormat {
  return typeof value === "string" && (ARCHIVE_FORMATS as readonly string[]).includes(value);
}

function toBuffer(content: Buffer | string): Buffer {
  return typeof content === "string" ? Buffer.from(content, "utf8") : content;
}

/**
 * `filename` is the user-facing download name; whatever extension the caller
 * passed is replaced by the format's canonical one. The file on disk is always
 * `<id>.<ext>`, so a hostile name can never escape the archive directory.
 */
function displayFilename(filename: string, format: ArchiveFormat): string {
  const base = fileBase(filename.replace(/\.[A-Za-z0-9]+$/, ""));
  return `${base}.${EXT[format]}`;
}

async function freshId(records: ArchiveRecord[]): Promise<string> {
  for (;;) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    if (isValidId(id) && !records.some((record) => record.id === id)) return id;
  }
}

/** List archive records, newest first. */
export async function listArchives(): Promise<ArchiveRecord[]> {
  const records = await readIndex();
  return [...records].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function writeArchive(
  format: ArchiveFormat,
  filename: string,
  content: Buffer | string,
  meta: { title?: string; templateId?: string; pages?: number; docId?: string } = {},
): Promise<ArchiveRecord> {
  if (!isArchiveFormat(format)) {
    throw new Error(`unsupported archive format "${String(format)}" (expected ${ARCHIVE_FORMATS.join("/")})`);
  }
  const bytes = toBuffer(content);
  if (bytes.byteLength > MAX_ARCHIVE_BYTES) {
    throw new Error(`archive content is too large (${bytes.byteLength} bytes, cap ${MAX_ARCHIVE_BYTES})`);
  }

  const records = await readIndex();
  const id = await freshId(records);
  const record: ArchiveRecord = {
    id,
    title: String(meta.title ?? "未命名简历").slice(0, 120),
    format,
    filename: displayFilename(String(filename ?? "resume"), format),
    bytes: bytes.byteLength,
    createdAt: new Date().toISOString(),
    ...(meta.templateId ? { templateId: meta.templateId } : {}),
    ...(typeof meta.pages === "number" ? { pages: meta.pages } : {}),
    ...(meta.docId ? { docId: meta.docId } : {}),
  };

  await ensureDir();
  await fs.writeFile(path.join(ARCHIVE_DIR, `${id}.${EXT[format]}`), bytes);
  await writeIndex([record, ...records]);
  return record;
}

export async function readArchive(id: string): Promise<StoredArchive | null> {
  if (!isValidId(id)) return null;
  const record = (await readIndex()).find((entry) => entry.id === id);
  if (!record) return null;
  try {
    const content = await fs.readFile(path.join(ARCHIVE_DIR, `${id}.${EXT[record.format]}`));
    return { record, content };
  } catch {
    return null;
  }
}

export async function deleteArchive(id: string): Promise<boolean> {
  if (!isValidId(id)) return false;
  const records = await readIndex();
  const record = records.find((entry) => entry.id === id);
  if (!record) return false;
  await fs.rm(path.join(ARCHIVE_DIR, `${id}.${EXT[record.format]}`), { force: true });
  await writeIndex(records.filter((entry) => entry.id !== id));
  return true;
}

export async function clearArchives(): Promise<number> {
  const records = await readIndex();
  await fs.rm(ARCHIVE_DIR, { recursive: true, force: true });
  await writeIndex([]);
  return records.length;
}
