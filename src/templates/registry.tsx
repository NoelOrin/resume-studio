import { TEMPLATE_CATALOG } from "./catalog";
import type { TemplateDefinition } from "./types";
import { IndustrialPage } from "./industrial/pages";
import { INDUSTRIAL_CSS } from "./industrial/styles";
import { MinimalPage } from "./minimal/MinimalPage";
import { MINIMAL_CSS } from "./minimal/styles";
import { MoonlightPage } from "./moonlight/MoonlightPage";
import { MOONLIGHT_CSS } from "./moonlight/styles";
import { QuietPage } from "./quiet/QuietPage";
import { QUIET_CSS } from "./quiet/styles";

// npm run tpl:new inserts imports for new templates above this line — do not remove

/**
 * Template registry. To add a template:
 *   1. create src/templates/<id>/ with a renderer + scoped CSS
 *   2. add an entry to src/templates/catalog.ts (metadata, page count)
 *   3. register its renderer here
 */
export const templates: TemplateDefinition[] = [
  {
    ...TEMPLATE_CATALOG[0],
    css: INDUSTRIAL_CSS,
    render: (data) => <IndustrialPage data={data} page={0} duplex={false} />,
  },
  {
    ...TEMPLATE_CATALOG[1],
    css: INDUSTRIAL_CSS,
    render: (data, page) => <IndustrialPage data={data} page={page} duplex />,
  },
  {
    ...TEMPLATE_CATALOG[2],
    css: MINIMAL_CSS,
    render: (data) => <MinimalPage data={data} />,
  },
  {
    ...TEMPLATE_CATALOG[3],
    css: MOONLIGHT_CSS,
    render: (data) => <MoonlightPage data={data} />,
  },
  {
    ...TEMPLATE_CATALOG[4],
    css: QUIET_CSS,
    render: (data) => <QuietPage data={data} />,
  },
  /* npm run tpl:new inserts new registrations above this line — do not remove */
];

export function getTemplate(id: string | undefined): TemplateDefinition {
  return templates.find((t) => t.id === id) ?? templates[0];
}

/** Unique CSS for every registered template (injected once). */
export const ALL_TEMPLATE_CSS: string = Array.from(new Set(templates.map((t) => t.css))).join("\n");

export function templateCssFor(id: string | undefined): string {
  return getTemplate(id).css;
}
