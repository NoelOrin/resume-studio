import { test } from "node:test";
import assert from "node:assert/strict";

const { parseSseData, probeMcpEndpoint } = await import("../src/mcp/selftest");
import type { McpProbeResult } from "../src/mcp/selftest";

function sseResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/event-stream" },
  });
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(responses: Array<{ match: string; respond: () => Response }>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = responses.find((entry) => url.includes(entry.match));
    if (!match) throw new Error(`unexpected fetch: ${url}`);
    return match.respond();
  }) as typeof fetch;
}

test("parseSseData extracts JSON payloads from data lines", () => {
  const text = [
    ": keep-alive comment",
    "",
    'data: {"jsonrpc":"2.0","id":1,"result":{"a":1}}',
    "",
    "event: message",
    'data: {"jsonrpc":"2.0","id":2,"result":{"b":2}}',
    "",
  ].join("\n");

  const parsed = parseSseData(text);
  assert.deepEqual(parsed, [
    { jsonrpc: "2.0", id: 1, result: { a: 1 } },
    { jsonrpc: "2.0", id: 2, result: { b: 2 } },
  ]);
});

test("parseSseData skips malformed data lines", () => {
  // Two separate events: the first is not JSON, the second is.
  const parsed = parseSseData('data: not-json\n\ndata: {"id":3}\n');
  assert.deepEqual(parsed, [{ id: 3 }]);
  // Multiple data lines inside ONE event join into a single payload; a broken
  // join is not recoverable and yields nothing.
  assert.deepEqual(parseSseData('data: not-json\ndata: {"id":3}\n'), []);
});

test("probeMcpEndpoint reports a healthy endpoint over SSE and JSON", async () => {
  let calls = 0;
  const doFetch = (async () => {
    calls += 1;
    if (calls === 1) {
      return sseResponse(
        'data: {"jsonrpc":"2.0","id":1,"result":{"serverInfo":{"name":"resume-studio","version":"9.9.0"},"capabilities":{"tools":{}}}}\n\n',
      );
    }
    return jsonResponse({ jsonrpc: "2.0", id: 2, result: { tools: [{ name: "a" }, { name: "b" }] } });
  }) as typeof fetch;

  const probe = await probeMcpEndpoint("http://localhost:5173/api/mcp", { fetch: doFetch });

  assert.equal(calls, 2, "initialize + tools/list");
  assert.equal(probe.ok, true);
  assert.equal(probe.authRequired, false);
  assert.equal(probe.serverName, "resume-studio");
  assert.equal(probe.serverVersion, "9.9.0");
  assert.equal(probe.toolCount, 2);
  assert.ok(probe.initMs >= 0);
  assert.ok(probe.listMs >= 0);
  assert.equal(probe.error, null);
});

test("probeMcpEndpoint counts tools from tools/list", async () => {
  let calls = 0;
  const doFetch = (async () => {
    calls += 1;
    if (calls === 1) {
      return jsonResponse({
        jsonrpc: "2.0",
        id: 1,
        result: { serverInfo: { name: "resume-studio", version: "1.0" } },
      });
    }
    return jsonResponse({
      jsonrpc: "2.0",
      id: 2,
      result: { tools: [{ name: "a" }, { name: "b" }, { name: "c" }] },
    });
  }) as typeof fetch;

  const probe = await probeMcpEndpoint("http://localhost:5173/api/mcp", { fetch: doFetch });
  assert.equal(probe.ok, true);
  assert.equal(probe.toolCount, 3);
});

test("probeMcpEndpoint flags 401 as endpoint-reachable but token-protected", async () => {
  const doFetch = stubFetch([{ match: "/api/mcp", respond: () => jsonResponse({}, 401) }]);
  const probe = await probeMcpEndpoint("http://localhost:5173/api/mcp", { fetch: doFetch });

  assert.equal(probe.ok, false);
  assert.equal(probe.authRequired, true);
  assert.equal(probe.httpStatus, 401);
  assert.ok(probe.error);
});

test("probeMcpEndpoint reports other HTTP errors", async () => {
  const doFetch = stubFetch([{ match: "/api/mcp", respond: () => jsonResponse({}, 403) }]);
  const probe = await probeMcpEndpoint("http://localhost:5173/api/mcp", { fetch: doFetch });

  assert.equal(probe.ok, false);
  assert.equal(probe.authRequired, false);
  assert.equal(probe.httpStatus, 403);
  assert.match(probe.error ?? "", /403/);
});

test("probeMcpEndpoint reports network failures without a status", async () => {
  const doFetch = (async () => {
    throw new Error("Failed to fetch");
  }) as typeof fetch;

  const probe = await probeMcpEndpoint("http://localhost:5173/api/mcp", { fetch: doFetch });
  assert.equal(probe.ok, false);
  assert.equal(probe.httpStatus, null);
  assert.match(probe.error ?? "", /Failed to fetch/);
});

test("probeMcpEndpoint passes the signal through to fetch", async () => {
  const seen: AbortSignal[] = [];
  const doFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    seen.push(init?.signal as AbortSignal);
    return jsonResponse({
      jsonrpc: "2.0",
      id: 1,
      result: { serverInfo: { name: "x", version: "1" } },
    });
  }) as typeof fetch;

  const controller = new AbortController();
  await probeMcpEndpoint("http://localhost:5173/api/mcp", { fetch: doFetch, signal: controller.signal });
  assert.equal(seen.length, 2);
  assert.equal(seen[0], controller.signal);
});

// Type-level guard: the probe result shape is part of the settings-page contract.
const _shapeCheck: McpProbeResult = {
  ok: false,
  authRequired: false,
  httpStatus: null,
  serverName: null,
  serverVersion: null,
  toolCount: null,
  initMs: 0,
  listMs: 0,
  error: null,
};
void _shapeCheck;
