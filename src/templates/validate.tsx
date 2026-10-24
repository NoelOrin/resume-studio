import { Fragment, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ResumeData } from "../types";
import { PANEL_IDS, escapeRegExp, pageCountOf, previewDataFor, type TemplateDefinition } from "./types";

/**
 * Template authoring contract, enforced.
 *
 * Only tests and scripts may import this file: react-dom/server is banned in
 * the app's RSC runtime (see src/mcp/render.ts). It renders every page of a
 * template with the template's own catalog accent and checks the conventions
 * the editor depends on — see docs/template-authoring.md.
 */

export type TemplateIssue = { page: number; message: string };

export type TemplateValidation = {
  id: string;
  ok: boolean;
  /** page is 0-based; -1 means the issue is template-level (e.g. CSS scope). */
  issues: TemplateIssue[];
  pagesChecked: number;
};

export function validateTemplate(tpl: TemplateDefinition, base: ResumeData): TemplateValidation {
  const data = previewDataFor(tpl, base);
  const issues: TemplateIssue[] = [];
  const pageCount = pageCountOf(tpl, data);
  // Entries sharing another template's implementation render inside that
  // template's scope class (see TemplateMeta.cssScope).
  const scope = tpl.cssScope ?? tpl.id;

  for (let page = 0; page < pageCount; page++) {
    let markup: string;
    try {
      markup = renderToStaticMarkup(createElement(Fragment, null, tpl.render(data, page)));
    } catch (err) {
      issues.push({ page, message: `render threw: ${err instanceof Error ? err.message : String(err)}` });
      continue;
    }

    // The first element is the page root; pagination, scaling and print all
    // hang off `.tpl-page`, and per-template CSS hangs off `.t-<id>`.
    const rootAttrs = /^<([a-z]+)([^>]*)>/.exec(markup)?.[2] ?? "";
    const rootClass = /class="([^"]*)"/.exec(rootAttrs)?.[1] ?? "";
    const rootClasses = new Set(rootClass.split(/\s+/));
    if (!rootClasses.has("tpl-page")) {
      issues.push({ page, message: `root element is missing the "tpl-page" class (got "${rootClass || "(none)"}")` });
    }
    if (!rootClasses.has(`t-${scope}`)) {
      issues.push({ page, message: `root element is missing the "t-${scope}" scope class (got "${rootClass || "(none)"}")` });
    }

    // Overflow detection in the editor measures `.tpl-flow`; without it the
    // "超出 A4" warning can never fire for this page.
    if (!/class="[^"]*\btpl-flow\b/.test(markup)) {
      issues.push({ page, message: 'no ".tpl-flow" element — page overflow detection is disabled for this page' });
    }

    for (const match of markup.matchAll(/data-panel="([^"]*)"/g)) {
      if (!(PANEL_IDS as readonly string[]).includes(match[1])) {
        issues.push({
          page,
          message: `unknown data-panel "${match[1]}" (expected one of: ${PANEL_IDS.join(", ")})`,
        });
      }
    }
  }

  // Template CSS must scope everything under .t-<id>: all template CSS is
  // injected side by side, so unscoped selectors would bleed across templates.
  if (!new RegExp(`\\.t-${escapeRegExp(scope)}\\b`).test(tpl.css)) {
    issues.push({ page: -1, message: `css does not scope anything under ".t-${scope}" — selectors would leak into other templates` });
  }

  return { id: tpl.id, ok: issues.length === 0, issues, pagesChecked: pageCount };
}
