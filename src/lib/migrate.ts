import { defaultResume } from "../data/defaultResume";
import type { ResumeData } from "../types";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Documents only ever hold JSON values, so a JSON copy is a safe deep clone. */
function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** An empty value of the same shape as `shape` (used to fill missing keys). */
function blankOf(shape: unknown): unknown {
  if (typeof shape === "string") return "";
  if (typeof shape === "number") return 0;
  if (typeof shape === "boolean") return false;
  if (Array.isArray(shape)) return [];
  if (isPlainObject(shape)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) out[key] = blankOf(shape[key]);
    return out;
  }
  return null;
}

/**
 * Coerce `input` to the shape of `shape`:
 *   - wrong scalar type    -> coerced when lossless, otherwise blank
 *   - wrong container type -> an empty container
 *   - array rows           -> normalised, non-conforming rows dropped
 *   - missing key          -> `fill` decides: the schema default at the document
 *     level (so legacy documents still migrate) or a blank inside an array row
 *     (so a user's row never inherits the demo content).
 * Keys the schema does not declare are carried over untouched, so nothing the
 * user typed is silently discarded.
 */
function normalizeLike(shape: unknown, input: unknown, fill: "default" | "blank"): unknown {
  if (typeof shape === "string") {
    if (typeof input === "string") return input;
    if (typeof input === "number" || typeof input === "boolean") return String(input);
    return "";
  }
  if (typeof shape === "number") {
    if (typeof input === "number" && Number.isFinite(input)) return input;
    if (typeof input === "string" && input.trim() !== "" && Number.isFinite(Number(input))) return Number(input);
    return 0;
  }
  if (typeof shape === "boolean") {
    return typeof input === "boolean" ? input : false;
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(input)) return [];
    if (shape.length === 0) return copy(input); // element shape unknown: keep as-is
    const rowShape = shape[0];
    const rows: unknown[] = [];
    for (const row of input) {
      if (isPlainObject(rowShape)) {
        // rows are objects: keep only objects, normalise each one
        if (isPlainObject(row)) rows.push(normalizeLike(rowShape, row, "blank"));
      } else if (typeof rowShape === "string") {
        // rows are scalars: keep only scalars, stringify the coercible ones
        if (typeof row === "string") rows.push(row);
        else if (typeof row === "number" || typeof row === "boolean") rows.push(String(row));
      } else {
        rows.push(normalizeLike(rowShape, row, "blank"));
      }
    }
    return rows;
  }
  if (isPlainObject(shape)) {
    const source = isPlainObject(input) ? input : {};
    const out: Record<string, unknown> = { ...source };
    for (const key of Object.keys(shape)) {
      const present = Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined;
      if (present) out[key] = normalizeLike(shape[key], source[key], fill);
      else out[key] = fill === "blank" ? blankOf(shape[key]) : copy(shape[key]);
    }
    return out;
  }
  return copy(shape);
}

/**
 * Accepts data from localStorage / JSON import / server / MCP and normalises it
 * to the current document version (v2 adds `templateId` for the multi-template
 * system).
 *
 * Every entry path funnels through here, so this is also the boundary that keeps
 * a malformed document from reaching `.map` / `.split` / `.toLowerCase` in the
 * templates and sections — a wrong-typed field used to white-screen the editor,
 * or return HTTP 500 for `?doc=<id>` because the crash happened during SSR.
 */
export function migrateDocument(input: unknown): ResumeData | null {
  if (!isPlainObject(input)) return null;
  if (!input.header || !input.experience) return null;

  const normalized = normalizeLike(defaultResume, input, "default") as ResumeData;
  return {
    ...normalized,
    version: 2,
    templateId:
      typeof normalized.templateId === "string" && normalized.templateId ? normalized.templateId : "industrial",
  };
}
