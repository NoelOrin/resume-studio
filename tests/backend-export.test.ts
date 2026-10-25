import test from "node:test";
import assert from "node:assert/strict";

const {
  filenameFromDisposition,
  toBase64,
  NoBrowserExportError,
  exportArtifact,
  listArchiveLibrary,
  archiveClientArtifact,
  deleteArchiveItem,
} = await import("../src/lib/backend");
const { defaultResume } = await import("../src/data/defaultResume");

test("filenameFromDisposition prefers the RFC 5987 encoded name", () => {
  assert.equal(
    filenameFromDisposition(`attachment; filename="__.pdf"; filename*=UTF-8''${encodeURIComponent("简历.pdf")}`),
    "简历.pdf",
  );
});

test("filenameFromDisposition falls back to the ASCII name", () => {
  assert.equal(filenameFromDisposition('attachment; filename="resume.pdf"'), "resume.pdf");
});

test("filenameFromDisposition returns null without any name", () => {
  assert.equal(filenameFromDisposition("attachment"), null);
  assert.equal(filenameFromDisposition(""), null);
});

test("toBase64 encodes utf-8 the same way Node does", () => {
  assert.equal(toBase64("中文 abc"), Buffer.from("中文 abc", "utf8").toString("base64"));
});

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

const originalFetch = globalThis.fetch;

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("exportArtifact posts the document and returns the artifact", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="r.pdf"; filename*=UTF-8''${encodeURIComponent("简历.pdf")}`,
        "x-pages": "1",
        "x-archive-id": "abc-1",
      },
    });
  }) as typeof fetch;

  const result = await exportArtifact("pdf", { data: defaultResume, title: "简历", docId: "doc-1" });
  assert.equal(result.filename, "简历.pdf");
  assert.equal(result.pages, 1);
  assert.equal(await result.blob.text(), "%PDF");
  assert.equal(calls[0].url, "/api/export/pdf");
  assert.equal(calls[0].init.method, "POST");
  const body = JSON.parse(String(calls[0].init.body)) as { data: unknown; title: string; docId: string };
  assert.equal(body.title, "简历");
  assert.equal(body.docId, "doc-1");
  assert.ok(body.data);
});

test("exportArtifact surfaces NO_BROWSER as a typed error", async () => {
  globalThis.fetch = (async () => jsonResponse(503, { error: "未找到浏览器", code: "NO_BROWSER" })) as typeof fetch;
  await assert.rejects(
    exportArtifact("png", { data: defaultResume, title: "t" }),
    (error: unknown) => error instanceof NoBrowserExportError,
  );
});

test("archive helpers hit the right endpoints", async () => {
  const seen: { url: string; method?: string }[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    seen.push({ url: String(url), method: init?.method });
    if (String(url).startsWith("/api/archive") && !init?.method) {
      return jsonResponse(200, { archives: [{ id: "a1", format: "json", title: "t", filename: "t.json", bytes: 3, createdAt: "2026" }] });
    }
    return jsonResponse(201, { ok: true, id: "new-1" });
  }) as typeof fetch;

  const { archives } = await listArchiveLibrary();
  assert.equal(archives.length, 1);
  assert.equal(archives[0].id, "a1");

  await archiveClientArtifact({ format: "json", filename: "t.json", content: "{}", title: "t", templateId: defaultResume.templateId });
  const archived = seen.find((call) => call.url === "/api/archive" && call.method === "POST");
  assert.ok(archived, "client artifact archiving posts to /api/archive");
  assert.equal(archived.method, "POST");

  await deleteArchiveItem("a1");
  assert.deepEqual(seen.at(-1), { url: "/api/archive/a1", method: "DELETE" });
});
