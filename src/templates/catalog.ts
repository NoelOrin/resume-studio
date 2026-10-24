import { toMeta } from "./factory";
import { templates } from "./registry";
import type { TemplateMeta } from "./types";

/**
 * Server-safe catalog metadata, derived from the registry (the single source
 * of truth — every template is one defineTemplate() call there). Import this
 * when you need metadata without the render machinery; it still transitively
 * loads the registry, which is fine on the server (no react-dom/server).
 */
export const TEMPLATE_CATALOG: TemplateMeta[] = templates.map(toMeta);

export function catalogEntry(id: string | undefined): TemplateMeta {
  return TEMPLATE_CATALOG.find((t) => t.id === id) ?? TEMPLATE_CATALOG[0];
}
