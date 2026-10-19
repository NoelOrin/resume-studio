import type { ReactNode } from 'react'

export function Accordion({
  id,
  no,
  title,
  en,
  open,
  onToggle,
  children,
}: {
  id: string
  no: string
  title: string
  en: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="ed-acc" id={`sec-${id}`}>
      <button type="button" className="ed-acc-head" aria-expanded={open} onClick={onToggle}>
        <span className="ed-acc-no">{no}</span>
        <span className="ed-acc-title">{title}</span>
        <span className="ed-acc-en">{en}</span>
        <span className="ed-acc-caret">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="ed-acc-body">{children}</div>}
    </section>
  )
}
