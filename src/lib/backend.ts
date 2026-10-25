import type { DocRecord, ResumeData } from '../types'
import type { McpClientDoc, McpPromptDoc, McpResourceDoc, McpToolDoc } from '../mcp/catalog'
import type { UpdateCheck } from './update'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`)
  }
  return (await res.json()) as T
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Latest release for this host, normalised by the server.
 * `/api/update` always answers 200 with an `UpdateCheck`, so a throw here means
 * the request itself never landed (offline / dev server down).
 */
export async function fetchUpdateCheck(signal?: AbortSignal): Promise<UpdateCheck> {
  return request<UpdateCheck>('/api/update', { signal })
}

/** What `GET /api/mcp/info` returns: the MCP catalog plus this host's endpoint. */
export type McpInfo = {
  endpoint: string
  path: string
  transport: string
  authRequired: boolean
  serverName: string
  version: string
  instructions: string
  workflow: string[]
  tools: McpToolDoc[]
  resources: McpResourceDoc[]
  prompts: McpPromptDoc[]
  clients: McpClientDoc[]
  examples: string[]
  /** Optional summary counts; the dialog derives its own from the arrays. */
  counts?: { tools: number; resources: number; prompts: number }
  checkedAt: string
}

/**
 * Catalog of everything this app exposes over MCP, for the settings dialog.
 * The endpoint is resolved server-side because the desktop shell listens on a
 * random loopback port; always HTTP 200 with JSON.
 */
export async function fetchMcpInfo(signal?: AbortSignal): Promise<McpInfo> {
  return request<McpInfo>('/api/mcp/info', { signal })
}

export async function listDocs(): Promise<DocRecord[]> {
  const { docs } = await request<{ docs: DocRecord[] }>('/api/docs')
  return docs
}

export async function getDoc(id: string): Promise<{ id: string; title: string; data: ResumeData }> {
  return request(`/api/docs/${encodeURIComponent(id)}`)
}

export async function putDoc(id: string, title: string, data: ResumeData) {
  return request<{ ok: true; updatedAt: string }>(`/api/docs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ title, data }),
  })
}

export async function deleteDoc(id: string) {
  return request<{ ok: true }>(`/api/docs/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function publishHtml(id: string, title: string, html: string) {
  return request<{ ok: true; path: string }>('/api/publish', {
    method: 'POST',
    body: JSON.stringify({ id, title, html }),
  })
}

/* ---------------- export & archive ---------------- */

export type ArchiveFormat = 'json' | 'html' | 'pdf' | 'png'

export type ArchiveRecord = {
  id: string
  title: string
  format: ArchiveFormat
  filename: string
  bytes: number
  createdAt: string
  templateId?: string
  pages?: number
  docId?: string
}

export class NoBrowserExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NoBrowserExportError'
  }
}

/** `filename*=UTF-8''…` wins over the ASCII `filename="…"` fallback. */
export function filenameFromDisposition(header: string): string | null {
  const starred = /filename\*=(?:UTF-8|utf-8)''([^;]+)/.exec(header)?.[1]
  if (starred) {
    try {
      return decodeURIComponent(starred)
    } catch {
      /* fall through to the ASCII name */
    }
  }
  return /filename="([^"]*)"/.exec(header)?.[1] ?? null
}

/** utf-8 safe base64 for small client-side payloads (JSON / HTML files). */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function exportArtifact(
  format: 'pdf' | 'png',
  input: { data: ResumeData; title: string; docId?: string | null },
): Promise<{ blob: Blob; filename: string; pages: number }> {
  const res = await fetch(`/api/export/${format}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: input.data, title: input.title, ...(input.docId ? { docId: input.docId } : {}) }),
  })
  if (res.status === 503) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new NoBrowserExportError(body.error ?? '未找到可用的浏览器，无法导出。')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`)
  }
  return {
    blob: await res.blob(),
    filename: filenameFromDisposition(res.headers.get('content-disposition') ?? '') ?? `resume.${format}`,
    pages: Number(res.headers.get('x-pages') ?? '0') || 0,
  }
}

export async function listArchiveLibrary(): Promise<{ archives: ArchiveRecord[] }> {
  return request<{ archives: ArchiveRecord[] }>('/api/archive')
}

export async function archiveClientArtifact(input: {
  format: ArchiveFormat
  filename: string
  content: string
  title: string
  templateId?: string
  pages?: number
  docId?: string | null
}): Promise<{ id: string }> {
  return request<{ id: string }>('/api/archive', {
    method: 'POST',
    body: JSON.stringify({
      format: input.format,
      filename: input.filename,
      content: toBase64(input.content),
      title: input.title,
      ...(input.templateId ? { templateId: input.templateId } : {}),
      ...(typeof input.pages === 'number' ? { pages: input.pages } : {}),
      ...(input.docId ? { docId: input.docId } : {}),
    }),
  })
}

export async function deleteArchiveItem(id: string): Promise<void> {
  await request(`/api/archive/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function clearArchiveLibrary(): Promise<void> {
  await request('/api/archive?all=1', { method: 'DELETE' })
}

