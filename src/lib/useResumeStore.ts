import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResumeData } from '../types'

const STORAGE_KEY = 'resume-studio:doc:v1'

export function loadLocal(): ResumeData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ResumeData
    if (parsed?.version !== 1 || !parsed.header || !parsed.experience) return null
    return parsed
  } catch {
    return null
  }
}

export function useResumeStore(initial: ResumeData) {
  const [data, setData] = useState<ResumeData>(() => loadLocal() ?? initial)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const past = useRef<ResumeData[]>([])
  const future = useRef<ResumeData[]>([])
  const session = useRef<ResumeData | null>(null)
  const dataRef = useRef(data)
  const [, force] = useState(0)

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

  /** Live edit: no history commit until `end()` fires (input blur). */
  const update = useCallback((fn: (d: ResumeData) => ResumeData) => {
    setData((prev) => fn(prev))
  }, [])

  /** Structural edit (add / remove / reorder / toggle): commit immediately. */
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
    setData(initial)
  }, [initial, push])

  const replace = useCallback(
    (next: ResumeData) => {
      push(dataRef.current)
      session.current = null
      setData(next)
    },
    [push],
  )

  // autosave to localStorage
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setSavedAt(Date.now())
      } catch {
        /* storage may be full / blocked */
      }
    }, 350)
    return () => window.clearTimeout(t)
  }, [data])

  return {
    data,
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
