import { AddRow, Area, Field, ItemBox, LineInput, Row } from '../components/fields'
import { move, patchAt, removeAt } from '../lib/arrays'
import type { Project } from '../types'
import type { SectionProps } from './types'

const emptyProject = (): Project => ({
  name: 'NEW PROJECT',
  code: 'P-05',
  kind: 'Category · Stack',
  desc: '一句话说清做了什么、解决什么问题。',
  stats: [{ v: '00', l: 'METRIC' }],
})

export function ProjectsSection({ data, update, mutate }: SectionProps) {
  const p = data.projects
  const setP = (patch: Partial<typeof p>) => update((d) => ({ ...d, projects: { ...d.projects, ...patch } }))
  const setItems = (fn: (list: Project[]) => Project[]) =>
    update((d) => ({ ...d, projects: { ...d.projects, items: fn(d.projects.items) } }))
  const mutItems = (fn: (list: Project[]) => Project[]) =>
    mutate((d) => ({ ...d, projects: { ...d.projects, items: fn(d.projects.items) } }))

  return (
    <div className="ed-stack">
      <div className="ed-sub">区块标题</div>
      <Row cols={4}>
        <Field label="编号" value={p.no} onChange={(v) => setP({ no: v })} mono />
        <Field label="标题" value={p.title} onChange={(v) => setP({ title: v })} mono />
        <Field label="中文" value={p.zh} onChange={(v) => setP({ zh: v })} />
        <Field label="右侧注释" value={p.meta} onChange={(v) => setP({ meta: v })} mono />
      </Row>

      <div className="ed-sub">项目卡片（2 列网格）</div>
      {p.items.map((item, i) => (
        <ItemBox
          key={i}
          index={i}
          title={item.name || '未命名项目'}
          canUp={i > 0}
          canDown={i < p.items.length - 1}
          onUp={() => mutItems((list) => move(list, i, -1))}
          onDown={() => mutItems((list) => move(list, i, 1))}
          onRemove={() => mutItems((list) => removeAt(list, i))}
        >
          <Row>
            <Field
              label="项目名"
              value={item.name}
              onChange={(v) => setItems((list) => patchAt(list, i, { name: v }))}
              mono
            />
            <Field
              label="编号"
              value={item.code}
              onChange={(v) => setItems((list) => patchAt(list, i, { code: v }))}
              mono
            />
          </Row>
          <Field
            label="类型 · 技术栈"
            value={item.kind}
            onChange={(v) => setItems((list) => patchAt(list, i, { kind: v }))}
            mono
          />
          <Area
            label="描述"
            value={item.desc}
            rows={2}
            onChange={(v) => setItems((list) => patchAt(list, i, { desc: v }))}
          />
          <div className="ed-sub ed-sub--tight">指标</div>
          <div className="ed-list">
            {item.stats.map((stat, j) => (
              <div className="ed-line ed-line--pair" key={j}>
                <LineInput
                  className="ed-input ed-mono ed-input--label"
                  value={stat.v}
                  onChange={(v) =>
                    setItems((list) =>
                      patchAt(list, i, { stats: patchAt(list[i].stats, j, { v }) }),
                    )
                  }
                />
                <LineInput
                  value={stat.l}
                  onChange={(v) =>
                    setItems((list) =>
                      patchAt(list, i, { stats: patchAt(list[i].stats, j, { l: v }) }),
                    )
                  }
                />
                <button
                  type="button"
                  className="ed-icon ed-icon--del"
                  onClick={() =>
                    mutItems((list) => patchAt(list, i, { stats: removeAt(list[i].stats, j) }))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <AddRow
              label="添加指标"
              onClick={() =>
                mutItems((list) =>
                  patchAt(list, i, { stats: [...list[i].stats, { v: '00', l: 'METRIC' }] }),
                )
              }
            />
          </div>
        </ItemBox>
      ))}

      <AddRow label="添加项目" onClick={() => mutItems((list) => [...list, emptyProject()])} />
      <p className="ed-note">每行两张卡片；项目数建议 2–4 个，奇数时最后一张会独占半行。</p>
    </div>
  )
}
