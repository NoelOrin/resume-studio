import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// The store reads RESUME_DATA_DIR on import, so isolate the data directory first.
const dataDir = await mkdtemp(path.join(tmpdir(), "resume-mcp-tools-"));
process.env.RESUME_DATA_DIR = dataDir;

const { defaultResume } = await import("../src/data/defaultResume");
const {
  checkResume,
  deleteResume,
  duplicateResume,
  getResume,
  listResumes,
  patchResume,
  publishResume,
  renderResume,
  saveResume,
} = await import("../src/mcp/tools");
const { McpToolError } = await import("../src/mcp/util");

function jsonOf(result: CallToolResult): Record<string, any> {
  const block = result.content?.find((item) => item.type === "text");
  assert.ok(block && block.type === "text", "tool result should contain a text block");
  return JSON.parse(block.text);
}

test("save_resume creates a document with a generated id", async () => {
  const result = await saveResume({ title: "林知远 · 全栈开发工程师", data: defaultResume });
  const body = jsonOf(result);
  assert.equal(body.ok, true);
  assert.equal(body.created, true);
  assert.match(body.id, /^[a-z0-9][a-z0-9-]{0,63}$/);
  assert.equal(body.templateId, "industrial");
  assert.equal(body.title, "林知远 · 全栈开发工程师");
});

test("list_resumes and get_resume round-trip the stored document", async () => {
  const saved = jsonOf(await saveResume({ id: "lin-zhiyuan", title: "林知远", data: defaultResume }));
  assert.equal(saved.created, false);

  const list = jsonOf(await listResumes());
  assert.equal(list.count, 2);
  assert.ok(list.docs.some((doc: { id: string }) => doc.id === "lin-zhiyuan"));

  const got = jsonOf(await getResume("lin-zhiyuan"));
  assert.equal(got.id, "lin-zhiyuan");
  assert.equal(got.template.id, "industrial");
  assert.equal(got.data.header.nameZh, defaultResume.header.nameZh);
  assert.deepEqual(got.data.theme, defaultResume.theme);
});

test("patch_resume merges nested objects and keeps untouched fields", async () => {
  const before = jsonOf(await getResume("lin-zhiyuan"));
  const patched = jsonOf(
    await patchResume({
      id: "lin-zhiyuan",
      patch: {
        header: { nameEn: "LIN ZY" },
        flags: { showFlow: false },
        theme: { accent: "#E0245E" },
      },
    }),
  );

  assert.equal(patched.data.header.nameEn, "LIN ZY");
  assert.equal(patched.data.header.nameZh, before.data.header.nameZh);
  assert.equal(patched.data.flags.showFlow, false);
  assert.equal(patched.data.flags.showYears, true);
  assert.equal(patched.data.theme.accent, "#E0245E");
  assert.equal(patched.data.experience.jobs.length, before.data.experience.jobs.length);
});

test("patch_resume rejects an invalid patch payload", async () => {
  await assert.rejects(
    () => patchResume({ id: "lin-zhiyuan", patch: [1, 2, 3] }),
    (error: unknown) => error instanceof McpToolError,
  );
});

