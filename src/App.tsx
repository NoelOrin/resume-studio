import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ResumeSheet } from './components/ResumeSheet'
import { Accordion } from './components/Accordion'
import { LibraryModal } from './components/LibraryModal'
import { EditContext, Btn } from './components/fields'
import { defaultResume } from './data/defaultResume'
import { useResumeStore } from './lib/useResumeStore'
import { useSheetOverflow } from './lib/useSheetOverflow'
import { checkHealth, deleteDoc, fileBase, getDoc, listDocs, publishHtml, putDoc, slugify } from './lib/backend'
import { buildStandaloneHtml, copyText, download, exportJson } from './lib/exporters'
import { SHEET_CSS } from './styles/sheetCss'
import { IdentitySection } from './sections/IdentitySection'
import { ProfileSection } from './sections/ProfileSection'
import { ExperienceSection } from './sections/ExperienceSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { StackSection } from './sections/StackSection'
import { EducationSection } from './sections/EducationSection'
import { FooterSection } from './sections/FooterSection'
import { ThemeSection } from './sections/ThemeSection'
import type { DocRecord, ResumeData } from './types'

const SHEET_W = 793.7008
const SHEET_H = 1122.5197
const TITLE_KEY = 'resume-studio:title'
const DOC_KEY = 'resume-studio:doc-id'

type Toast = { msg: string; kind: 'ok' | 'err' } | null

const PANELS = [
  { id: 'identity', no: '01', title: '身份与联系', en: 'IDENTITY' },
  { id: 'profile', no: '02', title: '个人简介', en: 'PROFILE' },
  { id: 'experience', no: '03', title: '工作经历', en: 'EXPERIENCE' },
  { id: 'projects', no: '04', title: '项目', en: 'SELECTED WORK' },
  { id: 'stack', no: '05', title: '技术栈', en: 'STACK' },
  { id: 'education', no: '06', title: '教育与证书', en: 'CREDENTIALS' },
  { id: 'footer', no: '07', title: '页脚与流程', en: 'FOOTER' },
  { id: 'theme', no: '08', title: '主题与显示', en: 'THEME' },
] as const

type PanelId = (typeof PANELS)[number]['id']

