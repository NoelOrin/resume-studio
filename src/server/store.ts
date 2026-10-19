import { promises as fs } from "node:fs";
import path from "node:path";
import { migrateDocument } from "../lib/migrate";
import type { DocRecord, ResumeData, StoredDoc } from "../types";

const ROOT = process.env.RESUME_DATA_DIR ?? path.join(process.cwd(), ".data");
const DOC_DIR = path.join(ROOT, "docs");
const PUB_DIR = path.join(ROOT, "published");
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(DOC_DIR, { recursive: true });
  await fs.mkdir(PUB_DIR, { recursive: true });
}

export async function listDocs(): Promise<DocRecord[]> {
  await ensureDirs();
  const files = (await fs.readdir(DOC_DIR)).filter((f) => f.endsWith(".json"));
  const docs: DocRecord[] = [];
  for (const file of files) {
    try {
      const record = JSON.parse(await fs.readFile(path.join(DOC_DIR, file), "utf8")) as StoredDoc;
      docs.push({
        id: record.id,
        title: record.title ?? "未命名简历",
        updatedAt: record.updatedAt ?? null,
        templateId: record.templateId ?? record.data?.templateId,
      });
    } catch {
      /* ignore broken document */
    }
  }
  docs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return docs;
}

export async function readDoc(id: string): Promise<StoredDoc | null> {
  if (!isValidId(id)) return null;
  try {
    const record = JSON.parse(await fs.readFile(path.join(DOC_DIR, `${id}.json`), "utf8")) as StoredDoc;
    const data = migrateDocument(record.data);
    if (!data) return null;
    return { ...record, data };
  } catch {
    return null;
  }
}

export async function writeDoc(id: string, title: string, data: ResumeData): Promise<StoredDoc> {
  if (!isValidId(id)) throw new Error("invalid id");
  const normalized = migrateDocument(data);
  if (!normalized) throw new Error("invalid document");
  await ensureDirs();
  const record: StoredDoc = {
    id,
    title: String(title || "未命名简历").slice(0, 120),
    updatedAt: new Date().toISOString(),
    templateId: normalized.templateId,
    data: normalized,
  };
  await fs.writeFile(path.join(DOC_DIR, `${id}.json`), JSON.stringify(record, null, 2), "utf8");
  return record;
}

export async function deleteDoc(id: string): Promise<void> {
  if (!isValidId(id)) return;
  await fs.rm(path.join(DOC_DIR, `${id}.json`), { force: true });
}

export async function writePublished(id: string, html: string): Promise<string> {
  if (!isValidId(id)) throw new Error("invalid id");
  await ensureDirs();
  await fs.writeFile(path.join(PUB_DIR, `${id}.html`), html, "utf8");
  return `/p/${id}`;
}

export async function readPublished(id: string): Promise<string | null> {
  if (!isValidId(id)) return null;
  try {
    return await fs.readFile(path.join(PUB_DIR, `${id}.html`), "utf8");
  } catch {
    return null;
  }
}

export async function publishedIds(): Promise<string[]> {
  await ensureDirs();
  return (await fs.readdir(PUB_DIR)).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""));
}
