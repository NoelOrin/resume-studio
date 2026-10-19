import { AddRow, Area, Field, LineInput, Row } from '../components/fields'
import { patchAt, removeAt } from '../lib/arrays'
import type { SectionProps } from './types'

export function ProfileSection({ data, update, mutate }: SectionProps) {
  const p = data.profile
  const setP = (patch: Partial<typeof p>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }))
  const setStats = (fn: (list: typeof p.stats) => typeof p.stats) =>
    update((d) => ({ ...d, profile: { ...d.profile, stats: fn(d.profile.stats) } }))
  const mutStats = (fn: (list: typeof p.stats) => typeof p.stats) =>
    mutate((d) => ({ ...d, profile: { ...d.profile, stats: fn(d.profile.stats) } }))

  return (
    <div className="ed-stack">
      <Row>
        <Field label="面板编号" value={p.no} onChange={(v) => setP({ no: v })} mono />
        <Field label="小标题" value={p.kicker} onChange={(v) => setP({ kicker: v })} mono />
      </Row>
      <Area
        label="简介正文"
        value={p.text}
        onChange={(v) => setP({ text: v })}
        rows={5}
        hint="建议 60–110 字"
      />

      <div className="ed-sub">数字统计（显示在蓝卡底部）</div>
      <div className="ed-list">
        {p.stats.map((s, i) => (
          <div className="ed-line ed-line--pair" key={i}>
            <LineInput
              className="ed-input ed-mono ed-input--label"
              value={s.value}
              onChange={(v) => setStats((list) => patchAt(list, i, { value: v }))}
            />
            <LineInput
              value={s.label}
              onChange={(v) => setStats((list) => patchAt(list, i, { label: v }))}
            />
            <button
              type="button"
              className="ed-icon ed-icon--del"
              onClick={() => mutStats((list) => removeAt(list, i))}
            >
              ✕
            </button>
          </div>
        ))}
        <AddRow
          label="添加统计"
          onClick={() => mutStats((list) => [...list, { value: '00', label: 'LABEL' }])}
        />
      </div>
    </div>
  )
}
