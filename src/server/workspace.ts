/**
 * Editor workspace & UI prefs, stored as kv rows in the embedded database.
 *
 * The workspace is the single "what was on screen" record — title + document
 * + active doc id bound together (the trio the old localStorage keys and the
 * crash-recovery draft tried to keep in sync). Prefs are the small per-install
 * UI bits (zoom, update pill, daily update-check marker).
 */
import { getKv, setKv, delKv } from "./db";
import { migrateDocument } from "../lib/migrate";
import type { ResumeData } from "../types";

const WORKSPACE_KEY = "workspace";
const ZOOM_KEY = "ui:zoom";
const PILL_KEY = "update:pill";
const CHECKED_AT_KEY = "update:checked-at";

export type Workspace = {
  title: string;
  data: ResumeData;
  docId: string | null;
  savedAt: number;
};

export async function readWorkspace(): Promise<Workspace | null> {
  const raw = await getKv(WORKSPACE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { title?: unknown; data?: unknown; docId?: unknown; savedAt?: unknown };
    const data = migrateDocument(parsed.data);
    if (!data) return null;
    if (typeof parsed.title !== "string" || typeof parsed.savedAt !== "number") return null;
    return {
      title: parsed.title,
      data,
      docId: typeof parsed.docId === "string" ? parsed.docId : null,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export async function saveWorkspace(input: {
  title: string;
  data: ResumeData;
  docId: string | null;
}): Promise<Workspace> {
  const data = migrateDocument(input.data);
  if (!data) throw new Error("invalid document");
  const workspace: Workspace = {
    title: String(input.title || "未命名简历").slice(0, 120),
    data,
    docId: typeof input.docId === "string" && input.docId ? input.docId : null,
    savedAt: Date.now(),
  };
  await setKv(WORKSPACE_KEY, JSON.stringify(workspace));
  return workspace;
}

export type ZoomPref = { mode: "manual"; value: number } | { mode: "fit" };

export type Prefs = {
  zoom?: ZoomPref;
  pill?: string | null;
  checkedAt?: string | null;
};

function parseZoom(value: unknown): ZoomPref | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const raw = value as { mode?: unknown; value?: unknown };
  if (raw.mode === "fit") return { mode: "fit" };
  if (raw.mode === "manual" && typeof raw.value === "number" && Number.isFinite(raw.value)) {
    return { mode: "manual", value: raw.value };
  }
  return undefined;
}

export async function readPrefs(): Promise<Prefs> {
  const [zoomRaw, pillRaw, checkedAtRaw] = await Promise.all([getKv(ZOOM_KEY), getKv(PILL_KEY), getKv(CHECKED_AT_KEY)]);
  const prefs: Prefs = {};
  if (zoomRaw) {
    try {
      const zoom = parseZoom(JSON.parse(zoomRaw));
      if (zoom) prefs.zoom = zoom;
    } catch {
      /* corrupt zoom pref: fall back to default */
    }
  }
  if (pillRaw) prefs.pill = pillRaw;
  if (checkedAtRaw) prefs.checkedAt = checkedAtRaw;
  return prefs;
}

/** Partial update: fields present in `patch` overwrite, absent ones stay. */
export async function savePrefs(patch: Prefs): Promise<void> {
  if (patch.zoom !== undefined) {
    if (!parseZoom(patch.zoom)) throw new Error("invalid zoom pref");
    await setKv(ZOOM_KEY, JSON.stringify(patch.zoom));
  }
  if (patch.pill !== undefined) {
    if (patch.pill === null) await delKv(PILL_KEY);
    else await setKv(PILL_KEY, String(patch.pill).slice(0, 40));
  }
  if (patch.checkedAt !== undefined) {
    if (patch.checkedAt === null) await delKv(CHECKED_AT_KEY);
    else await setKv(CHECKED_AT_KEY, String(patch.checkedAt).slice(0, 10));
  }
}
