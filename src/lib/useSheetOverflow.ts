import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Detects content spilling past the fixed A4 sheet (it is `overflow:hidden`),
 * so the editor can warn before the user prints a clipped resume.
 */
export function useSheetOverflow(ref: RefObject<HTMLDivElement | null>) {
  const [overflow, setOverflow] = useState(false)

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    const sr = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    // the preview is scaled with a CSS transform; convert padding into scaled px
    const scale = el.offsetWidth > 0 ? sr.width / el.offsetWidth : 1
    const bottom = sr.bottom - parseFloat(cs.paddingBottom || '0') * scale
    const right = sr.right - parseFloat(cs.paddingRight || '0') * scale
    const tolerance = 1.5 * scale
    let over = false

    for (const child of Array.from(el.children) as HTMLElement[]) {
      if (child.classList.contains('reg') || child.classList.contains('edge')) continue
      const r = child.getBoundingClientRect()
      if (r.height === 0) continue
      if (r.bottom > bottom + tolerance || r.right > right + tolerance) {
        over = true
        break
      }
    }

    if (!over) {
      for (const col of Array.from(el.querySelectorAll('.col')) as HTMLElement[]) {
        const cr = col.getBoundingClientRect()
        let deepest = cr.top
        for (const child of Array.from(col.children) as HTMLElement[]) {
          deepest = Math.max(deepest, child.getBoundingClientRect().bottom)
        }
        if (deepest > cr.bottom + tolerance) {
          over = true
          break
        }
      }
    }

    setOverflow(over)
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => check())
    ro.observe(el)
    return () => ro.disconnect()
  }, [check])

  useEffect(() => {
    check()
  })

  return overflow
}
