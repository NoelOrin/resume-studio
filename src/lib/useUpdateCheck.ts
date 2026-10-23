import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchUpdateCheck } from './backend'
import type { UpdateCheck } from './update'

export type UpdateCheckState = 'idle' | 'checking' | 'ready' | 'error'

/** Once-a-day auto check marker (per browser session). */
const CHECKED_AT_KEY = 'resume-studio:update-checked-at'
/** Last known newer release, so the toolbar reminder survives reloads. */
const PILL_CACHE_KEY = 'resume-studio:update-pill'
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

function readPillCache(): string | null {
  try {
    return localStorage.getItem(PILL_CACHE_KEY)
  } catch {
    return null
  }
}

function writePillCache(latest: string | null): void {
  try {
    if (latest) localStorage.setItem(PILL_CACHE_KEY, latest)
    else localStorage.removeItem(PILL_CACHE_KEY)
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
 * - re-checks on window focus once the day marker rolls over (a desktop app can
 *   stay open for days; the mount-time check alone would never see a new release)
 * - `onAutoUpdate` fires only for a silent discovery — manual checks happen with
 *   the settings dialog already open and must not trigger extra toasts
 * - `checkNow` always works (the manual button is never throttled)
 * - no setState after unmount (abort + alive ref)
 */
export function useUpdateCheck(options?: { onAutoUpdate?: (check: UpdateCheck) => void }) {
  const [state, setState] = useState<UpdateCheckState>('idle')
  const [check, setCheck] = useState<UpdateCheck | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Seeded from localStorage so the toolbar reminder reappears on reload
  // without waiting for (or spamming) the network check.
  const [pillLatest, setPillLatest] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : readPillCache(),
  )

  const aliveRef = useRef(true)
  const busyRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const autoUpdateRef = useRef(options?.onAutoUpdate)
  autoUpdateRef.current = options?.onAutoUpdate

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      abortRef.current?.abort()
      abortRef.current = null
      busyRef.current = false
    }
  }, [])

  const checkNow = useCallback(async (kind: 'manual' | 'auto' = 'manual'): Promise<void> => {
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
        const pill = result.hasUpdate ? result.latest : null
        setPillLatest(pill)
        writePillCache(pill)
        if (result.hasUpdate && kind === 'auto') autoUpdateRef.current?.(result)
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
      void checkNow('auto')
    }, AUTO_CHECK_DELAY)
    // A desktop window can sit open for days: re-check when it becomes visible
    // after the day marker has rolled over. `markChecked` gates this to once a day.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (readCheckedAt() === todayKey()) return
      if (busyRef.current) return
      void checkNow('auto')
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [checkNow])

  return { state, check, error, checkNow, pillLatest }
}
