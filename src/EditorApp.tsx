"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Accordion } from "./components/Accordion";
import { LibraryModal } from "./components/LibraryModal";
import { SettingsModal, formatVersionLabel } from "./components/SettingsModal";
import { TemplatePicker } from "./components/TemplatePicker";
import { ZoomControl } from "./components/ZoomControl";
import { Btn, EditContext } from "./components/fields";
import { useZoom } from "./lib/useZoom";
import { ZOOM_MIN, anchorScroll, normalizeWheelDelta, wheelZoom, zoomAnchor, type ZoomAnchor } from "./lib/zoom";
import { defaultResume } from "./data/defaultResume";
import { useResumeStore } from "./lib/useResumeStore";
import { usePageOverflow } from "./lib/usePageOverflow";
import { useUpdateCheck } from "./lib/useUpdateCheck";
import { checkHealth, deleteDoc, fileBase, listDocs, publishHtml, putDoc, slugify } from "./lib/backend";
import { buildStandaloneHtml, copyText, downloadHtml, exportJson } from "./lib/exporters";
import { migrateDocument } from "./lib/migrate";
import { PAGE_CSS } from "./styles/pages";
import { ALL_TEMPLATE_CSS, getTemplate, templates } from "./templates/registry";
import { pageCountOf } from "./templates/types";
import { IdentitySection } from "./sections/IdentitySection";
import { ProfileSection } from "./sections/ProfileSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { StackSection } from "./sections/StackSection";
import { EducationSection } from "./sections/EducationSection";
import { FooterSection } from "./sections/FooterSection";
import { ThemeSection } from "./sections/ThemeSection";
import type { DocRecord, ResumeData, StoredDoc } from "./types";

const SHEET_W = 793.7008;
const SHEET_H = 1122.5197;
const TITLE_KEY = "resume-studio:title";
const DOC_KEY = "resume-studio:doc-id";

// SSR-safe layout effect: avoids the SSR useLayoutEffect warning.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Toast = { msg: string; kind: "ok" | "err" } | null;

