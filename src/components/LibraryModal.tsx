import { Btn } from './fields'
import type { DocRecord } from '../types'

function formatTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LibraryModal({
  open,
  docs,
  busy,
  onClose,
  onRefresh,
  onLoad,
  onDelete,
  onNew,
}: {
  open: boolean
  docs: DocRecord[]
  busy: boolean
  onClose: () => void
  onRefresh: () => void
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  if (!open) return null
  return (
    <div className="ed-overlay" role="dialog" aria-modal="true" aria-label="文档库">
      <div className="ed-modal">
        <div className="ed-modal-head">
          <div>
            <div className="ed-modal-kicker">DOCUMENTS / server/data</div>
            <h2>文档库</h2>
          </div>
          <button type="button" className="ed-icon" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="ed-modal-body">
          {docs.length === 0 && <p className="ed-note">还没有保存到服务器的简历。点击工具栏「保存到服务器」即可创建。</p>}
          {docs.map((doc) => (
            <div className="ed-doc-row" key={doc.id}>
              <div className="ed-doc-meta">
                <b>{doc.title || '未命名简历'}</b>
                <span>
                  {doc.id} · {formatTime(doc.updatedAt)}
                </span>
              </div>
              <div className="ed-doc-actions">
                <Btn small variant="ghost" onClick={() => onLoad(doc.id)} disabled={busy}>
                  打开
                </Btn>
                <Btn small variant="danger" onClick={() => onDelete(doc.id)} disabled={busy}>
                  删除
                </Btn>
              </div>
            </div>
          ))}
        </div>

        <div className="ed-modal-foot">
          <Btn small variant="ghost" onClick={onRefresh} disabled={busy}>
            刷新
          </Btn>
          <span className="ed-spacer" />
          <Btn small onClick={onNew}>
            新建空白副本
          </Btn>
          <Btn small variant="primary" onClick={onClose}>
            关闭
          </Btn>
        </div>
      </div>
    </div>
  )
}
