import { Fragment, isValidElement, type ReactNode } from "react";
import { EXPORT_PAGE_CSS, PAGE_CSS } from "../styles/pages";
import { getTemplate } from "../templates/registry";
import { pageCountOf } from "../templates/types";
import type { ResumeData } from "../types";

export type RenderedResume = {
  templateId: string;
  templateName: string;
  pages: number;
  bytes: number;
  html: string;
};

/**
 * The MCP endpoint runs inside vinext's React Server Components environment, where
 * `react-dom/server` is intentionally replaced by a module that throws. Templates are
 * pure functions of the document data, so we serialize their element tree ourselves
 * instead of borrowing a server renderer. It keeps the endpoint working in both
 * `vinext dev` (RSC) and the Node production build, with no extra dependency.
 */

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** SVG attributes are case-sensitive; everything else camelCase becomes kebab-case. */
const KEEP_CASE_ATTRS = new Set([
  "viewBox",
  "preserveAspectRatio",
  "gradientUnits",
  "gradientTransform",
  "patternUnits",
  "patternTransform",
  "clipPathUnits",
  "filterUnits",
  "markerWidth",
  "markerHeight",
  "refX",
  "refY",
  "textLength",
  "stdDeviation",
  "baseFrequency",
  "numOctaves",
  "spreadMethod",
  "startOffset",
]);

const ATTR_ALIASES: Record<string, string> = {
  className: "class",
  htmlFor: "for",
  xlinkHref: "xlink:href",
  xmlnsXlink: "xmlns:xlink",
};

/** CSS properties that accept unitless numbers (React appends `px` to everything else). */
const UNITLESS_CSS = new Set([
  "opacity",
  "z-index",
  "font-weight",
  "line-height",
  "flex",
  "flex-grow",
  "flex-shrink",
  "order",
  "zoom",
  "columns",
  "column-count",
  "grid-row",
  "grid-column",
  "aspect-ratio",
]);

function escapeText(value: string): string {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);
}

function escapeAttr(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}

function cssPropertyName(property: string): string {
  if (property.startsWith("--")) return property;
  return property.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function styleToCss(style: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [property, value] of Object.entries(style)) {
    if (value === null || value === undefined || value === "") continue;
    const name = cssPropertyName(property);
    const cssValue =
      typeof value === "number" && !UNITLESS_CSS.has(name) ? `${value}px` : String(value);
    parts.push(`${name}:${cssValue}`);
  }
  return parts.join(";");
}

function renderAttributes(props: Record<string, unknown>): string {
  let output = "";
  for (const [name, value] of Object.entries(props)) {
    if (name === "children" || name === "key" || name === "ref") continue;
    if (name === "dangerouslySetInnerHTML") continue;
    if (name === "style" && value && typeof value === "object") {
      const css = styleToCss(value as Record<string, unknown>);
      if (css) output += ` style="${escapeAttr(css)}"`;
      continue;
    }
    if (value === null || value === undefined || value === false) continue;
    const attribute = ATTR_ALIASES[name] ?? (KEEP_CASE_ATTRS.has(name) ? name : cssPropertyName(name));
    if (value === true) {
      output += ` ${attribute}=""`;
      continue;
    }
    output += ` ${attribute}="${escapeAttr(String(value))}"`;
  }
  return output;
}

function renderNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return escapeText(node);
  if (typeof node === "number") return String(node);
  if (typeof node === "bigint") return String(node);

  if (Array.isArray(node)) {
    let output = "";
    for (const child of node) output += renderNode(child as ReactNode);
    return output;
  }

  if (isValidElement(node)) {
    const { type, props } = node as { type: unknown; props: Record<string, unknown> };
    if (type === Fragment) return renderNode(props.children as ReactNode);
    if (typeof type === "function") {
      return renderNode((type as (input: unknown) => ReactNode)(props));
    }
    if (typeof type === "string") {
      const attributes = renderAttributes(props);
      if (VOID_ELEMENTS.has(type)) return `<${type}${attributes} />`;
      return `<${type}${attributes}>${renderNode(props.children as ReactNode)}</${type}>`;
    }
  }

  return escapeText(String(node));
}

/**
 * Render every page of the document's template to a standalone HTML file.
 *
 * Mirrors `buildStandaloneHtml` in src/lib/exporters.ts, which freezes the DOM the
 * editor already rendered: same templates, same CSS, same `.tpl-export` shell, no app JS.
 */
export function renderResumeHtml(data: ResumeData, title = "简历"): RenderedResume {
  const template = getTemplate(data.templateId);
  const pages = pageCountOf(template, data);

  let markup = "";
  for (let page = 0; page < pages; page += 1) {
    markup += renderNode(template.render(data, page));
  }

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeText(title)}</title>
<style>${PAGE_CSS}${template.css}${EXPORT_PAGE_CSS}</style>
</head>
<body>
<div class="tpl-export">
${markup}
</div>
</body>
</html>
`;

  return {
    templateId: template.id,
    templateName: template.name,
    pages,
    bytes: Buffer.byteLength(html, "utf8"),
    html,
  };
}