test("render_resume_html renders a standalone multi-page document", async () => {
  const rendered = jsonOf(await renderResume({ id: "lin-zhiyuan" }));
  assert.equal(rendered.templateId, "industrial");
  assert.equal(rendered.pages, 1);
  assert.ok(rendered.bytes > 10_000, "HTML should include the inline template CSS");
  assert.ok(rendered.html.startsWith("<!doctype html>"));
  assert.match(rendered.html, /class="tpl-page/);
  assert.match(rendered.html, /\.tpl-page\{/);
  assert.match(rendered.html, new RegExp(defaultResume.header.nameZh));
});

test("render_resume_html can render inline data without saving", async () => {
  const rendered = jsonOf(
    await renderResume({
      data: { header: { nameZh: "临时文档" }, experience: {} },
      title: "临时文档",
    }),
  );
  assert.equal(rendered.pages, 1);
  assert.match(rendered.html, /临时文档/);
});

test("render_resume_html requires exactly one input", async () => {
  await assert.rejects(() => renderResume({ id: "lin-zhiyuan", data: defaultResume }), (e: unknown) => e instanceof McpToolError);
  await assert.rejects(() => renderResume({}), (e: unknown) => e instanceof McpToolError);
});

test("publish_resume writes the shareable HTML file", async () => {
  const published = jsonOf(await publishResume({ id: "lin-zhiyuan" }));
  assert.equal(published.ok, true);
  assert.equal(published.path, "/p/lin-zhiyuan");
  assert.equal(published.url, "/p/lin-zhiyuan");

  const html = await readFile(path.join(dataDir, "published", "lin-zhiyuan.html"), "utf8");
  assert.ok(html.startsWith("<!doctype html>"));
});

test("check_resume reports metadata without the html payload", async () => {
  const checked = jsonOf(await checkResume({ id: "lin-zhiyuan" }));
  assert.equal(checked.templateId, "industrial");
  assert.equal(checked.pages, 1);
  assert.ok(checked.bytes > 10_000);
  assert.equal(checked.title, "林知远");
  assert.ok(!("html" in checked), "check must not return the html payload");
  assert.deepEqual(checked.issues, [], "stored documents are already normalized");
});

test("check_resume reports issues for inline data", async () => {
  const checked = jsonOf(
    await checkResume({ data: { header: { nameZh: 123 }, experience: {} }, title: "体检" }),
  );
  assert.equal(checked.pages, 1);
  assert.ok(checked.issueCounts.filled > 0, "missing sections should be counted as filled");
  assert.ok(
    checked.issues.some((issue: { kind: string; path: string }) => issue.kind === "coerced" && issue.path === "header.nameZh"),
    "number nameZh should be reported as coerced",
  );
});

test("check_resume validates its input like render_resume_html", async () => {
  await assert.rejects(() => checkResume({ id: "lin-zhiyuan", data: defaultResume }), (e: unknown) => e instanceof McpToolError);
  await assert.rejects(() => checkResume({}), (e: unknown) => e instanceof McpToolError);
  await assert.rejects(() => checkResume({ id: "does-not-exist" }), (e: unknown) => e instanceof McpToolError);
});

test("duplicate_resume copies a document under a new id", async () => {
  const dup = jsonOf(await duplicateResume({ id: "lin-zhiyuan", title: "副本测试" }));
  assert.equal(dup.ok, true);
  assert.equal(dup.sourceId, "lin-zhiyuan");
  assert.match(dup.id, /^[a-z0-9][a-z0-9-]{0,63}$/);
  assert.notEqual(dup.id, "lin-zhiyuan");

  const copy = jsonOf(await getResume(dup.id));
  assert.equal(copy.title, "副本测试");
  assert.equal(copy.data.header.nameZh, defaultResume.header.nameZh);

  const source = jsonOf(await getResume("lin-zhiyuan"));
  assert.equal(source.id, "lin-zhiyuan", "source must stay untouched");
});

test("duplicate_resume defaults the title to 原标题 · 副本", async () => {
  const dup = jsonOf(await duplicateResume({ id: "lin-zhiyuan", newId: "lin-zhiyuan-copy" }));
  assert.equal(dup.id, "lin-zhiyuan-copy");
  assert.equal(dup.title, "林知远 · 副本");
});

test("duplicate_resume refuses to overwrite an existing id", async () => {
  await assert.rejects(
    () => duplicateResume({ id: "lin-zhiyuan", newId: "lin-zhiyuan-copy" }),
    (e: unknown) => e instanceof McpToolError,
  );
});

test("duplicate_resume validates source and target ids", async () => {
  await assert.rejects(() => duplicateResume({ id: "does-not-exist" }), (e: unknown) => e instanceof McpToolError);
  await assert.rejects(() => duplicateResume({ id: "Bad Id!" }), (e: unknown) => e instanceof McpToolError);
  await assert.rejects(
    () => duplicateResume({ id: "lin-zhiyuan", newId: "Bad Id!" }),
    (e: unknown) => e instanceof McpToolError,
  );
});

test("list_resumes filters by template and query, and sorts", async () => {
  await saveResume({
    id: "minimal-doc",
    title: "Minimal Doc",
    data: { ...structuredClone(defaultResume), templateId: "minimal" },
  });

  const byTemplate = jsonOf(await listResumes({ templateId: "minimal" }));
  assert.equal(byTemplate.count, 1);
  assert.equal(byTemplate.docs[0].id, "minimal-doc");

  const byQuery = jsonOf(await listResumes({ query: "MINIMAL" }));
  assert.equal(byQuery.count, 1, "query should match titles case-insensitively");

  const titleAsc = jsonOf(await listResumes({ sort: "title-asc" }));
  const titles = titleAsc.docs.map((doc: { title: string }) => doc.title);
  const sorted = [...titles].sort((a, b) => a.localeCompare(b, "zh"));
  assert.deepEqual(titles, sorted);

  const updatedAsc = jsonOf(await listResumes({ sort: "updatedAt-asc" }));
  const times = updatedAsc.docs.map((doc: { updatedAt: string | null }) => doc.updatedAt ?? "");
  assert.deepEqual(times, [...times].sort());

  await assert.rejects(() => listResumes({ sort: "bogus" as never }), (e: unknown) => e instanceof McpToolError);
});

test("invalid ids and invalid documents fail with actionable errors", async () => {
  await assert.rejects(() => getResume("Bad Id!"), (error: unknown) => {
    assert.ok(error instanceof McpToolError);
    assert.match(error.message, /id/);
    return true;
  });
  await assert.rejects(
    () => saveResume({ title: "坏数据", data: { foo: 1 } }),
    (error: unknown) => error instanceof McpToolError,
  );
  await assert.rejects(() => getResume("does-not-exist"), (e: unknown) => e instanceof McpToolError);
});

test("delete_resume is idempotent", async () => {
  const first = jsonOf(await deleteResume("lin-zhiyuan"));
  assert.equal(first.deleted, true);
  const second = jsonOf(await deleteResume("lin-zhiyuan"));
  assert.equal(second.deleted, false);
  await assert.rejects(() => getResume("lin-zhiyuan"), (e: unknown) => e instanceof McpToolError);
});

test("cleanup temp data dir", async () => {
  await rm(dataDir, { recursive: true, force: true });
});
