import type { ReactNode } from "react";
import type { ResumeData } from "../types";

/**
 * Sections a template can link to the editor's form panels via `data-panel`.
 * Single source for both template authors and the editor's click-to-panel
 * routing — add a value here only together with its editor panel.
 */
export const PANEL_IDS = ["identity", "profile", "experience", "projects", "stack", "education", "flow", "footer"] as const;

export type PanelLink = (typeof PANEL_IDS)[number];

export function isPanelLink(value: string): value is PanelLink {
  return (PANEL_IDS as readonly string[]).includes(value);
}

/** Escape a template id for building the `.t-<id>` scope-class regex. */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type TemplateMeta = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  /** static page count, or a function for templates that paginate by data */
  pages: number | ((data: ResumeData) => number);
  /** default accent applied when switching to this template */
  accent: string;
  tags: string[];
  /**
   * CSS scope class is `t-<cssScope>` instead of `t-<id>`. Set it when an
   * entry shares another template's implementation (e.g. industrial-duplex
   * renders inside the industrial scope). Leave undefined for normal entries.
   */
  cssScope?: string;
};

export type TemplateDefinition = TemplateMeta & {
  /** scoped CSS, injected once per document */
  css: string;
  /** render one A4 page (0-based) */
  render: (data: ResumeData, page: number) => ReactNode;
};

export function pageCountOf(template: TemplateDefinition, data: ResumeData): number {
  return typeof template.pages === "function" ? Math.max(1, template.pages(data)) : Math.max(1, template.pages);
}

/**
 * Preview a template as it looks right after switching to it: its own catalog
 * accent, never the accent of the document being edited (that colour belongs
 * to whichever template is currently active).
 */
export function previewDataFor(template: TemplateMeta, data: ResumeData): ResumeData {
  return { ...data, templateId: template.id, theme: { ...data.theme, accent: template.accent } };
}
