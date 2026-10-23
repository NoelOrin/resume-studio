import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(tmpdir(), "resume-mcp-logging-"));
process.env.RESUME_DATA_DIR = dataDir;

const { runTool, toolJson, McpToolError } = await import("../src/mcp/util");
const { handleMcpRequest } = await import("../src/mcp/handler");

function initRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:5173/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "logging-test", version: "1.0.0" },
      },
    }),
  });
}

test("runTool logs one JSON line per successful call", async (t) => {
  const log = t.mock.method(console, "log", () => {});

  const result = await runTool("save_resume", async () => toolJson({ ok: true }));
  assert.equal(result.isError, undefined);

  assert.equal(log.mock.calls.length, 1, "exactly one log line");
  const line = JSON.parse(String(log.mock.calls[0].arguments[0]));
  assert.equal(line.tool, "save_resume");
  assert.equal(line.ok, true);
  assert.equal(typeof line.ms, "number");
  assert.ok(line.ts, "timestamp present");
});

test("runTool logs tool errors as ok=false", async (t) => {
  const log = t.mock.method(console, "log", () => {});

  const result = await runTool("patch_resume", async () => {
    throw new McpToolError("坏补丁");
  });
  assert.equal(result.isError, true);

  const line = JSON.parse(String(log.mock.calls[0].arguments[0]));
  assert.equal(line.tool, "patch_resume");
  assert.equal(line.ok, false);
  assert.equal(line.error, "坏补丁");
});

test("runTool logs unexpected exceptions with their message", async (t) => {
  const log = t.mock.method(console, "log", () => {});

  const result = await runTool("render_resume_html", async () => {
    throw new Error("boom");
  });
  assert.equal(result.isError, true);

  const line = JSON.parse(String(log.mock.calls[0].arguments[0]));
  assert.equal(line.ok, false);
  assert.equal(line.error, "boom");
});

test("rejected bearer tokens are logged as auth_denied", async (t) => {
  const log = t.mock.method(console, "log", () => {});
  process.env.RESUME_MCP_TOKEN = "secret-token";
  try {
    const response = await handleMcpRequest(initRequest());
    assert.equal(response.status, 401);
  } finally {
    delete process.env.RESUME_MCP_TOKEN;
  }

  const events = log.mock.calls.map((call) => JSON.parse(String(call.arguments[0])));
  const denied = events.find((entry) => entry.event === "auth_denied");
  assert.ok(denied, "auth denial should be logged");
  assert.ok(denied.ts);
});

test("rejected origins are logged as origin_denied", async (t) => {
  const log = t.mock.method(console, "log", () => {});

  const response = await handleMcpRequest(initRequest({ origin: "http://evil.example" }));
  assert.equal(response.status, 403);

  const events = log.mock.calls.map((call) => JSON.parse(String(call.arguments[0])));
  const denied = events.find((entry) => entry.event === "origin_denied");
  assert.ok(denied, "origin denial should be logged");
  assert.equal(denied.origin, "http://evil.example");
});

test("successful requests are not double-logged at the handler level", async (t) => {
  const log = t.mock.method(console, "log", () => {});

  const response = await handleMcpRequest(initRequest());
  assert.equal(response.status, 200);

  const events = log.mock.calls.map((call) => JSON.parse(String(call.arguments[0])));
  assert.equal(
    events.filter((entry) => entry.event).length,
    0,
    "handler should stay silent on success; tools log themselves",
  );
});

test("cleanup temp data dir", async () => {
  await rm(dataDir, { recursive: true, force: true });
});
