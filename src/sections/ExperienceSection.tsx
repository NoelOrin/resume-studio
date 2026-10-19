import { AddRow, Area, Field, ItemBox, Row } from '../components/fields'
import { move, patchAt, removeAt } from '../lib/arrays'
import type { Job } from '../types'
import type { SectionProps } from './types'

const emptyJob = (): Job => ({
  roleZh: '新职位',
  roleEn: 'NEW ROLE',
  company: 'COMPANY · 城市',
  date: '2026.01 — NOW',
  bullets: ['写一条能量化的成果，关键数字用 {花括号} 包裹。'],
})

export function ExperienceSection({ data, update, mutate }: SectionProps) {
  const e = data.experience
  const setE = (patch: Partial<typeof e>) => update((d) => ({ ...d, experience: { ...d.experience, ...patch } }))
  const setJobs = (fn: (list: Job[]) => Job[]) => update((d) => ({ ...d, experience: { ...d.experience, jobs: fn(d.experience.jobs) } }))
  const setBullets = (jobIndex: number, fn: (list: string[]) => string[]) =>
    setJobs((jobs) => patchAt(jobs, jobIndex, { bullets: fn(jobs[jobIndex].bullets) }))
  const mutJobs = (fn: (list: Job[]) => Job[]) =>
    mutate((d) => ({ ...d, experience: { ...d.experience, jobs: fn(d.experience.jobs) } }))
  const mutBullets = (jobIndex: number, fn: (list: string[]) => string[]) =>
    mutate((d) =>
      ({
        ...d,
        experience: {
          ...d.experience,
          jobs: patchAt(d.experience.jobs, jobIndex, {
            bullets: fn(d.experience.jobs[jobIndex].bullets),
          }),
        },
      }),
    )

  return (
    <div className="ed-stack">
      <div className="ed-sub">区块标题</div>
      <Row cols={4}>
        <Field label="编号" value={e.no} onChange={(v) => setE({ no: v })} mono />
        <Field label="标题" value={e.title} onChange={(v) => setE({ title: v })} mono />
        <Field label="中文" value={e.zh} onChange={(v) => setE({ zh: v })} />
        <Field label="右侧注释" value={e.meta} onChange={(v) => setE({ meta: v })} mono />
      </Row>

      <div className="ed-sub">工作经历</div>
      {e.jobs.map((job, i) => (
        <ItemBox
          key={i}
          index={i}
          title={job.roleZh || '未命名职位'}
          canUp={i > 0}
          canDown={i < e.jobs.length - 1}
          onUp={() => mutJobs((jobs) => move(jobs, i, -1))}
          onDown={() => mutJobs((jobs) => move(jobs, i, 1))}
          onRemove={() => mutJobs((jobs) => removeAt(jobs, i))}
        >
          <Row>
            <Field
              label="中文职位"
              value={job.roleZh}
              onChange={(v) => setJobs((jobs) => patchAt(jobs, i, { roleZh: v }))}
            />
            <Field
              label="英文职位"
              value={job.roleEn}
              onChange={(v) => setJobs((jobs) => patchAt(jobs, i, { roleEn: v }))}
              mono
            />
          </Row>
          <Row>
            <Field
              label="公司 · 城市"
              value={job.company}
              onChange={(v) => setJobs((jobs) => patchAt(jobs, i, { company: v }))}
            />
            <Field
              label="时间"
              value={job.date}
              onChange={(v) => setJobs((jobs) => patchAt(jobs, i, { date: v }))}
              mono
            />
          </Row>

          <div className="ed-sub ed-sub--tight">
            成果要点 <em className="ed-hint">数字用 {'{1.2M}'} 高亮</em>
          </div>
          <div className="ed-list">
            {job.bullets.map((bullet, j) => (
              <div className="ed-line ed-line--stack" key={j}>
                <Area
                  label={`要点 ${j + 1}`}
                  value={bullet}
                  rows={2}
                  onChange={(v) => setBullets(i, (list) => patchAt(list, j, v))}
                />
                <button
                  type="button"
                  className="ed-icon ed-icon--del ed-icon--float"
                  onClick={() => mutBullets(i, (list) => removeAt(list, j))}
                >
                  ✕
                </button>
              </div>
            ))}
            <AddRow
              label="添加要点"
              onClick={() => mutBullets(i, (list) => [...list, '新的成果，关键数字用 {数字} 高亮。'])}
            />
          </div>
        </ItemBox>
      ))}

      <AddRow label="添加一段经历" onClick={() => mutJobs((jobs) => [...jobs, emptyJob()])} />
      <p className="ed-note">A4 只有一页：经历多时优先删旧要点，页面上方会提示是否溢出。</p>
    </div>
  )
}
