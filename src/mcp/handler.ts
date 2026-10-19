import { timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MAX_BODY_BYTES, mcpAllowedOrigins, mcpAuthToken } from "./config";
import { createMcpServer } from "./server";

const CORS_METHODS = "POST, DELETE, OPTIONS";
const CORS_HEADERS = "content-type, authorization, mcp-session-id, mcp-protocol-version";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
} as const;

function jsonRpcError(status: number, message: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32001, message } }),
    { status, headers: { ...JSON_HEADERS, ...extraHeaders } },
  );
}

/**
 * Stateless servers have no server→client stream, so the MCP spec expects 405 for GET
 * instead of a half-open SSE connection (the SDK would otherwise keep one alive).
 */
function methodNotAllowed(): Response {
  return jsonRpcError(
    405,
    "Method Not Allowed: this endpoint is stateless. Use POST for JSON-RPC requests; there is no standalone SSE stream.",
    { allow: CORS_METHODS },
  );
}

function unauthorized(): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32001, message: "Unauthorized: missing or invalid bearer token." },
    }),
    {
      status: 401,
      headers: {
        ...JSON_HEADERS,
        "www-authenticate": 'Bearer realm="resume-studio"',
      },
    },
  );
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function isAuthorized(request: Request): boolean {
  const token = mcpAuthToken();
  if (!token) return true;
  const header = request.headers.get("authorization") ?? "";
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || rest.length === 0) return false;
  return safeEqual(rest.join(" "), token);
}

/**
 * DNS-rebinding / CSRF guard: browsers always send Origin. If it does not match the
 * request host, require an explicit allow-list entry.
 */
function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = mcpAllowedOrigins();
  if (allowed.includes("*") || allowed.includes(origin)) return true;
  try {
    const target = new URL(origin);
    const host = request.headers.get("host") ?? new URL(request.url).host;
    return Boolean(host) && target.host === host;
  } catch {
    return false;
  }
}

/**
 * Stateless Streamable HTTP: one fresh server + transport per request. A JSON reply is
 * closed immediately; an SSE reply stays open until its stream flushes, then closes.
 */
async function finalize(response: Response, server: McpServer): Promise<Response> {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");

  const contentType = headers.get("content-type") ?? "";
  const streaming =
    Boolean(response.body) && contentType.includes("text/event-stream");

  if (!streaming) {
    const body = response.body ? await response.arrayBuffer() : null;
    await server.close().catch(() => {});
    const status = response.status;
    const nullBody = status === 204 || status === 205 || status === 304;
    return new Response(nullBody ? null : body, { status, headers });
  }

  const body = response.body!.pipeThrough(
    new TransformStream({
      flush: async () => {
        await server.close().catch(() => {});
      },
    }),
  );
  return new Response(body, { status: response.status, headers });
}

/** Main entry used by app/api/mcp/route.ts. */
export async function handleMcpRequest(request: Request): Promise<Response> {
  if (!isOriginAllowed(request)) {
    return jsonRpcError(403, "Forbidden origin. Set RESUME_MCP_ALLOWED_ORIGINS to allow it.");
  }
  if (!isAuthorized(request)) return unauthorized();
  if (request.method === "GET") return methodNotAllowed();

  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    maxRequestBodySize: MAX_BODY_BYTES,
    enableJsonResponse: false,
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return await finalize(response, server);
  } catch (error) {
    await server.close().catch(() => {});
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonRpcError(500, message);
  }
}

/** CORS preflight for browser-based MCP clients. */
export function handleMcpOptions(request: Request): Response {
  if (!isOriginAllowed(request)) {
    return new Response(null, { status: 403 });
  }
  const headers = new Headers({
    allow: CORS_METHODS,
    "access-control-allow-methods": CORS_METHODS,
    "access-control-allow-headers": CORS_HEADERS,
    "access-control-max-age": "86400",
  });
  const origin = request.headers.get("origin");
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "origin");
  }
  return new Response(null, { status: 204, headers });
}