export default function App() {
  const store = useResumeStore(defaultResume)
  const { data, update, mutate, begin, end, undo, redo, canUndo, canRedo, savedAt, reset, replace } = store

  const [title, setTitle] = useState(() => localStorage.getItem(TITLE_KEY) ?? '林知远 · 全栈开发工程师')
  const [openPanel, setOpenPanel] = useState<PanelId>('identity')
  const [zoom, setZoom] = useState<'fit' | number>('fit')
  const [fit, setFit] = useState(0.6)
  const [online, setOnline] = useState<boolean | null>(null)
  const [docId, setDocId] = useState<string | null>(() => localStorage.getItem(DOC_KEY))
  const [docs, setDocs] = useState<DocRecord[]>([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [syncedAt, setSyncedAt] = useState<number | null>(null)

  const sheetRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const overflow = useSheetOverflow(sheetRef)

  const notify = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  /* ---------------- persistence ---------------- */
  useEffect(() => {
    localStorage.setItem(TITLE_KEY, title)
    document.title = `${title} · Resume Studio`
  }, [title])

  useEffect(() => {
    let alive = true
    const timer = window.setTimeout(() => {
      checkHealth().then((ok) => {
        if (alive) setOnline(ok)
      })
    }, 120)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [])

  // silent autosave to the local server once the doc exists
  useEffect(() => {
    if (!online || !docId) return
    const timer = window.setTimeout(() => {
      putDoc(docId, title, data)
        .then(() => setSyncedAt(Date.now()))
        .catch(() => setOnline(false))
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [data, title, online, docId])

  /* ---------------- preview scale ---------------- */
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth - 96
      const h = el.clientHeight - 132
      setFit(Math.max(0.2, Math.min(1, w / SHEET_W, h / SHEET_H)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = zoom === 'fit' ? fit : zoom

  /* ---------------- actions ---------------- */
  const ensureId = () => {
    if (docId) return docId
    const id = `${slugify(title) || 'resume'}-${Math.random().toString(36).slice(2, 6)}`
    setDocId(id)
    localStorage.setItem(DOC_KEY, id)
    return id
  }

  const saveToServer = useCallback(async () => {
    if (!online) {
      notify('后端未启动：内容已自动保存在浏览器', 'err')
      return
    }
    setBusy(true)
    try {
      const id = ensureId()
      await putDoc(id, title, data)
      setSyncedAt(Date.now())
      notify(`已保存到 server/data/${id}.json`)
    } catch (err) {
      notify(`保存失败：${(err as Error).message}`, 'err')
    } finally {
      setBusy(false)
    }
  }, [online, data, title, docId, notify])

  const refreshDocs = useCallback(async () => {
    if (!online) return
    try {
      setDocs(await listDocs())
    } catch {
      /* offline */
    }
  }, [online])

  const openLibrary = async () => {
    if (!online) {
      notify('后端未启动：运行 npm run dev 后可用', 'err')
      return
    }
    setLibraryOpen(true)
    await refreshDocs()
  }

  const loadDoc = async (id: string) => {
    setBusy(true)
    try {
      const record = await getDoc(id)
      replace(record.data)
      setTitle(record.title)
      setDocId(id)
      localStorage.setItem(DOC_KEY, id)
      setLibraryOpen(false)
      notify(`已打开 ${record.title}`)
    } catch (err) {
      notify(`打开失败：${(err as Error).message}`, 'err')
    } finally {
      setBusy(false)
    }
  }

  const removeDoc = async (id: string) => {
    if (!window.confirm(`删除 ${id}？此操作不可撤销。`)) return
    setBusy(true)
    try {
      await deleteDoc(id)
      if (docId === id) {
        setDocId(null)
        localStorage.removeItem(DOC_KEY)
      }
      await refreshDocs()
      notify('已删除')
    } catch (err) {
      notify(`删除失败：${(err as Error).message}`, 'err')
    } finally {
      setBusy(false)
    }
  }

  const newCopy = () => {
    setDocId(null)
    localStorage.removeItem(DOC_KEY)
    setTitle('未命名简历')
    setLibraryOpen(false)
    notify('已新建副本，保存时会创建新文件')
  }

  const publish = async () => {
    if (!sheetRef.current) return
    const html = buildStandaloneHtml(sheetRef.current, title)
    if (!online) {
      download(`${fileBase(title)}.html`, html, 'text/html;charset=utf-8')
      notify('后端未启动，已下载单页 HTML', 'err')
      return
    }
    setBusy(true)
    try {
      const id = ensureId()
      await putDoc(id, title, data)
      const result = await publishHtml(id, title, html)
      setSyncedAt(Date.now())
      const url = new URL(result.path, window.location.origin).toString()
      const copied = await copyText(url)
      notify(copied ? `已发布并复制链接：${result.path}` : `已发布：${url}`)
    } catch (err) {
      notify(`发布失败：${(err as Error).message}`, 'err')
    } finally {
      setBusy(false)
    }
  }

  const downloadHtml = () => {
    if (!sheetRef.current) return
    download(`${fileBase(title)}.html`, buildStandaloneHtml(sheetRef.current, title), 'text/html;charset=utf-8')
    notify('已导出单页 HTML')
  }

  const downloadJson = () => {
    exportJson(data, `${fileBase(title)}.json`)
    notify('已导出 JSON')
  }

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as ResumeData
      if (parsed?.version !== 1 || !parsed.header || !parsed.experience) throw new Error('文件不是有效的简历 JSON')
      replace(parsed)
      setDocId(null)
      localStorage.removeItem(DOC_KEY)
      notify('已导入 JSON')
    } catch (err) {
      notify(`导入失败：${(err as Error).message}`, 'err')
    }
  }

  const commitFocused = () => {
    const active = document.activeElement
    if (active instanceof HTMLElement && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      active.blur()
    }
  }

  const undoAction = () => {
    commitFocused()
    undo()
  }
  const redoAction = () => {
    commitFocused()
    redo()
  }

  const onStageClick = (event: React.MouseEvent) => {
    const target = (event.target as HTMLElement).closest('[data-panel]') as HTMLElement | null
    if (!target) return
    const id = target.dataset.panel as PanelId | undefined
    if (!id) return
    setOpenPanel(id)
    window.requestAnimationFrame(() => {
      document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // keyboard: undo / redo / save
  const saveRef = useRef(saveToServer)
  useEffect(() => {
    saveRef.current = saveToServer
  }, [saveToServer])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      if (!meta) return
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        commitFocused()
        if (event.shiftKey) redo()
        else undo()
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  /* ---------------- derived labels ---------------- */
  const saveLabel = useMemo(() => {
    if (!savedAt) return '未保存'
    const time = new Date(savedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    return syncedAt && syncedAt >= savedAt ? `已同步 ${time}` : `已自动保存 ${time}`
  }, [savedAt, syncedAt])

  const renderPanel = (id: PanelId) => {
    switch (id) {
      case 'identity':
        return <IdentitySection data={data} update={update} mutate={mutate} />
      case 'profile':
        return <ProfileSection data={data} update={update} mutate={mutate} />
      case 'experience':
        return <ExperienceSection data={data} update={update} mutate={mutate} />
      case 'projects':
        return <ProjectsSection data={data} update={update} mutate={mutate} />
      case 'stack':
        return <StackSection data={data} update={update} mutate={mutate} />
      case 'education':
        return <EducationSection data={data} update={update} mutate={mutate} />
      case 'footer':
        return <FooterSection data={data} update={update} mutate={mutate} />
      case 'theme':
        return <ThemeSection data={data} update={update} mutate={mutate} reset={() => {
          if (window.confirm('重置为示例内容？当前修改会丢失（可撤销）。')) reset()
        }} />
    }
  }

  return (
    <>
      <style>{SHEET_CSS}</style>

      <div className="ed-app">
        <header className="ed-top">
          <div className="ed-brand">
            <svg className="ed-logo" viewBox="0 0 34 34" aria-hidden="true">
              <rect x=".6" y=".6" width="32.8" height="32.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <g fill="currentColor">
                <rect x="4.5" y="5" width="1.6" height="13" />
                <rect x="7.5" y="5" width="1" height="13" />
                <rect x="9.8" y="5" width="2.2" height="13" />
                <rect x="13.2" y="5" width="1" height="13" />
                <rect x="15.5" y="5" width="1.6" height="13" />
                <rect x="18.4" y="5" width="1" height="13" />
                <rect x="20.7" y="5" width="2.2" height="13" />
                <rect x="24.1" y="5" width="1.6" height="13" />
                <rect x="27" y="5" width="1" height="13" />
              </g>
              <rect x="4.5" y="21.6" width="23.4" height="2.4" fill="currentColor" />
              <rect x="4.5" y="26.2" width="11" height="2.4" fill="currentColor" />
            </svg>
            <div className="ed-brand-txt">
              <b>RESUME STUDIO</b>
              <span>可视化简历编辑器 / 01</span>
            </div>
          </div>

          <div className="ed-doc">
            <input
              className="ed-doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="文档名"
            />
            <span className="ed-save">
              <i className={`ed-dot${online ? ' is-on' : ''}`} />
              {saveLabel}
              <em>{online ? 'BACKEND ONLINE' : online === false ? 'BROWSER ONLY' : 'CHECKING…'}</em>
            </span>
          </div>

          <div className="ed-tools">
            <div className="ed-group">
              <Btn small variant="ghost" onClick={undoAction} disabled={!canUndo} title="撤销 ⌘Z">
                撤销
              </Btn>
              <Btn small variant="ghost" onClick={redoAction} disabled={!canRedo} title="重做 ⇧⌘Z">
                重做
              </Btn>
            </div>

            <div className="ed-group ed-zoomgroup" role="group" aria-label="缩放">
              {(['fit', 0.5, 0.75, 1] as const).map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  className={`ed-zoombtn${zoom === value ? ' is-active' : ''}`}
                  onClick={() => setZoom(value)}
                >
                  {value === 'fit' ? '适应' : `${Math.round(value * 100)}%`}
                </button>
              ))}
            </div>

            <div className="ed-group">
              <Btn small variant="ghost" onClick={() => fileRef.current?.click()}>
                导入
              </Btn>
              <Btn small variant="ghost" onClick={downloadJson}>
                JSON
              </Btn>
              <Btn small variant="ghost" onClick={downloadHtml}>
                HTML
              </Btn>
            </div>

            <Btn
              small
              onClick={() => {
                notify('打印时请勾选「背景图形 / Background graphics」')
                window.setTimeout(() => window.print(), 400)
              }}
              title="打印 / 导出 PDF（A4，边距 0）"
            >
              打印
            </Btn>
            <Btn small onClick={saveToServer} disabled={busy}>
              保存
            </Btn>
            <Btn small variant="primary" onClick={publish} disabled={busy}>
              发布
            </Btn>
            <Btn small variant="ghost" onClick={openLibrary} disabled={!online}>
              文档库
            </Btn>
          </div>
        </header>

        <aside className="ed-side">
          <div className="ed-side-head">
            <span>EDIT / 内容</span>
            <span className="ed-side-tip">点右侧版面可定位</span>
          </div>
          <div className="ed-side-scroll">
            <EditContext.Provider value={{ begin, end }}>
              {PANELS.map((panel) => (
                <Accordion
                  key={panel.id}
                  id={panel.id}
                  no={panel.no}
                  title={panel.title}
                  en={panel.en}
                  open={openPanel === panel.id}
                  onToggle={() => setOpenPanel(openPanel === panel.id ? ('identity' as PanelId) : panel.id)}
                >
                  {renderPanel(panel.id)}
                </Accordion>
              ))}
            </EditContext.Provider>

            <div className="ed-side-foot">
              <span>LOCAL AUTOSAVE · A4 210×297</span>
              <span>{online ? 'server/data 可写' : '后端离线，仅浏览器保存'}</span>
            </div>
          </div>
        </aside>

        <main className="ed-stage" ref={stageRef} onClick={onStageClick}>
          {overflow && (
            <div className="ed-warn" role="status">
              <b>内容超出 A4</b>
              <span>打印会被裁切，请删减文字或关闭部分模块</span>
            </div>
          )}

          <div className="ed-stage-inner">
            <div className="ed-canvas" style={{ width: SHEET_W * scale, height: SHEET_H * scale }}>
              <div className="ed-sheet-wrap" style={{ transform: `scale(${scale})` }}>
                <ResumeSheet data={data} sheetRef={sheetRef} />
              </div>
            </div>
            <div className="ed-caption">
              <span>A4 · 210 × 297 MM · 96 DPI</span>
              <span>{Math.round(scale * 100)}%</span>
            </div>
          </div>
        </main>
      </div>

      <div className="ed-print" aria-hidden>
        <ResumeSheet data={data} />
      </div>

      {toast && <div className={`ed-toast ed-toast--${toast.kind}`}>{toast.msg}</div>}

      <LibraryModal
        open={libraryOpen}
        docs={docs}
        busy={busy}
        onClose={() => setLibraryOpen(false)}
        onRefresh={refreshDocs}
        onLoad={loadDoc}
        onDelete={removeDoc}
        onNew={newCopy}
      />

      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
    </>
  )
}
