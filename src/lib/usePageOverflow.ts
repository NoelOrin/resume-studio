import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Detects whether the current template page overflows its A4 box.
 * Templates wrap flowing content in `.tpl-flow`, so scrollHeight/clientHeight
 * is a reliable (unscaled) measurement.
 */
export function usePageOverflow(pageRef: RefObject<HTMLDivElement | null>) {
  const [overflow, setOverflow] = useState(false)

  const check = useCallback(() => {
    const host = pageRef.current
    if (!host) return
    const page = host.querySelector('.tpl-page')
    const flow = host.querySelector('.tpl-flow')
    if (!page || !flow) return
    const flowOver = flow.scrollHeight > flow.clientHeight + 1 || flow.scrollWidth > flow.clientWidth + 1
    const pageOver = page.scrollHeight > page.clientHeight + 1 || page.scrollWidth > page.clientWidth + 1
    setOverflow(flowOver || pageOver)
  }, [pageRef])

  useEffect(() => {
    const host = pageRef.current
    if (!host) return
    const ro = new ResizeObserver(() => check())
    ro.observe(host)
    return () => ro.disconnect()
  }, [check, pageRef])

  useEffect(() => {
    check()
  })

  return overflow
}
