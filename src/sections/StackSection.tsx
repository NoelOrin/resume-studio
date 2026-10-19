import { AddRow, Field, LineInput, Row } from '../components/fields'
import { patchAt, removeAt } from '../lib/arrays'
import type { SectionProps } from './types'

export function StackSection({ data, update, mutate }: SectionProps) {
  const s = data.stack
  const setS = (patch: Partial<typeof s>) => update((d) => ({ ...d, stack: { ...d.stack, ...patch } }))
  const setGroups = (fn: (list: typeof s.groups) => typeof s.groups) =>
    update((d) => ({ ...d, stack: { ...d.stack, groups: fn(d.stack.groups) } }))
  const setSkills = (fn: (list: typeof s.skills) => typeof s.skills) =>
    update((d) => ({ ...d, stack: { ...d.stack, skills: fn(d.stack.skills) } }))
  const mutGroups = (fn: (list: typeof s.groups) => typeof s.groups) =>
    mutate((d) => ({ ...d, stack: { ...d.stack, groups: fn(d.stack.groups) } }))
  const mutSkills = (fn: (list: typeof s.skills) => typeof s.skills) =>
    mutate((d) => ({ ...d, stack: { ...d.stack, skills: fn(d.stack.skills) } }))

  return (
    <div className="ed-stack">
      <Row>
        <Field label="面板编号" value={s.no} onChange={(v) => setS({ no: v })} mono />
        <Field label="小标题" value={s.kicker} onChange={(v) => setS({ kicker: v })} mono />
      </Row>

      <div className="ed-sub">技术分组（左侧键 / 右侧值）</div>
      <div className="ed-list">
        {s.groups.map((g, i) => (
          <div className="ed-line ed-line--pair" key={i}>
            <LineInput
              className="ed-input ed-mono ed-input--label"
              value={g.k}
              onChange={(v) => setGroups((list) => patchAt(list, i, { k: v }))}
            />
            <LineInput
              value={g.v}
              onChange={(v) => setGroups((list) => patchAt(list, i, { v }))}
            />
            <button
              type="button"
              className="ed-icon ed-icon--del"
              onClick={() => mutGroups((list) => removeAt(list, i))}
            >
              ✕
            </button>
          </div>
        ))}
        <AddRow
          label="添加分组"
          onClick={() => mutGroups((list) => [...list, { k: 'KEY', v: 'value / value' }])}
        />
      </div>

      <div className="ed-sub">熟练度条（0 – 10 格）</div>
      <div className="ed-list">
        {s.skills.map((skill, i) => (
          <div className="ed-skill" key={i}>
            <LineInput
              className="ed-input ed-mono ed-input--label"
              value={skill.label}
              onChange={(v) => setSkills((list) => patchAt(list, i, { label: v }))}
            />
            <input
              className="ed-range"
              type="range"
              min={0}
              max={10}
              value={skill.level}
              onChange={(e) => setSkills((list) => patchAt(list, i, { level: Number(e.target.value) }))}
            />
            <span className="ed-range-val">{skill.level}</span>
            <button
              type="button"
              className="ed-icon ed-icon--del"
              onClick={() => mutSkills((list) => removeAt(list, i))}
            >
              ✕
            </button>
          </div>
        ))}
        <AddRow
          label="添加技能条"
          onClick={() => mutSkills((list) => [...list, { label: 'SKILL', level: 7 }])}
        />
      </div>
    </div>
  )
}
