import { Btn } from './fields'
import type { ArchiveRecord } from '../lib/backend'
import { archiveDownloadUrl } from '../lib/backend'
import { templates } from '../templates/registry'

const FORMAT_LABEL: Record<ArchiveRecord['format'], string> = {
  json: 'JSON',
  html: 'HTML',
  pdf: 'PDF',
  png: 'PNG',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function templateNameOf(templateId: string | undefined): string | null {
  if (!templateId) return null
  return templates.find((tpl) => tpl.id === templateId)?.nameZh ?? null
}

/**
 * The archive library: every exported artifact (JSON / HTML / PDF / PNG) that
 * the server kept. Rows re-download straight from the API; deletion and the
 * clear-all go through the editor's handlers.
 */
export function ArchiveModal({
  open,
  records,
  busy,
  onClose,
  onRefresh,
  onDelete,
  onClear,
}: {
  open: boolean
  records: ArchiveRecord[]
  busy: boolean
  onClose: () => void
  onRefresh: () => void
  onDelete: (id: string) => void
  onClear: () => void
}) {
  if (!open) return null
  return (
    <div className="ed-overlay" role="dialog" aria-modal="true" aria-label="存档库">
      <div className="ed-modal">
        <div className="ed-modal-head">
          <div>
            <div className="ed-modal-kicker">ARCHIVE / server/data/archive</div>
            <h2>存档库</h2>
          </div>
          <button type="button" className="ed-icon" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="ed-modal-body">
          {records.length === 0 && (
            <p className="ed-note">还没有导出产物。每次导出 JSON / HTML / PDF / PNG 都会自动存档，可随时重新下载。</p>
          )}
          {records.map((record) => {
            const templateName = templateNameOf(record.templateId)
            return (
              <div className="ed-doc-row" key={record.id}>
                <div className="ed-doc-meta">
                  <b>{record.filename}</b>
                  <span>
                    <i className={`ed-tag ed-tag--${record.format}`}>{FORMAT_LABEL[record.format]}</i>
                    {record.title}
                    {templateName ? ` · ${templateName}` : ''}
                    {record.pages ? ` · ${record.pages} 页` : ''} · {formatBytes(record.bytes)} ·{' '}
                    {formatTime(record.createdAt)}
                  </span>
                </div>
                <div className="ed-doc-actions">
                  <a className="ed-btn ed-btn--ghost ed-btn--sm" href={archiveDownloadUrl(record.id)} download>
                    下载
                  </a>
                  <Btn small variant="danger" onClick={() => onDelete(record.id)} disabled={busy}>
                    删除
                  </Btn>
                </div>
              </div>
            )
          })}
        </div>

        <div className="ed-modal-foot">
          <Btn small variant="ghost" onClick={onRefresh} disabled={busy}>
            刷新
          </Btn>
          <Btn small variant="ghost" onClick={onClear} disabled={busy || records.length === 0}>
            清空
          </Btn>
          <span className="ed-spacer" />
          <Btn small variant="primary" onClick={onClose}>
            关闭
          </Btn>
        </div>
      </div>
    </div>
  )
}
