/**
 * Structural diff between a raw document input and its normalized form.
 *
 * `migrateDocument` silently fills missing keys with demo defaults, coerces
 * scalar types and drops non-conforming array rows. That is exactly the right
 * behavior for storage, but an AI client saving a hand-built document should
 * learn what was filled in — a publish built from demo content is a bad look.
 * `check_resume` reports these as `issues`; it never fails the write.
 */

export type ResumeIssue =
  | { kind: "filled"; path: string }
  | { kind: "coerced"; path: string; from: string; to: string }
  | { kind: "dropped"; path: string; count: number };

export type ResumeAudit = {
  /** Capped issue list (see MAX_ISSUES); ordering follows document shape. */
  issues: ResumeIssue[];
  /** Complete per-kind totals, uncapped. */
  counts: { filled: number; coerced: number; dropped: number };
};

export const MAX_ISSUES = 20;

/** `version` is rewritten by migrate on every document; reporting it is pure noise. */
const AUTO_MANAGED_KEYS = new Set(["version"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Compare `input` (what the caller sent) against `normalized` (what migration
 * produced). Only three differences matter:
 *
 * - filled  — object key absent from the input, demo-filled by migration
 *             (array rows are excluded: their blanks are the normal empty state)
 * - coerced — scalar changed type during normalization ("123" → 123)
 * - dropped — array rows the input had that normalization removed
 */
export function auditDocument(input: unknown, normalized: unknown): ResumeAudit {
  const issues: ResumeIssue[] = [];
  const counts = { filled: 0, coerced: 0, dropped: 0 };

  const record = (issue: ResumeIssue) => {
    counts[issue.kind] += 1;
    if (issues.length < MAX_ISSUES) issues.push(issue);
  };

  const walk = (inputValue: unknown, normalizedValue: unknown, path: string, inArrayRow: boolean): void => {
    if (Array.isArray(normalizedValue)) {
      const inputArray = Array.isArray(inputValue) ? inputValue : [];
      const droppedRows = inputArray.length - normalizedValue.length;
      if (droppedRows > 0) {
        record({ kind: "dropped", path, count: droppedRows });
      }
      const shared = Math.min(inputArray.length, normalizedValue.length);
      for (let index = 0; index < shared; index += 1) {
        walk(inputArray[index], normalizedValue[index], `${path}[${index}]`, true);
      }
      return;
    }

    if (isPlainObject(normalizedValue)) {
      const source = isPlainObject(inputValue) ? inputValue : {};
      for (const key of Object.keys(normalizedValue)) {
        if (AUTO_MANAGED_KEYS.has(key)) continue;
        const childPath = path ? `${path}.${key}` : key;
        if (!Object.prototype.hasOwnProperty.call(source, key) || source[key] === undefined) {
          // Inside array rows migration fills blanks, which is the normal empty
          // state, not a demo-content surprise worth reporting.
          if (!inArrayRow) record({ kind: "filled", path: childPath });
          continue;
        }
        walk(source[key], normalizedValue[key], childPath, inArrayRow);
      }
      return;
    }

    if (inputValue !== undefined && typeOf(inputValue) !== typeOf(normalizedValue)) {
      record({
        kind: "coerced",
        path,
        from: typeOf(inputValue),
        to: typeOf(normalizedValue),
      });
    }
  };

  walk(input, normalized, "", false);
  return { issues, counts };
}
