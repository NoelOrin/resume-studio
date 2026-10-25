/**
 * Document & published-page storage on the embedded libSQL database.
 *
 * Same exported surface as the old JSON-file store, so REST (`/api/docs`,
 * `/api/publish`), MCP tools and the `/?doc=` RSC page are unchanged. The
 * first touch imports any pre-SQLite files from `<data>/docs` / `<data>/published`
 * once (INSERT OR IGNORE, source files kept as an implicit backup).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { db, getKv, setKv } from "./db";
import { migrateDocument } from "../lib/migrate";
import type { DocRecord, ResumeData, StoredDoc } from "../types";

const ROOT = process.env.RESUME_DATA_DIR ?? path.join(process.cwd(), ".data");
const LEGACY_DOC_DIR = path.join(ROOT, "docs");
const LEGACY_PUB_DIR = path.join(ROOT, "published");
const LEGACY_FLAG = "migrated:json-store";
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

let legacyRun: Promise<void> | null = null;

async function importLegacyFiles(): Promise<void> {
  if (await getKv(LEGACY_FLAG)) return;
  const client = await db();

  const docFiles = await fs.readdir(LEGACY_DOC_DIR).catch(() => [] as string[]);
  for (const file of docFiles.filter((f) => f.endsWith(".json"))) {
    try {
      const id = file.replace(/\.json$/, "");
      if (!isValidId(id)) continue;
      const record = JSON.parse(await fs.readFile(path.join(LEGACY_DOC_DIR, file), "utf8")) as StoredDoc;
      const data = migrateDocument(record.data);
      if (!data) continue;
      await client.execute({
        sql: `INSERT INTO docs (id, title, template_id, updated_at, data)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT (id) DO NOTHING`,
        args: [
          id,
          String(record.title ?? "未命名简历").slice(0, 120),
          data.templateId,
          record.updatedAt ?? new Date().toISOString(),
          JSON.stringify(data),
        ],
      });
    } catch {
      /* skip unreadable legacy document */
    }
  }

  const pubFiles = await fs.readdir(LEGACY_PUB_DIR).catch(() => [] as string[]);
  for (const file of pubFiles.filter((f) => f.endsWith(".html"))) {
    try {
      const id = file.replace(/\.html$/, "");
      if (!isValidId(id)) continue;
      const html = await fs.readFile(path.join(LEGACY_PUB_DIR, file), "utf8");
      await client.execute({
        sql: `INSERT INTO published (id, html, updated_at) VALUES (?, ?, ?)
              ON CONFLICT (id) DO NOTHING`,
        args: [id, html, new Date().toISOString()],
      });
    } catch {
      /* skip unreadable legacy page */
    }
  }

  await setKv(LEGACY_FLAG, new Date().toISOString());
}

/** Memoised so every entry point shares one legacy import run. */
function ensureLegacy(): Promise<void> {
  legacyRun ??= importLegacyFiles().catch((error: unknown) => {
    legacyRun = null; // transient failure (dir appeared later etc.) — retry next call
    throw error;
  });
  return legacyRun;
}

export async function listDocs(): Promise<DocRecord[]> {
  await ensureLegacy();
  const rs = await (await db()).execute(
    "SELECT id, title, template_id, updated_at FROM docs ORDER BY updated_at DESC",
  );
  return rs.rows.map((row) => ({
    id: String(row.id),
    title: row.title ? String(row.title) : "未命名简历",
    updatedAt: row.updated_at ? String(row.updated_at) : null,
    ...(row.template_id ? { templateId: String(row.template_id) } : {}),
  }));
}

export async function readDoc(id: string): Promise<StoredDoc | null> {
  if (!isValidId(id)) return null;
  await ensureLegacy();
  const rs = await (await db()).execute({
    sql: "SELECT title, template_id, updated_at, data FROM docs WHERE id = ?",
    args: [id],
  });
  const row = rs.rows[0];
  if (!row) return null;
  try {
    const data = migrateDocument(JSON.parse(String(row.data)));
    if (!data) return null;
    return {
      id,
      title: row.title ? String(row.title) : "未命名简历",
      updatedAt: String(row.updated_at),
      ...(row.template_id ? { templateId: String(row.template_id) } : {}),
      data,
    };
  } catch {
    return null;
  }
}

export async function writeDoc(id: string, title: string, data: ResumeData): Promise<StoredDoc> {
  if (!isValidId(id)) throw new Error("invalid id");
  const normalized = migrateDocument(data);
  if (!normalized) throw new Error("invalid document");
  await ensureLegacy();
  const record: StoredDoc = {
    id,
    title: String(title || "未命名简历").slice(0, 120),
    updatedAt: new Date().toISOString(),
    templateId: normalized.templateId,
    data: normalized,
  };
  await (await db()).execute({
    sql: `INSERT INTO docs (id, title, template_id, updated_at, data)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            title = excluded.title,
            template_id = excluded.template_id,
            updated_at = excluded.updated_at,
            data = excluded.data`,
    args: [record.id, record.title, record.templateId ?? null, record.updatedAt, JSON.stringify(record.data)],
  });
  return record;
}

export async function deleteDoc(id: string): Promise<void> {
  if (!isValidId(id)) return;
  await (await db()).execute({ sql: "DELETE FROM docs WHERE id = ?", args: [id] });
}

export async function writePublished(id: string, html: string): Promise<string> {
  if (!isValidId(id)) throw new Error("invalid id");
  await (await db()).execute({
    sql: `INSERT INTO published (id, html, updated_at) VALUES (?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET html = excluded.html, updated_at = excluded.updated_at`,
    args: [id, html, new Date().toISOString()],
  });
  return `/p/${id}`;
}

export async function readPublished(id: string): Promise<string | null> {
  if (!isValidId(id)) return null;
  await ensureLegacy();
  const rs = await (await db()).execute({ sql: "SELECT html FROM published WHERE id = ?", args: [id] });
  const row = rs.rows[0];
  return row ? String(row.html) : null;
}

export async function publishedIds(): Promise<string[]> {
  await ensureLegacy();
  const rs = await (await db()).execute("SELECT id FROM published");
  return rs.rows.map((row) => String(row.id));
}
