import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// The store reads RESUME_DATA_DIR on import; isolate before any src import.
const dataDir = await mkdtemp(path.join(tmpdir(), "resume-mcp-audit-"));
process.env.RESUME_DATA_DIR = dataDir;

const { defaultResume } = await import("../src/data/defaultResume");
const { migrateDocument } = await import("../src/lib/migrate");
const { auditDocument, MAX_ISSUES } = await import("../src/mcp/audit");

function audit(input: unknown) {
  const normalized = migrateDocument(input);
  assert.ok(normalized, "test input must be a migratable document");
  return auditDocument(input, normalized);
}

test("minimal document reports demo-filled keys", () => {
  const result = audit({ header: {}, experience: {} });

  assert.ok(result.counts.filled > 0, "missing top-level keys should be reported as filled");
  const paths = result.issues.map((issue) => issue.path);
  assert.ok(paths.includes("templateId"), "templateId should be reported as filled");
  assert.ok(paths.includes("header.brand"), "header.brand should be reported as filled");
  assert.ok(result.counts.filled >= 10, `expected many filled keys, got ${result.counts.filled}`);
  assert.ok(result.counts.coerced === 0 && result.counts.dropped === 0);
});

test("auto-managed version key is never reported", () => {
  const result = audit({ header: {}, experience: {} });
  for (const issue of result.issues) {
    assert.notEqual(issue.path, "version");
  }
});

test("losslessly coerced scalars are reported as coerced", () => {
  const input = { header: { nameZh: 123 }, experience: {} };
  const result = audit(input);

  const coerced = result.issues.find((issue) => issue.kind === "coerced" && issue.path === "header.nameZh");
  assert.ok(coerced, "header.nameZh number→string should be reported");
  assert.equal(coerced && coerced.kind === "coerced" ? coerced.from : "", "number");
  assert.equal(coerced && coerced.kind === "coerced" ? coerced.to : "", "string");
});

test("non-conforming array rows are reported as dropped", () => {
  const job = defaultResume.experience.jobs[0];
  const input = {
    ...structuredClone(defaultResume),
    experience: { ...defaultResume.experience, jobs: [job, "not-a-job"] },
  };
  const result = audit(input);

  const dropped = result.issues.find((issue) => issue.kind === "dropped" && issue.path === "experience.jobs");
  assert.ok(dropped, "dropped rows should be reported");
  assert.equal(dropped && dropped.kind === "dropped" ? dropped.count : 0, 1);
});

test("blank fills inside array rows are not reported", () => {
  const input = {
    ...structuredClone(defaultResume),
    experience: { ...defaultResume.experience, jobs: [{}] },
  };
  const result = audit(input);

  for (const issue of result.issues) {
    assert.ok(!issue.path.startsWith("experience.jobs"), `unexpected issue under jobs: ${issue.path}`);
  }
});

test("unknown extra keys are carried over silently", () => {
  const result = audit({ header: {}, experience: {}, customNote: "keep me" });
  for (const issue of result.issues) {
    assert.notEqual(issue.path, "customNote");
  }
});

test("a fully conforming document has no issues", () => {
  const result = audit(structuredClone(defaultResume));
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.counts, { filled: 0, coerced: 0, dropped: 0 });
});

test("issue list is capped but counts stay complete", () => {
  const result = audit({ header: {}, experience: {} });
  if (result.counts.filled + result.counts.coerced + result.counts.dropped > MAX_ISSUES) {
    assert.equal(result.issues.length, MAX_ISSUES);
    assert.ok(result.counts.filled > result.issues.filter((issue) => issue.kind === "filled").length);
  }
});

test("cleanup temp data dir", async () => {
  await rm(dataDir, { recursive: true, force: true });
});
