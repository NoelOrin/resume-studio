import { createContext, useContext, useId } from 'react'
import type { ReactNode } from 'react'

type EditApi = { begin: () => void; end: () => void }

export const EditContext = createContext<EditApi>({ begin: () => {}, end: () => {} })

const useEdit = () => useContext(EditContext)

export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  mono?: boolean
}) {
  const id = useId()
  const edit = useEdit()
  return (
    <label className="ed-field" htmlFor={id}>
      <span className="ed-label">
        {label}
        {hint && <em className="ed-hint">{hint}</em>}
      </span>
      <input
        id={id}
        className={mono ? 'ed-input ed-mono' : 'ed-input'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={edit.begin}
        onBlur={edit.end}
      />
    </label>
  )
}

export function Area({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  hint?: string
}) {
  const id = useId()
  const edit = useEdit()
  return (
    <label className="ed-field" htmlFor={id}>
      <span className="ed-label">
        {label}
        {hint && <em className="ed-hint">{hint}</em>}
      </span>
      <textarea
        id={id}
        className="ed-area"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={edit.begin}
        onBlur={edit.end}
      />
    </label>
  )
}

export function LineInput({
  value,
  onChange,
  placeholder,
  className = 'ed-input',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const edit = useEdit()
  return (
    <input
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={edit.begin}
      onBlur={edit.end}
    />
  )
}

export function Row({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return (
    <div className="ed-row" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {children}
    </div>
  )
}

export function Btn({
  children,
  onClick,
  variant = 'default',
  disabled,
  title,
  small,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'ghost' | 'danger' | 'notice'
  disabled?: boolean
  title?: string
  small?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      className={`ed-btn ed-btn--${variant}${small ? ' ed-btn--sm' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}

export function ItemBox({
  index,
  title,
  children,
  onUp,
  onDown,
  onRemove,
  canUp,
  canDown,
}: {
  index: number
  title: string
  children: ReactNode
  onUp: () => void
  onDown: () => void
  onRemove: () => void
  canUp: boolean
  canDown: boolean
}) {
  return (
    <div className="ed-item">
      <div className="ed-item-head">
        <span className="ed-item-idx">{String(index + 1).padStart(2, '0')}</span>
        <span className="ed-item-title">{title}</span>
        <span className="ed-item-actions">
          <button type="button" className="ed-icon" title="上移" disabled={!canUp} onClick={onUp}>
            ↑
          </button>
          <button type="button" className="ed-icon" title="下移" disabled={!canDown} onClick={onDown}>
            ↓
          </button>
          <button type="button" className="ed-icon ed-icon--del" title="删除" onClick={onRemove}>
            ✕
          </button>
        </span>
      </div>
      <div className="ed-item-body">{children}</div>
    </div>
  )
}

export function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="ed-add" onClick={onClick}>
      <span>+</span>
      {label}
    </button>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  hint?: string
}) {
  return (
    <label className="ed-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ed-toggle-ui" aria-hidden="true">
        <i />
      </span>
      <span className="ed-toggle-text">
        {label}
        {hint && <em className="ed-hint">{hint}</em>}
      </span>
    </label>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="ed-note">{children}</p>
}
