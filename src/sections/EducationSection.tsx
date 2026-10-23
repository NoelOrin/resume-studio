import { AddRow, Field, LineInput, Row } from '../components/fields'
import { removeAt, replaceAt } from '../lib/arrays'
import type { SectionProps } from './types'

export function EducationSection({ data, update, mutate }: SectionProps) {
  const e = data.education
  const setE = (patch: Partial<typeof e>) => update((d) => ({ ...d, education: { ...d.education, ...patch } }))
  const setItems = (fn: (list: string[]) => string[]) =>
    update((d) => ({ ...d, education: { ...d.education, items: fn(d.education.items) } }))
  const mutItems = (fn: (list: string[]) => string[]) =>
    mutate((d) => ({ ...d, education: { ...d.education, items: fn(d.education.items) } }))

  return (
    <div className="ed-stack">
      <Row>
        <Field label="面板编号" value={e.no} onChange={(v) => setE({ no: v })} mono />
        <Field label="小标题" value={e.kicker} onChange={(v) => setE({ kicker: v })} mono />
      </Row>
      <Row>
        <Field label="学校（中文）" value={e.school} onChange={(v) => setE({ school: v })} />
        <Field label="时间" value={e.date} onChange={(v) => setE({ date: v })} mono />
      </Row>
      <Field label="学校英文 / 学位类型" value={e.schoolMeta} onChange={(v) => setE({ schoolMeta: v })} mono />
      <Field label="专业 / 学位 / 城市" value={e.degree} onChange={(v) => setE({ degree: v })} />

      <div className="ed-sub">证书与语言</div>
      <div className="ed-list">
        {e.items.map((item, i) => (
          <div className="ed-line" key={i}>
            <LineInput value={item} onChange={(v) => setItems((list) => replaceAt(list, i, v))} />
            <button
              type="button"
              className="ed-icon ed-icon--del"
              onClick={() => mutItems((list) => removeAt(list, i))}
            >
              ✕
            </button>
          </div>
        ))}
        <AddRow
          label="添加证书"
          onClick={() => mutItems((list) => [...list, 'CERTIFICATION / YEAR'])}
        />
      </div>
    </div>
  )
}