/** Browser download of an archived artifact (Content-Disposition does the rest). */
export function archiveDownloadUrl(id: string): string {
  return `/api/archive/${encodeURIComponent(id)}`
}

/** ASCII-only id for the docs table (`<slug>-<suffix>`). */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || `resume-${Date.now().toString(36)}`
}

/** Human-friendly base name for downloads (keeps CJK characters). */
export function fileBase(input: string): string {
  const base = input
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
  return base || 'resume'
}

/* ---------------- workspace & prefs (embedded local database) ---------------- */

export type ZoomPref = { mode: 'manual'; value: number } | { mode: 'fit' }

export type WorkspaceSnapshot = {
  title: string
  data: ResumeData
  docId: string | null
  savedAt: number
}

/** The single "what was on screen" record: title + document + active doc id. */
export async function fetchWorkspace(signal?: AbortSignal): Promise<WorkspaceSnapshot | null> {
  const { workspace } = await request<{ workspace: WorkspaceSnapshot | null }>('/api/workspace', { signal })
  return workspace
}

export async function saveWorkspace(input: {
  title: string
  data: ResumeData
  docId: string | null
}): Promise<number> {
  const { savedAt } = await request<{ ok: true; savedAt: number }>('/api/workspace', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return savedAt
}

export type UiPrefs = { zoom?: ZoomPref; pill?: string | null; checkedAt?: string | null }

export async function fetchPrefs(signal?: AbortSignal): Promise<UiPrefs> {
  return request<UiPrefs>('/api/prefs', { signal })
}

/** Partial update: only the fields present in `patch` are persisted. */
export async function savePrefs(patch: UiPrefs): Promise<void> {
  await request<{ ok: true }>('/api/prefs', { method: 'PUT', body: JSON.stringify(patch) })
}

/** Legacy web-storage keys whose content moved into the db workspace. */
export const LEGACY_STORAGE_KEYS = [
  'resume-studio:draft',
  'resume-studio:doc',
  'resume-studio:doc:v1',
  'resume-studio:title',
  'resume-studio:doc-id',
] as const

/** Last-use snapshot from the pre-database localStorage; `data` is still raw. */
export function readLegacyWorkspace(): { title: string; data: unknown; docId: string | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const draft = localStorage.getItem('resume-studio:draft')
    if (draft) {
      const parsed = JSON.parse(draft) as { title?: unknown; data?: unknown; docId?: unknown }
      if (typeof parsed.title === 'string' && parsed.data) {
        return { title: parsed.title, data: parsed.data, docId: typeof parsed.docId === 'string' ? parsed.docId : null }
      }
    }
    const raw = localStorage.getItem('resume-studio:doc') ?? localStorage.getItem('resume-studio:doc:v1')
    if (!raw) return null
    return {
      title: localStorage.getItem('resume-studio:title') ?? '未命名简历',
      data: JSON.parse(raw),
      docId: localStorage.getItem('resume-studio:doc-id'),
    }
  } catch {
    return null
  }
}

/** Drop the legacy keys; only called after their content reached the server. */
export function clearLegacyStorage(): void {
  if (typeof window === 'undefined') return
  try {
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}
