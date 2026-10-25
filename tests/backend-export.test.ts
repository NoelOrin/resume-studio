import test from "node:test";
import assert from "node:assert/strict";

const { toBase64, listArchiveLibrary, archiveClientArtifact, deleteArchiveItem } = await import("../src/lib/backend");
const { defaultResume } = await import("../src/data/defaultResume");

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
