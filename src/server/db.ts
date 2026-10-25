/**
 * Embedded local database: Turso's libSQL client in pure-local `file:` mode.
 *
 * One SQLite file under RESUME_DATA_DIR holds everything the editor persists
 * (documents, published pages, workspace, UI prefs). No account, no network —
 * the engine ships inside the app bundle via runtime/node_modules, the data
 * file lives in the writable data dir so it survives app updates.
 *
 * The client is created lazily so importing this module never touches the
 * filesystem (vinext build imports route modules; tests set RESUME_DATA_DIR
 * before their first src import, matching the old store).
 */
import { createClient, type Client } from "@libsql/client";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.env.RESUME_DATA_DIR ?? path.join(process.cwd(), ".data");
const DB_PATH = path.join(ROOT, "resume-studio.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS docs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  template_id TEXT,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS published (
  id TEXT PRIMARY KEY,
  html TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

let opening: Promise<Client> | null = null;

async function open(): Promise<Client> {
  await mkdir(ROOT, { recursive: true });
  const client = createClient({ url: `file:${DB_PATH}` });
  // WAL keeps readers/writers from blocking each other; harmless for a
  // single-process app and safer across hard quits.
  await client.execute("PRAGMA journal_mode=WAL");
  await client.executeMultiple(SCHEMA);
  return client;
}

/** Singleton client; the promise is cached so concurrent callers share it. */
export function db(): Promise<Client> {
  opening ??= open().catch((error: unknown) => {
    opening = null; // let a later call retry (e.g. data dir became writable)
    throw error;
  });
  return opening;
}

export async function getKv(key: string): Promise<string | null> {
  const rs = await (await db()).execute({ sql: "SELECT value FROM kv WHERE key = ?", args: [key] });
  const row = rs.rows[0];
  return row ? String(row.value) : null;
}

export async function setKv(key: string, value: string): Promise<void> {
  await (await db()).execute({
    sql: "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
    args: [key, value],
  });
}

export async function delKv(key: string): Promise<void> {
  await (await db()).execute({ sql: "DELETE FROM kv WHERE key = ?", args: [key] });
}

/** Close the singleton (tests). The next `db()` call opens a fresh client. */
export async function closeDb(): Promise<void> {
  const pending = opening;
  opening = null;
  if (!pending) return;
  // A failed open already reported to its caller; there is nothing to close.
  const client = await pending.catch(() => null);
  client?.close();
}

/** Absolute path of the database file (diagnostics / smoke tests). */
export function dbPath(): string {
  return DB_PATH;
}
