"use client";

import { useRef, useState } from "react";
import { getTemplate, templates } from "../templates/registry";
import { pageCountOf, previewDataFor } from "../templates/types";
import type { ResumeData } from "../types";
import { Btn } from "./fields";
import { TemplateBoundary } from "./TemplateBoundary";

const SHEET_W = 793.7008;
const SHEET_H = 1122.5197;

const ROW_THUMB_W = 56;
const ROW_THUMB_H = Math.round((ROW_THUMB_W * SHEET_H) / SHEET_W);

const PAGE_W = 500;
const PAGE_H = Math.round((PAGE_W * SHEET_H) / SHEET_W);

export function TemplatePicker({
  open,
  data,
  onClose,
  onPick,
}: {
  open: boolean;
  data: ResumeData;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const current = getTemplate(data.templateId);
  const [previewedId, setPreviewedId] = useState(current.id);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (!open) return null;

  // registry may change under us; fall back to the document's template
  const previewed = templates.find((t) => t.id === previewedId) ?? current;
  const pages = pageCountOf(previewed, data);

  const focusRow = (id: string) => rowRefs.current[id]?.focus();

  const rowKeyDown = (e: React.KeyboardEvent, id: string, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick(id);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = templates[index + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) focusRow(next.id);
    }
  };

  return (
    <div className="ed-overlay" role="dialog" aria-modal="true" aria-label="模板库">
      <div className="ed-modal ed-tpl-modal">
        <div className="ed-modal-head">
          <div>
            <div className="ed-modal-kicker">TEMPLATE LIBRARY · {templates.length} REGISTERED</div>
            <h2>模板库</h2>
          </div>
          <button type="button" className="ed-icon" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="ed-modal-body ed-tpl-body">
          <div className="ed-tpl-list">
            {templates.map((t, i) => {
              const rowPages = pageCountOf(t, data);
              return (
                <div
                  key={t.id}
                  ref={(el) => {
                    rowRefs.current[t.id] = el;
                  }}
                  data-tpl-id={t.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={t.id === current.id}
                  className={`ed-tpl-row${t.id === current.id ? " is-active" : ""}${
                    t.id === previewed.id ? " is-previewed" : ""
                  }`}
                  onClick={() => onPick(t.id)}
                  onMouseEnter={() => setPreviewedId(t.id)}
                  onFocus={() => setPreviewedId(t.id)}
                  onKeyDown={(e) => rowKeyDown(e, t.id, i)}
                >
                  <div className="ed-tpl-thumb" style={{ width: ROW_THUMB_W, height: ROW_THUMB_H }}>
                    {/* One unrenderable template must not blank the whole picker. */}
                    <TemplateBoundary label={`thumb:${t.id}`} compact>
                      <div
                        className="ed-tpl-mini"
                        style={{ transform: `scale(${ROW_THUMB_W / SHEET_W})` }}
                      >
                        {t.render(previewDataFor(t, data), 0)}
                      </div>
                    </TemplateBoundary>
                  </div>
                  <div className="ed-tpl-rowtext">
                    <div className="ed-tpl-name">
                      {t.name}
                      <em>{t.nameZh}</em>
                    </div>
                    <div className="ed-tpl-tags">
                      <b>
                        {rowPages} PAGE{rowPages > 1 ? "S" : ""}
                      </b>
                      {t.tags.map((tag) => (
                        <i key={tag}>{tag}</i>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ed-tpl-stage">
            <div className="ed-tpl-stage-head" aria-live="polite">
              <div className="ed-tpl-stage-meta">
                <div className="ed-tpl-name">
                  {previewed.name}
                  <em>{previewed.nameZh}</em>
                </div>
                <div className="ed-tpl-desc">{previewed.description}</div>
              </div>
              <div className="ed-tpl-tags">
                <b>
                  {pages} PAGE{pages > 1 ? "S" : ""}
                </b>
                {previewed.tags.map((tag) => (
                  <i key={tag}>{tag}</i>
                ))}
              </div>
            </div>

            <div className="ed-tpl-stage-scroll">
              {Array.from({ length: pages }, (_, p) => (
                <div className="ed-tpl-stage-item" key={p}>
                  <div className="ed-tpl-sheet" style={{ width: PAGE_W, height: PAGE_H }}>
                    <TemplateBoundary label={`stage:${previewed.id}:${p}`} compact>
                      <div
                        className="ed-tpl-mini"
                        style={{ transform: `scale(${PAGE_W / SHEET_W})` }}
                      >
                        {previewed.render(previewDataFor(previewed, data), p)}
                      </div>
                    </TemplateBoundary>
                  </div>
                  <span className="ed-tpl-page-no">
                    PAGE {p + 1} / {pages}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ed-modal-foot">
          <span className="ed-tpl-note">
            新增模板：<code>src/templates/&lt;id&gt;/</code> + <code>catalog.ts</code> + <code>registry.tsx</code>
          </span>
          <span className="ed-spacer" />
          <Btn small variant="primary" onClick={onClose}>
            关闭
          </Btn>
        </div>
      </div>
    </div>
  );
}
