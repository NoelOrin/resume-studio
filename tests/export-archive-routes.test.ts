import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(tmpdir(), "resume-routes-"));
process.env.RESUME_DATA_DIR = dataDir;

const { defaultResume } = await import("../src/data/defaultResume");
const { POST: postExport } = await import("../app/api/export/[format]/route");
const { GET: listRoute, POST: postArchive, DELETE: clearRoute } = await import("../app/api/archive/route");
const { GET: getArchive, DELETE: deleteArchiveRoute } = await import("../app/api/archive/[id]/route");
const { listArchives, clearArchives } = await import("../src/server/archive");
const { probeBrowserBin } = await import("../src/server/artifacts");

test.after(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

const BASE = "http://localhost";
const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });

/* ---------------- /api/export/[format] ---------------- */

test("export rejects unknown formats with 404", async () => {
  const res = await postExport(
    new Request(`${BASE}/api/export/txt`, {
      method: "POST",
      body: JSON.stringify({ data: defaultResume, title: "t" }),
    }),
    ctx({ format: "txt" }),
  );
  assert.equal(res.status, 404);
});

test("export rejects non-document payloads with 400", async () => {
  const res = await postExport(
    new Request(`${BASE}/api/export/pdf`, {
      method: "POST",
      body: JSON.stringify({ data: { nope: 1 }, title: "t" }),
    }),
    ctx({ format: "pdf" }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error?: string };
  assert.match(body.error ?? "", /document|简历/i);
});

const realBrowser = probeBrowserBin();
test(
  "export pdf returns the file, archives it and reports the page count",
  { skip: realBrowser ? false : "no chromium browser on this machine" },
  async () => {
    await clearArchives();
    const res = await postExport(
      new Request(`${BASE}/api/export/pdf`, {
        method: "POST",
        body: JSON.stringify({ data: defaultResume, title: "林知远 · 简历", docId: "doc-a" }),
      }),
      ctx({ format: "pdf" }),
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");
    assert.ok(res.headers.get("content-disposition")?.includes("attachment"));
    assert.ok(res.headers.get("x-archive-id"), "successful export is archived");
    assert.equal(res.headers.get("x-pages"), "1");
    const bytes = new Uint8Array(await res.arrayBuffer());
    assert.equal(String.fromCharCode(...bytes.subarray(0, 4)), "%PDF");

    const list = await listArchives();
    assert.equal(list.length, 1);
    assert.equal(list[0].format, "pdf");
    assert.equal(list[0].docId, "doc-a");
  },
);

test(
  "export png archives an image artifact",
  { skip: realBrowser ? false : "no chromium browser on this machine" },
  async () => {
    const res = await postExport(
      new Request(`${BASE}/api/export/png`, {
        method: "POST",
        body: JSON.stringify({ data: defaultResume, title: "简历" }),
      }),
      ctx({ format: "png" }),
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/png");
    assert.ok((await listArchives()).some((entry) => entry.format === "png"));
  },
);

/* ---------------- /api/archive ---------------- */

test("client artifacts can be archived and read back", async () => {
  await clearArchives();
  const content = JSON.stringify(defaultResume, null, 2);
  const created = await postArchive(
    new Request(`${BASE}/api/archive`, {
      method: "POST",
      body: JSON.stringify({
        title: "客户端导出",
        format: "json",
        filename: "简历.json",
        content: Buffer.from(content, "utf8").toString("base64"),
        templateId: defaultResume.templateId,
      }),
    }),
  );
  assert.equal(created.status, 201);
  const { id } = (await created.json()) as { id: string };

  const listed = await listRoute();
  const { archives } = (await listed.json()) as { archives: { id: string; format: string }[] };
  assert.equal(archives.length, 1);
  assert.equal(archives[0].id, id);
  assert.equal(archives[0].format, "json");

  const download = await getArchive(new Request(`${BASE}/api/archive/${id}`), ctx({ id }));
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("content-type"), "application/json");
  assert.ok(download.headers.get("content-disposition")?.includes("attachment"));
  assert.equal(await download.text(), content);
});

test("archive post validates its payload", async () => {
  const badFormat = await postArchive(
    new Request(`${BASE}/api/archive`, {
      method: "POST",
      body: JSON.stringify({ format: "exe", filename: "a", content: "eA==" }),
    }),
  );
  assert.equal(badFormat.status, 400);

  const missing = await postArchive(
    new Request(`${BASE}/api/archive`, { method: "POST", body: JSON.stringify({ format: "json" }) }),
  );
  assert.equal(missing.status, 400);
});

test("a single archive can be deleted, and ?all=1 clears the rest", async () => {
  await clearArchives();
  const one = await postArchive(
    new Request(`${BASE}/api/archive`, {
      method: "POST",
      body: JSON.stringify({ format: "html", filename: "a.html", content: Buffer.from("<b>hi</b>").toString("base64") }),
    }),
  );
  const { id } = (await one.json()) as { id: string };
  const removed = await deleteArchiveRoute(new Request(`${BASE}/api/archive/${id}`, { method: "DELETE" }), ctx({ id }));
  assert.equal(removed.status, 200);
  const missing = await getArchive(new Request(`${BASE}/api/archive/${id}`), ctx({ id }));
  assert.equal(missing.status, 404);

  const refused = await clearRoute(new Request(`${BASE}/api/archive`, { method: "DELETE" }));
  assert.equal(refused.status, 400, "delete without ?all=1 is refused");

  await postArchive(
    new Request(`${BASE}/api/archive`, {
      method: "POST",
      body: JSON.stringify({ format: "json", filename: "b.json", content: "MQ==" }),
    }),
  );
  const cleared = await clearRoute(new Request(`${BASE}/api/archive?all=1`, { method: "DELETE" }));
  assert.equal(cleared.status, 200);
  const { archives } = (await (await listRoute()).json()) as { archives: unknown[] };
  assert.equal(archives.length, 0);
});
