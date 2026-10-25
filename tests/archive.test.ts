import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(tmpdir(), "resume-archive-"));
process.env.RESUME_DATA_DIR = dataDir;

const {
  MAX_ARCHIVE_BYTES,
  listArchives,
  writeArchive,
  readArchive,
  deleteArchive,
  clearArchives,
} = await import("../src/server/archive");

test.after(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

test("writeArchive round-trips a record and lists newest first", async () => {
  const json = JSON.stringify({ hello: "world" });
  const first = await writeArchive("json", "简历 A.json", json, { title: "简历 A" });
  await new Promise((resolve) => setTimeout(resolve, 10));
  const second = await writeArchive("html", "简历 B.html", "<b>中文</b>", {
    title: "简历 B",
    templateId: "quiet",
  });

  assert.match(first.id, /^[a-z0-9][a-z0-9-]{0,63}$/, "archive id must be a valid server id");
  const list = await listArchives();
  assert.equal(list.length, 2);
  assert.equal(list[0].id, second.id, "newest first");
  assert.equal(list[0].format, "html");
  assert.equal(list[0].templateId, "quiet");
  assert.equal(list[1].format, "json");
  assert.equal(list[1].bytes, Buffer.byteLength(json, "utf8"));

  const stored = await readArchive(first.id);
  assert.ok(stored, "written archive must be readable");
  assert.equal(stored.content.toString("utf8"), json);
  assert.equal(stored.record.title, "简历 A");
});

test("byte size counts utf-8 bytes, not characters", async () => {
  const record = await writeArchive("html", "中文.html", "中文", { title: "t" });
  assert.equal(record.bytes, 6);
});

test("readArchive returns null for unknown ids", async () => {
  assert.equal(await readArchive("nope"), null);
});

test("deleteArchive drops the file and the index entry", async () => {
  const record = await writeArchive("pdf", "a.pdf", "%PDF-1.7", { title: "t" });
  await deleteArchive(record.id);
  assert.equal(await readArchive(record.id), null);
  assert.ok(!(await listArchives()).some((entry) => entry.id === record.id));
});

test("clearArchives empties the library", async () => {
  await writeArchive("png", "a.png", "png", { title: "t" });
  await clearArchives();
  assert.equal((await listArchives()).length, 0);
});

test("writeArchive rejects formats outside the whitelist", async () => {
  await assert.rejects(
    writeArchive("exe" as never, "a.exe", "x", { title: "t" }),
    /format/,
  );
});

test("writeArchive rejects content above the size cap", async () => {
  const huge = Buffer.alloc(MAX_ARCHIVE_BYTES + 1, 46);
  await assert.rejects(writeArchive("pdf", "big.pdf", huge, { title: "t" }), /too large|20/i);
});

test("writeArchive sanitizes the display name and forces the canonical extension", async () => {
  const record = await writeArchive("json", "../../etc/passwd.json", "1", { title: "t" });
  assert.ok(!record.filename.includes("/"), "stored filename must be a bare name");
  assert.ok(record.filename.endsWith(".json"), "canonical extension is appended");
  const stored = await readArchive(record.id);
  assert.ok(stored, "sanitized archive is still readable");
});
