import { Btn, Toggle } from '../components/fields'
import type { SectionProps } from './types'

const PRESETS = [
  { name: 'COBALT', value: '#2F52E0' },
  { name: 'INK', value: '#111111' },
  { name: 'VERMILION', value: '#E8462D' },
  { name: 'PINE', value: '#1F7A4C' },
  { name: 'VIOLET', value: '#5B4FE0' },
  { name: 'TEAL', value: '#0E7490' },
]

export function ThemeSection({
  data,
  update,
  reset,
  templateName,
  templateId,
  pageCount,
  onOpenTemplates,
}: SectionProps & {
  reset: () => void
  templateName: string
  templateId: string
  pageCount: number
  onOpenTemplates: () => void
}) {
  const setAccent = (accent: string) => update((d) => ({ ...d, theme: { ...d.theme, accent } }))
  const setFlag = (key: keyof typeof data.flags, value: boolean) =>
    update((d) => ({ ...d, flags: { ...d.flags, [key]: value } }))

  return (
    <div className="ed-stack">
      <div className="ed-sub">当前模板</div>
      <div className="ed-tpl-current">
        <div>
          <b>{templateName}</b>
          <span>
            {templateId} · {pageCount} PAGE{pageCount > 1 ? 'S' : ''}
          </span>
        </div>
        <Btn small onClick={onOpenTemplates}>
          更换模板
        </Btn>
      </div>

      <div className="ed-sub">主色 / ACCENT</div>
      <div className="ed-swatches">
        {PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.value}
            className={`ed-swatch${data.theme.accent.toLowerCase() === preset.value.toLowerCase() ? ' is-active' : ''}`}
            title={preset.name}
            onClick={() => setAccent(preset.value)}
          >
            <i style={{ background: preset.value }} />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
      <label className="ed-field">
        <span className="ed-label">自定义颜色</span>
        <span className="ed-color-row">
          <input
            type="color"
            className="ed-color"
            value={/^#[0-9a-f]{6}$/i.test(data.theme.accent) ? data.theme.accent : '#2F52E0'}
            onChange={(e) => setAccent(e.target.value)}
          />
          <input
            className="ed-input ed-mono"
            value={data.theme.accent}
            onChange={(e) => setAccent(e.target.value)}
          />
        </span>
      </label>

      <div className="ed-sub">显示模块</div>
      <Toggle label="年份徽标（头部圆形）" checked={data.flags.showYears} onChange={(v) => setFlag('showYears', v)} />
      <Toggle label="数字统计（蓝卡底部）" checked={data.flags.showStats} onChange={(v) => setFlag('showStats', v)} />
      <Toggle label="流程条 PROCESS" checked={data.flags.showFlow} onChange={(v) => setFlag('showFlow', v)} />

      <div className="ed-sub">恢复</div>
      <Btn variant="danger" onClick={reset}>
        重置为示例内容
      </Btn>
      <p className="ed-note">
        「极简档案」模板使用黑白排版，主色只用于强调；「工业标签」系列共享同一套样式与双页布局。
      </p>
    </div>
  )
}
