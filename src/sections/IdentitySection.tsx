import { AddRow, Field, LineInput, Row } from '../components/fields'
import { move, patchAt, removeAt, replaceAt } from '../lib/arrays'
import type { SectionProps } from './types'

export function IdentitySection({ data, update, mutate }: SectionProps) {
  const h = data.header
  const strip = data.strip
  const setH = (patch: Partial<typeof h>) => update((d) => ({ ...d, header: { ...d.header, ...patch } }))
  const setStrip = (patch: Partial<typeof strip>) => update((d) => ({ ...d, strip: { ...d.strip, ...patch } }))
  const setContacts = (fn: (list: typeof h.contacts) => typeof h.contacts) =>
    update((d) => ({ ...d, header: { ...d.header, contacts: fn(d.header.contacts) } }))
  const setStatus = (fn: (list: string[]) => string[]) =>
    update((d) => ({ ...d, header: { ...d.header, status: fn(d.header.status) } }))
  const mutStatus = (fn: (list: string[]) => string[]) =>
    mutate((d) => ({ ...d, header: { ...d.header, status: fn(d.header.status) } }))
  const mutContacts = (fn: (list: typeof h.contacts) => typeof h.contacts) =>
    mutate((d) => ({ ...d, header: { ...d.header, contacts: fn(d.header.contacts) } }))

  return (
    <div className="ed-stack">
      <div className="ed-sub">姓名与头衔</div>
      <Row>
        <Field label="中文名" value={h.nameZh} onChange={(v) => setH({ nameZh: v })} />
        <Field label="英文名（大写更佳）" value={h.nameEn} onChange={(v) => setH({ nameEn: v })} mono />
      </Row>
      <Row>
        <Field label="中文职位" value={h.titleZh} onChange={(v) => setH({ titleZh: v })} />
        <Field label="英文职位" value={h.titleEn} onChange={(v) => setH({ titleEn: v })} mono />
      </Row>
      <Row>
        <Field label="标签 / 年份" value={h.tag} onChange={(v) => setH({ tag: v })} mono />
        <Field label="品牌名" value={h.brand} onChange={(v) => setH({ brand: v })} mono />
      </Row>
      <Field label="品牌副标题" value={h.brandSub} onChange={(v) => setH({ brandSub: v })} mono />

      <div className="ed-sub">状态行（斜杠分隔）</div>
      <div className="ed-list">
        {h.status.map((item, i) => (
          <div className="ed-line" key={i}>
            <LineInput
              value={item}
              onChange={(v) => setStatus((list) => replaceAt(list, i, v))}
            />
            <button type="button" className="ed-icon ed-icon--del" onClick={() => mutStatus((list) => removeAt(list, i))}>
              ✕
            </button>
          </div>
        ))}
        <AddRow label="添加状态" onClick={() => mutStatus((list) => [...list, 'NEW STATUS'])} />
      </div>

      <div className="ed-sub">年份徽标</div>
      <Row>
        <Field label="数字" value={h.years.value} onChange={(v) => setH({ years: { ...h.years, value: v } })} mono />
        <Field label="单位" value={h.years.label} onChange={(v) => setH({ years: { ...h.years, label: v } })} mono />
      </Row>

      <div className="ed-sub">联系方式（2×2 网格）</div>
      <div className="ed-list">
        {h.contacts.map((c, i) => (
          <div className="ed-line ed-line--pair" key={i}>
            <LineInput
              className="ed-input ed-mono ed-input--label"
              value={c.label}
              onChange={(v) => setContacts((list) => patchAt(list, i, { label: v }))}
            />
            <LineInput
              value={c.value}
              onChange={(v) => setContacts((list) => patchAt(list, i, { value: v }))}
            />
            <button
              type="button"
              className="ed-icon"
              title="上移"
              disabled={i === 0}
              onClick={() => mutContacts((list) => move(list, i, -1))}
            >
              ↑
            </button>
            <button type="button" className="ed-icon ed-icon--del" onClick={() => mutContacts((list) => removeAt(list, i))}>
              ✕
            </button>
          </div>
        ))}
        <AddRow
          label="添加联系方式"
          onClick={() => mutContacts((list) => [...list, { label: 'NEW', value: 'value' }])}
        />
      </div>

      <div className="ed-sub">顶部规格条</div>
      <Row>
        <Field label="标记 A" value={strip.a} onChange={(v) => setStrip({ a: v })} mono />
        <Field label="标记 B" value={strip.b} onChange={(v) => setStrip({ b: v })} mono />
      </Row>
      <Row>
        <Field label="版本" value={strip.rev} onChange={(v) => setStrip({ rev: v })} mono />
        <Field label="页码" value={strip.sheet} onChange={(v) => setStrip({ sheet: v })} mono />
      </Row>
      <Field label="日期" value={strip.date} onChange={(v) => setStrip({ date: v })} mono />

    </div>
  )
}
