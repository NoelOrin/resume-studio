import type { ReactNode } from "react";
import type { ResumeData } from "../types";
import { escapeRegExp } from "./types";
import type { TemplateDefinition, TemplateMeta } from "./types";

/**
 * Template factory — the one way to define a template. Metadata, scoped CSS
 * and the page renderer live in a single `defineTemplate()` call (see
 * src/templates/registry.tsx); the server-safe catalog is derived from the
 * result. Dev-time mistakes fail here at module load instead of hiding until
 * the contract test or, worse, the editor.
 */
export type TemplateInput = {
  id: string;
  nameZh: string;
  description: string;
  /** static page count, or a function for templates that paginate by data */
  pages: number | ((data: ResumeData) => number);
  /** default accent applied when switching to this template */
  accent: string;
  /** template-library tags; defaults to none */
  tags?: string[];
  /** latin display name; defaults to the id upper-cased */
  name?: string;
  /** scope class override when an entry shares another's implementation */
  cssScope?: string;
  /** scoped CSS, injected once per document */
  css: string;
  /** render one A4 page (0-based) */
  render: (data: ResumeData, page: number) => ReactNode;
};

export function defineTemplate(input: TemplateInput): TemplateDefinition {
  const { id } = input;
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    throw new Error(`template id "${id}" must be kebab-case (it names the .t-<id> CSS scope and file paths)`);
  }
  const scope = input.cssScope ?? id;
  if (!new RegExp(`\\.t-${escapeRegExp(scope)}\\b`).test(input.css)) {
    throw new Error(`template "${id}": css must scope selectors under .t-${scope} (all template CSS is injected side by side)`);
  }

  const meta: TemplateMeta = {
    id,
    name: input.name ?? id.toUpperCase(),
    nameZh: input.nameZh,
    description: input.description,
    pages: input.pages,
    accent: input.accent,
    tags: input.tags ?? [],
    ...(input.cssScope ? { cssScope: input.cssScope } : {}),
  };
  return { ...meta, css: input.css, render: input.render };
}

/** Strip the runtime parts of a definition, leaving server-safe metadata. */
export function toMeta(tpl: TemplateDefinition): TemplateMeta {
  const { css: _css, render: _render, ...meta } = tpl;
  return meta;
}
