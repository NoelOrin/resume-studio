import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultResume } from '../data/defaultResume'
import type { ResumeData } from '../types'

/**
 * Document state + undo/redo. Persistence deliberately lives one level up
 * (EditorApp keeps the workspace record in the embedded local database via
 * /api/workspace), so this hook is storage-free and SSR-safe.
 */
export function useResumeStore(initial: ResumeData) {
  const [data, setData] = useState<ResumeData>(initial)
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
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}

export type ResumeStore = ReturnType<typeof useResumeStore>
