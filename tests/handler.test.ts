import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(tmpdir(), "resume-mcp-http-"));
process.env.RESUME_DATA_DIR = dataDir;

const { handleMcpOptions, handleMcpRequest } = await import("../src/mcp/handler");

const INIT_PARAMS = {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "handler-test", version: "1.0.0" },
};

function initRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:5173/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: INIT_PARAMS }),
  });
}

function parseMessages(contentType: string, text: string): any[] {
  if (!contentType.includes("text/event-stream")) return [JSON.parse(text)];
  return text
    .split("\n\n")
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join(""),
    )
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("requests without a bearer token are rejected when RESUME_MCP_TOKEN is set", async () => {
  process.env.RESUME_MCP_TOKEN = "secret-token";
  try {
    const response = await handleMcpRequest(initRequest());
    assert.equal(response.status, 401);
    assert.match(response.headers.get("www-authenticate") ?? "", /^Bearer/);
    const body = await response.json();
    assert.equal(body.error.code, -32001);
  } finally {
    delete process.env.RESUME_MCP_TOKEN;
  }
});

test("initialize succeeds with the configured bearer token and returns SSE or JSON", async () => {
  process.env.RESUME_MCP_TOKEN = "secret-token";
  try {
    const response = await handleMcpRequest(
      initRequest({ authorization: "Bearer secret-token" }),
    );
    assert.equal(response.status, 200);
    const messages = parseMessages(response.headers.get("content-type") ?? "", await response.text());
    const result = messages.find((message) => message.id === 1)?.result;
    assert.equal(result?.serverInfo?.name, "resume-studio");
    assert.ok(result?.capabilities?.tools);
    assert.ok(result?.capabilities?.resources);
    assert.ok(result?.capabilities?.prompts);
  } finally {
    delete process.env.RESUME_MCP_TOKEN;
  }
});

test("stateless GET returns 405 instead of a half-open SSE stream", async () => {
  const response = await handleMcpRequest(
    new Request("http://localhost:5173/api/mcp", {
      method: "GET",
      headers: { accept: "text/event-stream" },
    }),
  );
  assert.equal(response.status, 405);
  assert.match(response.headers.get("allow") ?? "", /POST/);
});

test("cross-origin browser requests are rejected unless allow-listed", async () => {
  const blocked = await handleMcpRequest(initRequest({ origin: "http://evil.example" }));
  assert.equal(blocked.status, 403);

  process.env.RESUME_MCP_ALLOWED_ORIGINS = "https://allowed.example";
  try {
    const allowed = await handleMcpRequest(initRequest({ origin: "https://allowed.example" }));
    assert.equal(allowed.status, 200);
  } finally {
    delete process.env.RESUME_MCP_ALLOWED_ORIGINS;
  }
});

test("CORS preflight advertises POST support", async () => {
  const response = handleMcpOptions(
    new Request("http://localhost:5173/api/mcp", {
      method: "OPTIONS",
      headers: { origin: "http://localhost:5173", "access-control-request-method": "POST" },
    }),
  );
  assert.equal(response.status, 204);
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
});

test("cleanup temp data dir", async () => {
  await rm(dataDir, { recursive: true, force: true });
});
