import type { DocRecord, ResumeData } from '../types'

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

/** ASCII-only id for server file names (`server/data/<id>.json`). */
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
