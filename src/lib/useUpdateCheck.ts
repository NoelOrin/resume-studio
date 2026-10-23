import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchUpdateCheck } from './backend'
import type { UpdateCheck } from './update'

export type UpdateCheckState = 'idle' | 'checking' | 'ready' | 'error'

/** Once-a-day auto check marker (per browser session). */
const CHECKED_AT_KEY = 'resume-studio:update-checked-at'
/** Let the editor paint before the silent check competes for bandwidth. */
const AUTO_CHECK_DELAY = 3000

function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function readCheckedAt(): string | null {
  try {
    return sessionStorage.getItem(CHECKED_AT_KEY)
  } catch {
    // Private mode / storage disabled: just check every mount.
    return null
  }
}

function markChecked(): void {
  try {
    sessionStorage.setItem(CHECKED_AT_KEY, todayKey())
  } catch {
    /* ignore */
  }
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

function readableError(err: unknown): string {
  if (isAbort(err)) return '检查已取消'
  const detail = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  const trimmed = detail.trim()
  if (!trimmed) return '检查更新失败，请检查网络后重试'
  return `检查更新失败：${trimmed.slice(0, 120)}`
}

/**
 * Update-check state machine for the settings dialog.
 *
 * - one silent check 3s after mount, skipped when this session already checked today
 * - `checkNow` always works (the manual button is never throttled)
 * - no setState after unmount (abort + alive ref)
 */
export function useUpdateCheck() {
  const [state, setState] = useState<UpdateCheckState>('idle')
  const [check, setCheck] = useState<UpdateCheck | null>(null)
  const [error, setError] = useState<string | null>(null)

  const aliveRef = useRef(true)
  const busyRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      abortRef.current?.abort()
      abortRef.current = null
      busyRef.current = false
    }
  }, [])

  const checkNow = useCallback(async (): Promise<void> => {
    if (busyRef.current) return
    busyRef.current = true

    const ctrl = new AbortController()
    abortRef.current = ctrl
    setState('checking')
    setError(null)

    try {
      const result = await fetchUpdateCheck(ctrl.signal)
      if (!aliveRef.current) return
      setCheck(result)
      if (result.ok) {
        setState('ready')
        // Only a completed check counts for the once-a-day marker: a failed one
        // must stay retryable by the silent path too.
        markChecked()
      } else {
        setState('error')
        setError(result.error?.trim() || '检查更新失败，请稍后重试')
      }
    } catch (err) {
      if (!aliveRef.current || isAbort(err)) return
      setState('error')
      setError(readableError(err))
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (readCheckedAt() === todayKey()) return
    const timer = window.setTimeout(() => {
      void checkNow()
    }, AUTO_CHECK_DELAY)
    return () => window.clearTimeout(timer)
  }, [checkNow])

  return { state, check, error, checkNow }
}
