import { AddRow, Area, Field, LineInput, Row } from '../components/fields'
import { patchAt, removeAt } from '../lib/arrays'
import type { SectionProps } from './types'

export function FooterSection({ data, update, mutate }: SectionProps) {
  const f = data.footer
  const flow = data.flow
  const setF = (patch: Partial<typeof f>) => update((d) => ({ ...d, footer: { ...d.footer, ...patch } }))
  const setFlow = (patch: Partial<typeof flow>) => update((d) => ({ ...d, flow: { ...d.flow, ...patch } }))
  const setSteps = (fn: (list: string[]) => string[]) =>
    update((d) => ({ ...d, flow: { ...d.flow, steps: fn(d.flow.steps) } }))
  const mutSteps = (fn: (list: string[]) => string[]) =>
    mutate((d) => ({ ...d, flow: { ...d.flow, steps: fn(d.flow.steps) } }))

  return (
    <div className="ed-stack">
      <div className="ed-sub">流程条</div>
      <Row>
        <Field label="左侧标签" value={flow.label} onChange={(v) => setFlow({ label: v })} mono />
        <Field label="右侧标签" value={flow.tag} onChange={(v) => setFlow({ tag: v })} mono />
      </Row>
      <div className="ed-list">
        {flow.steps.map((step, i) => (
          <div className="ed-line" key={i}>
            <LineInput
              className="ed-input ed-mono"
              value={step}
              onChange={(v) => setSteps((list) => patchAt(list, i, v))}
            />
            <button
              type="button"
              className="ed-icon ed-icon--del"
              onClick={() => mutSteps((list) => removeAt(list, i))}
            >
              ✕
            </button>
          </div>
        ))}
        <AddRow label="添加步骤" onClick={() => mutSteps((list) => [...list, 'STEP'])} />
      </div>

      <div className="ed-sub">页脚</div>
      <Field label="上方左侧说明" value={f.product} onChange={(v) => setF({ product: v })} mono />
      <Field label="上方右侧说明" value={f.copyright} onChange={(v) => setF({ copyright: v })} mono />
      <Field label="超大描边字" value={f.word} onChange={(v) => setF({ word: v })} mono hint="会撑满蓝色条" />
      <Row>
        <Field label="白色贴纸主文案" value={f.plateTop} onChange={(v) => setF({ plateTop: v })} mono />
        <Field label="白色贴纸副文案" value={f.plateSub} onChange={(v) => setF({ plateSub: v })} mono />
      </Row>
      <Field label="条码编号" value={f.code} onChange={(v) => setF({ code: v })} mono />
      <Area label="签名区（多行）" value={f.sig} rows={3} onChange={(v) => setF({ sig: v })} hint="用换行分隔，最多 3 行" />

      <div className="ed-sub">页面左右竖排文字</div>
      <Field label="左侧" value={f.edgeL} onChange={(v) => setF({ edgeL: v })} mono />
      <Field label="右侧" value={f.edgeR} onChange={(v) => setF({ edgeR: v })} mono />
    </div>
  )
}
