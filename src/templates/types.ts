import type { ReactNode } from "react";
import type { ResumeData } from "../types";

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
