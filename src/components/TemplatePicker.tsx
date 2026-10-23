import { getTemplate, templates } from "../templates/registry";
import { pageCountOf } from "../templates/types";
import type { ResumeData } from "../types";
import { Btn } from "./fields";
import { TemplateBoundary } from "./TemplateBoundary";

const THUMB_W = 124;
const SHEET_W = 793.7008;
const THUMB_SCALE = THUMB_W / SHEET_W;
const THUMB_H = Math.round((THUMB_W * 1122.5197) / SHEET_W);

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
  if (!open) return null;
  const current = getTemplate(data.templateId);

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

        <div className="ed-modal-body ed-tpl-grid">
          {templates.map((t) => {
            const pages = pageCountOf(t, data);
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                className={`ed-tpl-card${t.id === current.id ? " is-active" : ""}`}
                onClick={() => onPick(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onPick(t.id);
                }}
              >
                <div className="ed-tpl-thumb" style={{ width: THUMB_W, height: THUMB_H }}>
                  {/* One unrenderable template must not blank the whole picker. */}
                  <TemplateBoundary label={`thumb:${t.id}`} compact>
                    <div className="ed-tpl-mini" style={{ transform: `scale(${THUMB_SCALE})` }}>
                      {t.render(data, 0)}
                    </div>
                  </TemplateBoundary>
                </div>
                <div className="ed-tpl-info">
                  <div className="ed-tpl-name">
                    {t.name}
                    <em>{t.nameZh}</em>
                  </div>
                  <div className="ed-tpl-desc">{t.description}</div>
                  <div className="ed-tpl-tags">
                    <b>{pages} PAGE{pages > 1 ? "S" : ""}</b>
                    {t.tags.map((tag) => (
                      <i key={tag}>{tag}</i>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
