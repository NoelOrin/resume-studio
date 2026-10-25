import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPrefs, fetchUpdateCheck, savePrefs } from './backend'
import type { UpdateCheck } from './update'

export type UpdateCheckState = 'idle' | 'checking' | 'ready' | 'error'

/**
 * Once-a-day auto check marker, kept in the embedded database (`update:checked-at`)
 * so it holds across restarts — the old sessionStorage copy reset per session.
 * Last known newer release (`update:pill`) survives reloads the same way.
 */
const AUTO_CHECK_DELAY = 3000

/** Sync-readable copy of the two persisted markers, hydrated once per load. */
let prefCache: { pill?: string | null; checkedAt?: string | null } = {}
let prefCacheLoading: Promise<void> | null = null

function ensurePrefCache(): Promise<void> {
  prefCacheLoading ??= fetchPrefs()
    .then((prefs) => {
      prefCache = { pill: prefs.pill ?? null, checkedAt: prefs.checkedAt ?? null }
    })
    .catch(() => {
      /* offline: empty cache means "check on every mount", which is safe */
      prefCacheLoading = null
    })
  return prefCacheLoading
}

function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function readCheckedAt(): string | null {
  return prefCache.checkedAt ?? null
}

function markChecked(): void {
  const today = todayKey()
  prefCache = { ...prefCache, checkedAt: today }
  void savePrefs({ checkedAt: today }).catch(() => {
    /* offline: the in-memory marker still throttles this session */
  })
}

function writePillCache(latest: string | null): void {
  prefCache = { ...prefCache, pill: latest }
  void savePrefs({ pill: latest }).catch(() => {
    /* offline: the live check result still drives the UI this session */
  })
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
 * - one silent check 3s after mount, skipped when today's check already ran
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
  // Seeded from the cached discovery (db-backed) so the toolbar reminder
  // reappears on reload without waiting for (or spamming) the network check.
  const [pillLatest, setPillLatest] = useState<string | null>(null)
  const [prefsReady, setPrefsReady] = useState(false)

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

  useEffect(() => {
    let alive = true
    void ensurePrefCache().then(() => {
      if (!alive) return
      setPrefsReady(true)
      const cached = prefCache.pill
      // Only fill an empty pill: a live check that already landed is fresher.
      if (cached) setPillLatest((prev) => prev ?? cached)
    })
    return () => {
      alive = false
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
    // Wait for the cached day marker before deciding to skip: the db read is a
    // few ms on loopback, far under the 3s auto-check delay.
    if (!prefsReady) return
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
  }, [prefsReady, checkNow])

  return { state, check, error, checkNow, pillLatest }
}
