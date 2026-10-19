import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultResume } from '../data/defaultResume'
import { migrateDocument } from './migrate'
import type { ResumeData } from '../types'

const STORAGE_KEY = 'resume-studio:doc'
const LEGACY_KEYS = ['resume-studio:doc:v1']

export function loadLocal(): ResumeData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? LEGACY_KEYS.map((k) => localStorage.getItem(k)).find(Boolean)
    if (!raw) return null
    return migrateDocument(JSON.parse(raw))
  } catch {
    return null
  }
}

export function useResumeStore(initial: ResumeData, options?: { skipLocal?: boolean }) {
  const [data, setData] = useState<ResumeData>(initial)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const past = useRef<ResumeData[]>([])
  const future = useRef<ResumeData[]>([])
  const session = useRef<ResumeData | null>(null)
  const dataRef = useRef(data)
  const [, force] = useState(0)

  // hydrate from localStorage after mount (avoids SSR/client mismatch)
  useEffect(() => {
    if (options?.skipLocal) return
    const local = loadLocal()
    if (local) setData(local)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const bump = () => force((n) => n + 1)

  const push = useCallback((snapshot: ResumeData) => {
    past.current.push(snapshot)
    if (past.current.length > 80) past.current.shift()
    future.current = []
    bump()
  }, [])

  const update = useCallback((fn: (d: ResumeData) => ResumeData) => {
    setData((prev) => fn(prev))
  }, [])

  const mutate = useCallback(
    (fn: (d: ResumeData) => ResumeData) => {
      push(dataRef.current)
      setData(fn(dataRef.current))
    },
    [push],
  )

  const begin = useCallback(() => {
    if (!session.current) session.current = dataRef.current
  }, [])

  const end = useCallback(() => {
    if (session.current && session.current !== dataRef.current) push(session.current)
    session.current = null
  }, [push])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(dataRef.current)
    setData(prev)
    bump()
  }, [])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(dataRef.current)
    setData(next)
    bump()
  }, [])

  const reset = useCallback(() => {
    push(dataRef.current)
    session.current = null
    setData(defaultResume)
  }, [push])

  const replace = useCallback(
    (next: ResumeData) => {
      push(dataRef.current)
      session.current = null
      setData(next)
    },
    [push],
  )

  const getData = useCallback(() => dataRef.current, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setSavedAt(Date.now())
      } catch {
        /* quota / private mode */
      }
    }, 350)
    return () => window.clearTimeout(t)
  }, [data])

  return {
    data,
    getData,
    update,
    mutate,
    begin,
    end,
    undo,
    redo,
    reset,
    replace,
    savedAt,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}

export type ResumeStore = ReturnType<typeof useResumeStore>