const PANELS = [
  { id: "identity", no: "01", title: "身份与联系", en: "IDENTITY" },
  { id: "profile", no: "02", title: "个人简介", en: "PROFILE" },
  { id: "experience", no: "03", title: "工作经历", en: "EXPERIENCE" },
  { id: "projects", no: "04", title: "项目", en: "SELECTED WORK" },
  { id: "stack", no: "05", title: "技术栈", en: "STACK" },
  { id: "education", no: "06", title: "教育与证书", en: "CREDENTIALS" },
  { id: "footer", no: "07", title: "页脚与流程", en: "FOOTER" },
  { id: "theme", no: "08", title: "模板与主题", en: "TEMPLATE" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

export function EditorApp({ initialDocs, initialDoc }: { initialDocs: DocRecord[]; initialDoc: StoredDoc | null }) {
  const store = useResumeStore(initialDoc?.data ?? defaultResume, { skipLocal: Boolean(initialDoc) });
  const { data, update, mutate, begin, end, undo, redo, canUndo, canRedo, savedAt, reset, replace } = store;

  const [title, setTitle] = useState(initialDoc?.title ?? "林知远 · 全栈开发工程师");
  const [docId, setDocId] = useState<string | null>(initialDoc?.id ?? null);
  const [openPanel, setOpenPanel] = useState<PanelId>("identity");
  const [page, setPage] = useState(0);
  const [fit, setFit] = useState(0.6);
  const { mode: zoomMode, scale, setManual, setFit: fitToView, zoomBy } = useZoom(fit);
  const [online, setOnline] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<DocRecord[]>(initialDocs);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  const { state: updateState, check: updateCheck, error: updateError, checkNow } = useUpdateCheck();

  const stageRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const scaleRef = useRef(scale);
  const anchorRef = useRef<ZoomAnchor | null>(null);
  const panRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(
    null,
  );
  const panMoved = useRef(false);
  const wheelAccum = useRef(0);
  const wheelPoint = useRef({ x: 0, y: 0 });
  const wheelRaf = useRef<number | undefined>(undefined);

  const template = getTemplate(data.templateId);
  const pageTotal = pageCountOf(template, data);
  const overflow = usePageOverflow(pageRef);

  const notify = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---------------- hydration of per-document meta ---------------- */
  useEffect(() => {
    if (initialDoc) return;
    const savedTitle = localStorage.getItem(TITLE_KEY);
    if (savedTitle) setTitle(savedTitle);
    const savedId = localStorage.getItem(DOC_KEY);
    if (savedId) setDocId(savedId);
  }, [initialDoc]);

  useEffect(() => {
    localStorage.setItem(TITLE_KEY, title);
    document.title = `${title} · Resume Studio`;
  }, [title]);

  useEffect(() => {
    if (docId) localStorage.setItem(DOC_KEY, docId);
    else localStorage.removeItem(DOC_KEY);
  }, [docId]);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      checkHealth().then((ok) => {
        if (alive) setOnline(ok);
      });
    }, 150);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  // silent autosave to the vinext server once the document exists
  useEffect(() => {
    if (!online || !docId) return;
    const timer = window.setTimeout(() => {
      putDoc(docId, title, data)
        .then(() => setSyncedAt(Date.now()))
        .catch(() => setOnline(false));
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [data, title, online, docId]);

  /* ---------------- preview scale / paging ---------------- */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth - 96;
      const h = el.clientHeight - 150;
      setFit(Math.max(ZOOM_MIN, Math.min(1, w / SHEET_W, h / SHEET_H)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (page > pageTotal - 1) setPage(0);
  }, [pageTotal, page]);

  /* ---------------- free zoom ---------------- */
  const anchoredZoom = useCallback(
    (next: number, clientX: number, clientY: number) => {
      // Bail out when the clamped value did not move: React skips the render,
      // the layout effect below never runs, and a stale anchor would then be
      // consumed by the next unrelated scale change (slider, resize-driven fit).
      if (next === scale) return;
      const canvas = canvasRef.current;
      if (canvas) {
        // Remember where the pointer sits on the unscaled sheet, then restore
        // that point under the pointer after the new scale has rendered.
        anchorRef.current = zoomAnchor(clientX, clientY, canvas.getBoundingClientRect(), scale);
      }
      setManual(next);
    },
    [scale, setManual],
  );

  // The wheel listener must stay subscribed across scale changes, so it reads
  // the latest callback through a ref instead of re-registering every render.
  const anchoredZoomRef = useRef(anchoredZoom);
  useIsoLayoutEffect(() => {
    anchoredZoomRef.current = anchoredZoom;
  });

  useIsoLayoutEffect(() => {
    scaleRef.current = scale;
    const anchor = anchorRef.current;
    anchorRef.current = null;
    if (!anchor) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const next = anchorScroll(anchor, canvas.getBoundingClientRect(), scale, {
      left: stage.scrollLeft,
      top: stage.scrollTop,
    });
    stage.scrollLeft = next.left;
    stage.scrollTop = next.top;
  }, [scale]);

  // Native non-passive listener: React's onWheel is passive and cannot preventDefault.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      // Normalize per event: deltaMode is per event, and Firefox mice report lines.
      wheelAccum.current += normalizeWheelDelta(event.deltaY, event.deltaMode, el.clientHeight);
      wheelPoint.current = { x: event.clientX, y: event.clientY };
      if (wheelRaf.current !== undefined) return;
      wheelRaf.current = window.requestAnimationFrame(() => {
        wheelRaf.current = undefined;
        const deltaY = wheelAccum.current;
        wheelAccum.current = 0;
        if (!deltaY) return;
        anchoredZoomRef.current(wheelZoom(scaleRef.current, deltaY), wheelPoint.current.x, wheelPoint.current.y);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelRaf.current !== undefined) window.cancelAnimationFrame(wheelRaf.current);
      wheelRaf.current = undefined;
    };
  }, []);

  /* ---------------- drag-to-pan ---------------- */
  const onStagePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    // Touch already pans through native overflow scrolling; driving scrollLeft
    // as well makes the two fight each other.
    if (event.pointerType === "touch") return;
    const target = event.target as HTMLElement;
    if (target.closest(".ed-pager, .ed-warn, button, input, textarea, select, a, [contenteditable]")) return;
    const stage = stageRef.current;
    if (!stage) return;
    if (stage.scrollWidth <= stage.clientWidth + 1 && stage.scrollHeight <= stage.clientHeight + 1) return;
    panRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: stage.scrollLeft,
      top: stage.scrollTop,
      moved: false,
    };
    panMoved.current = false;
  };

  const onStagePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const pan = panRef.current;
    const stage = stageRef.current;
    if (!pan || !stage || pan.pointerId !== event.pointerId) return;
    if (event.buttons === 0) {
      // pointer was released outside the stage before capture kicked in
      panRef.current = null;
      stage.classList.remove("is-panning");
      return;
    }
    const dx = event.clientX - pan.x;
    const dy = event.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > 4) {
      pan.moved = true;
      panMoved.current = true;
      // Capture only after the drag threshold: capturing on pointerdown would
      // retarget compatibility click/dblclick events to the stage and break
      // both click-to-panel and double-click-to-fit.
      stage.setPointerCapture(event.pointerId);
      stage.classList.add("is-panning");
    }
    if (!pan.moved) return;
    stage.scrollLeft = pan.left - dx;
    stage.scrollTop = pan.top - dy;
  };

  const endPan = (event: React.PointerEvent<HTMLElement>) => {
    const pan = panRef.current;
    if (pan && pan.pointerId !== event.pointerId) return;
    panRef.current = null;
    const stage = stageRef.current;
    if (!stage) return;
    stage.classList.remove("is-panning");
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (pan?.moved) {
      // let the trailing click fire first, then clear the suppression flag
      window.setTimeout(() => {
        panMoved.current = false;
      }, 0);
    }
  };

  const onStageClickCapture = (event: React.MouseEvent) => {
    if (!panMoved.current) return;
    panMoved.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const onStageDoubleClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    // The sheet has no double-click action of its own, so fit on the whole
    // stage; only the pager and the overflow banner keep their own gestures.
    if (target.closest(".ed-pager, .ed-warn")) return;
    fitToView();
  };

  /* ---------------- server actions ---------------- */
  const ensureId = () => {
    if (docId) return docId;
    const id = `${slugify(title) || "resume"}-${Math.random().toString(36).slice(2, 6)}`;
    setDocId(id);
    return id;
  };

  const refreshDocs = useCallback(async () => {
    if (!online) return;
    try {
      setDocs(await listDocs());
    } catch {
      /* server offline */
    }
  }, [online]);

  const saveToServer = useCallback(async () => {
    try {
      const id = ensureId();
      await putDoc(id, title, data);
      setSyncedAt(Date.now());
      notify(`已保存到 .data/docs/${id}.json`);
      void refreshDocs();
    } catch (err) {
      notify(`保存失败：${(err as Error).message}`, "err");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, data, docId, notify, refreshDocs]);

  const exportMarkup = () => {
    if (!exportRef.current) return null;
    return buildStandaloneHtml(exportRef.current, template.css, title);
  };

  const publish = async () => {
    const html = exportMarkup();
    if (!html) return;
    setBusy(true);
    try {
      const id = ensureId();
      await putDoc(id, title, data);
      const result = await publishHtml(id, title, html);
      setSyncedAt(Date.now());
      const url = new URL(result.path, window.location.origin).toString();
      const copied = await copyText(url);
      notify(copied ? `已发布并复制链接：${result.path}` : `已发布：${url}`);
      void refreshDocs();
    } catch (err) {
      downloadHtml(html, `${fileBase(title)}.html`);
      notify(`发布失败，已下载 HTML：${(err as Error).message}`, "err");
    } finally {
      setBusy(false);
    }
  };

  const downloadCurrentHtml = () => {
    const html = exportMarkup();
    if (!html) return;
    downloadHtml(html, `${fileBase(title)}.html`);
    notify("已导出单页 HTML（含全部页面）");
  };

  const downloadJson = () => {
    exportJson(data, `${fileBase(title)}.json`);
    notify("已导出 JSON");
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = migrateDocument(JSON.parse(await file.text()));
      if (!parsed) throw new Error("文件不是有效的简历 JSON");
      replace(parsed);
      setDocId(null);
      setPage(0);
      notify(`已导入 JSON · 模板 ${getTemplate(parsed.templateId).nameZh}`);
    } catch (err) {
      notify(`导入失败：${(err as Error).message}`, "err");
    }
  };

  const openLibrary = async () => {
    setLibraryOpen(true);
    await refreshDocs();
  };

  const loadDoc = (id: string) => {
    window.location.assign(`/?doc=${encodeURIComponent(id)}`);
  };

  const removeDoc = async (id: string) => {
    if (!window.confirm(`删除 ${id}？此操作不可撤销。`)) return;
    setBusy(true);
    try {
      await deleteDoc(id);
      if (docId === id) setDocId(null);
      await refreshDocs();
      notify("已删除");
    } catch (err) {
      notify(`删除失败：${(err as Error).message}`, "err");
    } finally {
      setBusy(false);
    }
  };

  const newCopy = () => {
    setDocId(null);
    setTitle("未命名简历");
    setLibraryOpen(false);
    notify("已新建副本，保存时会创建新文件");
  };

  const switchTemplate = (id: string) => {
    const next = getTemplate(id);
    const isPresetAccent = templates.some((t) => t.accent.toLowerCase() === data.theme.accent.toLowerCase());
    const keepAccent = !isPresetAccent;
    mutate((d) => ({
      ...d,
      templateId: id,
      theme: { ...d.theme, accent: keepAccent ? d.theme.accent : next.accent },
    }));
    setPage(0);
    setTemplateOpen(false);
    notify(`已切换到「${next.nameZh}」· ${pageCountOf(next, data)} 页`);
  };

  const commitFocused = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      active.blur();
    }
  };

  const onStageClick = (event: React.MouseEvent) => {
    const target = (event.target as HTMLElement).closest("[data-panel]") as HTMLElement | null;
    if (!target) return;
    const id = target.dataset.panel as PanelId | undefined;
    if (!id || !PANELS.some((p) => p.id === id)) return;
    setOpenPanel(id);
    window.requestAnimationFrame(() => {
      document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  /* ---------------- keyboard ---------------- */
  const saveRef = useRef(saveToServer);
  useEffect(() => {
    saveRef.current = saveToServer;
  }, [saveToServer]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        commitFocused();
        if (event.shiftKey) redo();
        else undo();
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const saveLabel = useMemo(() => {
    if (!savedAt) return "未保存";
    const time = new Date(savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    return syncedAt && syncedAt >= savedAt ? `已同步 ${time}` : `已自动保存 ${time}`;
  }, [savedAt, syncedAt]);

  const exportPages = Array.from({ length: pageTotal }, (_, i) => <div key={i}>{template.render(data, i)}</div>);

  const renderPanel = (id: PanelId) => {
    switch (id) {
      case "identity":
        return <IdentitySection data={data} update={update} mutate={mutate} />;
      case "profile":
        return <ProfileSection data={data} update={update} mutate={mutate} />;
      case "experience":
        return <ExperienceSection data={data} update={update} mutate={mutate} />;
      case "projects":
        return <ProjectsSection data={data} update={update} mutate={mutate} />;
      case "stack":
        return <StackSection data={data} update={update} mutate={mutate} />;
      case "education":
        return <EducationSection data={data} update={update} mutate={mutate} />;
      case "footer":
        return <FooterSection data={data} update={update} mutate={mutate} />;
      case "theme":
        return (
          <ThemeSection
            data={data}
            update={update}
            mutate={mutate}
            templateName={template.nameZh}
            templateId={template.id}
            pageCount={pageTotal}
            onOpenTemplates={() => setTemplateOpen(true)}
            reset={() => {
              if (window.confirm("重置为示例内容？当前修改会丢失（可撤销）。")) reset();
            }}
          />
        );
    }
  };

  return (
    <>
      <style>{PAGE_CSS + ALL_TEMPLATE_CSS}</style>

      <div className="ed-app">
        <header className="ed-top">
          <div className="ed-brand">
            <svg className="ed-logo" viewBox="0 0 34 34" aria-hidden="true">
              <rect x=".7" y=".7" width="32.6" height="32.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M4 17.4h5.2l2.3-8 4.4 15.6 2.9-9.3 2 3.5h9.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
              <path d="M4 23.4h26" stroke="currentColor" strokeWidth="1.1" />
              <path d="M6.5 26h5M14.5 26h5M22.5 26h5" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            <div className="ed-brand-txt">
              <b>RESUME STUDIO</b>
              <span>vinext full-stack / 多模板</span>
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
              <i className={`ed-dot${online ? " is-on" : ""}`} />
              {saveLabel}
              <em>{online ? "VINEXT ONLINE" : online === false ? "OFFLINE" : "CHECKING…"}</em>
            </span>
          </div>

          <div className="ed-tools">
            <div className="ed-group">
              <Btn small variant="ghost" onClick={() => { commitFocused(); undo(); }} disabled={!canUndo} title="撤销 ⌘Z">
                撤销
              </Btn>
              <Btn small variant="ghost" onClick={() => { commitFocused(); redo(); }} disabled={!canRedo} title="重做 ⇧⌘Z">
                重做
              </Btn>
            </div>

            <ZoomControl
              mode={zoomMode}
              scale={scale}
              onFit={fitToView}
              onStep={zoomBy}
              onSlide={setManual}
            />

            <Btn small onClick={() => setTemplateOpen(true)} title="切换模板">
              模板
            </Btn>
            <div className="ed-group">
              <Btn small variant="ghost" onClick={() => fileRef.current?.click()}>
                导入
              </Btn>
              <Btn small variant="ghost" onClick={downloadJson}>
                JSON
              </Btn>
              <Btn small variant="ghost" onClick={downloadCurrentHtml}>
                HTML
              </Btn>
            </div>

            <Btn
              small
              onClick={() => {
                notify("打印时请勾选「背景图形 / Background graphics」");
                window.setTimeout(() => window.print(), 400);
              }}
              title="打印 / 导出 PDF（全部页面）"
            >
              打印
            </Btn>
            <Btn small onClick={saveToServer} disabled={busy}>
              保存
            </Btn>
            <Btn small variant="primary" onClick={publish} disabled={busy}>
              发布
            </Btn>
            <Btn small variant="ghost" onClick={openLibrary}>
              文档库
            </Btn>
            <Btn
              small
              variant="ghost"
              onClick={() => setSettingsOpen(true)}
              title={updateCheck?.hasUpdate ? `设置 · 有新版本 ${formatVersionLabel(updateCheck.latest)}` : "设置"}
            >
              设置
              {updateCheck?.hasUpdate && <i className="ed-dot-badge" aria-hidden="true" />}
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
                  onToggle={() => setOpenPanel(openPanel === panel.id ? ("identity" as PanelId) : panel.id)}
                >
                  {renderPanel(panel.id)}
                </Accordion>
              ))}
            </EditContext.Provider>

            <div className="ed-side-foot">
              <span>{template.name} · {pageTotal}P</span>
              <span>{online ? ".data 可写" : "后端离线"}</span>
            </div>
          </div>
        </aside>

        <main
          className="ed-stage"
          ref={stageRef}
          onClick={onStageClick}
          onClickCapture={onStageClickCapture}
          onDoubleClick={onStageDoubleClick}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          {overflow && (
            <div className="ed-warn" role="status">
              <b>第 {page + 1} 页超出 A4</b>
              <span>打印会被裁切，请删减内容或切换双页模板</span>
            </div>
          )}

          <div className="ed-stage-inner">
            <div className="ed-canvas" ref={canvasRef} style={{ width: SHEET_W * scale, height: SHEET_H * scale }}>
              <div
                className="ed-sheet-wrap"
                style={{ width: SHEET_W, height: SHEET_H, transform: `scale(${scale})` }}
              >
                <div className="ed-page-host" ref={pageRef}>
                  {template.render(data, page)}
                </div>
              </div>
            </div>

            {pageTotal > 1 && (
              <div className="ed-pager">
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  ←
                </button>
                <span className="ed-pager-label">
                  PAGE {String(page + 1).padStart(2, "0")} / {String(pageTotal).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageTotal - 1, p + 1))}
                  disabled={page >= pageTotal - 1}
                >
                  →
                </button>
                <span className="ed-pager-dots">
                  {Array.from({ length: pageTotal }, (_, i) => (
                    <i key={i} className={i === page ? "is-on" : ""} onClick={() => setPage(i)} />
                  ))}
                </span>
              </div>
            )}

            <div className="ed-caption">
              <span>
                A4 · 210 × 297 MM · {template.name}
                {pageTotal > 1 ? ` · PAGE ${page + 1}/${pageTotal}` : ""}
              </span>
              <span>{Math.round(scale * 100)}%</span>
            </div>
          </div>
        </main>
      </div>

      <div className="ed-export-layer" aria-hidden>
        <div className="tpl-export" ref={exportRef}>
          {exportPages}
        </div>
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

      <TemplatePicker
        open={templateOpen}
        data={data}
        onClose={() => setTemplateOpen(false)}
        onPick={switchTemplate}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        state={updateState}
        check={updateCheck}
        error={updateError}
        onCheck={() => {
          void checkNow();
        }}
        notify={notify}
      />

      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
    </>
  );
}
