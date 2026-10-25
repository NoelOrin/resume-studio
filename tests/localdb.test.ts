import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// db.ts / store.ts resolve RESUME_DATA_DIR at import; isolate before any src import.
const dataDir = await mkdtemp(path.join(tmpdir(), "resume-localdb-"));
process.env.RESUME_DATA_DIR = dataDir;

const { defaultResume } = await import("../src/data/defaultResume");

// Pre-SQLite layout, written before the first store call: simulates upgrading
// an install whose JSON file store already exists when the db first opens.
await mkdir(path.join(dataDir, "docs"), { recursive: true });
await mkdir(path.join(dataDir, "published"), { recursive: true });
await writeFile(
  path.join(dataDir, "docs", "legacy-doc.json"),
  JSON.stringify({ id: "legacy-doc", title: "旧文件简历", updatedAt: "2026-10-01T00:00:00.000Z", data: defaultResume }),
  "utf8",
);
await writeFile(path.join(dataDir, "published", "legacy-page.html"), "<!doctype html><p>旧发布页</p>", "utf8");

const { closeDb, dbPath, getKv, setKv, delKv } = await import("../src/server/db");
const { deleteDoc, listDocs, publishedIds, readDoc, readPublished, writeDoc, writePublished } = await import(
  "../src/server/store"
);
const { readPrefs, readWorkspace, savePrefs, saveWorkspace } = await import("../src/server/workspace");

test("kv round-trips and deletes", async () => {
  assert.equal(await getKv("probe"), null);
  await setKv("probe", "one");
  assert.equal(await getKv("probe"), "one");
  await setKv("probe", "two");
  assert.equal(await getKv("probe"), "two");
  await delKv("probe");
  assert.equal(await getKv("probe"), null);
});

test("dbPath stays inside the data dir", () => {
  assert.equal(path.dirname(dbPath()), dataDir);
  assert.ok(dbPath().endsWith("resume-studio.db"));
});

test("writeDoc/readDoc round-trip and upsert", async () => {
  const first = await writeDoc("round-trip", "林知远 · 全栈", defaultResume);
  assert.equal(first.id, "round-trip");
  assert.equal(first.templateId, defaultResume.templateId);

  const read = await readDoc("round-trip");
  assert.ok(read);
  assert.equal(read.title, "林知远 · 全栈");
  assert.deepEqual(read.data.theme, defaultResume.theme);
  assert.equal(read.data.header.nameZh, defaultResume.header.nameZh);

  const second = await writeDoc("round-trip", "改名了", defaultResume);
  assert.equal(second.title, "改名了");
  const reread = await readDoc("round-trip");
  assert.equal(reread?.title, "改名了");

  assert.equal(await readDoc("not-a-valid id!"), null);
  await assert.rejects(() => writeDoc("bad-data", "坏数据", { foo: 1 } as never), /invalid document/);
});

test("listDocs sorts newest first", async () => {
  await writeDoc("older", "旧文档", defaultResume);
  await new Promise((resolve) => setTimeout(resolve, 5));
  await writeDoc("newer", "新文档", defaultResume);
  const docs = await listDocs();
  assert.equal(docs[0].id, "newer");
  assert.ok(docs.some((doc) => doc.id === "older"));
});

test("deleteDoc removes the row and stays quiet for unknown ids", async () => {
  await writeDoc("doomed", "待删除", defaultResume);
  await deleteDoc("doomed");
  assert.equal(await readDoc("doomed"), null);
  await deleteDoc("doomed"); // idempotent, no throw
});

test("published pages round-trip", async () => {
  await writePublished("pub-page", "<!doctype html><p>发布页</p>");
  assert.equal(await readPublished("pub-page"), "<!doctype html><p>发布页</p>");
  assert.ok((await publishedIds()).includes("pub-page"));
  await writePublished("pub-page", "<!doctype html><p>更新</p>");
  assert.equal(await readPublished("pub-page"), "<!doctype html><p>更新</p>");
});

test("workspace binds title + data + docId in one record", async () => {
  assert.equal(await readWorkspace(), null);

  const saved = await saveWorkspace({ title: "工作区", data: defaultResume, docId: "lin-zhiyuan" });
  assert.ok(saved.savedAt > 0);

  const read = await readWorkspace();
  assert.ok(read);
  assert.equal(read.title, "工作区");
  assert.equal(read.docId, "lin-zhiyuan");
  assert.equal(read.data.header.nameZh, defaultResume.header.nameZh);

  const normalised = await saveWorkspace({ title: "", data: defaultResume, docId: "" });
  assert.equal(normalised.title, "未命名简历");
  assert.equal(normalised.docId, null);

  await assert.rejects(() => saveWorkspace({ title: "坏", data: { foo: 1 } as never, docId: null }), /invalid document/);
});

test("prefs persist partially and null clears", async () => {
  assert.deepEqual(await readPrefs(), {});

  await savePrefs({ zoom: { mode: "manual", value: 1.25 } });
  await savePrefs({ pill: "2.4.0" });
  await savePrefs({ checkedAt: "2026-10-25" });
  assert.deepEqual(await readPrefs(), { zoom: { mode: "manual", value: 1.25 }, pill: "2.4.0", checkedAt: "2026-10-25" });

  await savePrefs({ pill: null });
  assert.equal((await readPrefs()).pill, undefined);
  assert.equal((await readPrefs()).checkedAt, "2026-10-25", "untouched fields survive a partial save");

  await assert.rejects(() => savePrefs({ zoom: { mode: "weird" } as never }), /invalid zoom/);
});

test("legacy JSON files import exactly once", async () => {
  // Files were laid out before the first store call (see top of file); the
  // first docs listing picks them up.
  const docs = await listDocs();
  assert.ok(docs.some((doc) => doc.id === "legacy-doc" && doc.title === "旧文件简历"));
  assert.equal(await readPublished("legacy-page"), "<!doctype html><p>旧发布页</p>");

  // Re-writing the legacy file must not resurrect over the imported row.
  await writeFile(
    path.join(dataDir, "docs", "legacy-doc.json"),
    JSON.stringify({ id: "legacy-doc", title: "改过的旧文件", updatedAt: "2026-10-02T00:00:00.000Z", data: defaultResume }),
    "utf8",
  );
  const docsAgain = await listDocs();
  const row = docsAgain.find((doc) => doc.id === "legacy-doc");
  assert.equal(row?.title, "旧文件简历", "import runs once, later file edits are ignored");
});

test("close db and clean up", async () => {
  await closeDb();
  await rm(dataDir, { recursive: true, force: true });
});
