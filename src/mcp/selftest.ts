/**
 * Browser-side MCP endpoint self-test for the settings page.
 *
 * The page cannot speak the full MCP SDK, but a stateless Streamable HTTP
 * endpoint answers a plain `initialize` → `tools/list` pair over fetch, so the
 * dialog can verify reachability, server identity, tool count and latency
 * without any client configuration. Token-protected endpoints answer 401,
 * which the UI reports as "reachable, auth required" rather than a failure.
 */

export type McpProbeResult = {
  ok: boolean;
  /** The endpoint answered 401 — reachable, but a bearer token is required. */
  authRequired: boolean;
  /** HTTP status of the request that stopped the probe; null on network failure. */
  httpStatus: number | null;
  serverName: string | null;
  serverVersion: string | null;
  toolCount: number | null;
  initMs: number;
  listMs: number;
  error: string | null;
};

/** JSON payloads carried by `data:` lines of an SSE body; malformed lines are skipped. */
export function parseSseData(text: string): unknown[] {
  const values: unknown[] = [];
  for (const chunk of text.split(/\n\n+/)) {
    const data = chunk
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("");
    if (!data) continue;
    try {
      values.push(JSON.parse(data));
    } catch {
      /* keep-alive comments and partial frames are not JSON */
    }
  }
  return values;
}

function parseRpcBody(contentType: string, text: string, id: number): Record<string, unknown> | null {
  const messages = contentType.includes("text/event-stream")
    ? parseSseData(text)
    : [safeJsonParse(text)];
  for (const message of messages) {
    if (message && typeof message === "object" && (message as { id?: unknown }).id === id) {
      return message as Record<string, unknown>;
    }
  }
  // Stateless servers answer single-message bodies; fall back to the first message.
  const first = messages[0];
  return first && typeof first === "object" ? (first as Record<string, unknown>) : null;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const MCP_HEADERS = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
} as const;

function blankProbe(): McpProbeResult {
  return {
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
}

/** POST `initialize` then `tools/list` to the endpoint and summarize what answered. */
export async function probeMcpEndpoint(
  endpoint: string,
  options: { fetch?: typeof fetch; signal?: AbortSignal } = {},
): Promise<McpProbeResult> {
  const doFetch = options.fetch ?? fetch.bind(globalThis);
  const probe = blankProbe();

  let response: Response;
  const initStartedAt = Date.now();
  try {
    response = await doFetch(endpoint, {
      method: "POST",
      headers: { ...MCP_HEADERS },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "resume-studio-selftest", version: "1.0.0" },
        },
      }),
      signal: options.signal,
    });
  } catch (error) {
    probe.error = error instanceof Error ? error.message : String(error);
    return probe;
  }
  probe.initMs = Date.now() - initStartedAt;
  probe.httpStatus = response.status;

  if (response.status === 401) {
    probe.authRequired = true;
    probe.error = "HTTP 401";
    return probe;
  }
  if (!response.ok) {
    probe.error = `HTTP ${response.status}`;
    return probe;
  }

  const initMessage = parseRpcBody(
    response.headers.get("content-type") ?? "",
    await response.text(),
    1,
  );
  const initResult = (initMessage?.result ?? null) as
    | { serverInfo?: { name?: string; version?: string } }
    | null;
  if (!initResult) {
    probe.error = "initialize 响应无法解析";
    return probe;
  }
  probe.serverName = initResult.serverInfo?.name ?? null;
  probe.serverVersion = initResult.serverInfo?.version ?? null;

  const listStartedAt = Date.now();
  let listResponse: Response;
  try {
    listResponse = await doFetch(endpoint, {
      method: "POST",
      headers: { ...MCP_HEADERS },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
      signal: options.signal,
    });
  } catch (error) {
    probe.error = error instanceof Error ? error.message : String(error);
    return probe;
  }
  probe.listMs = Date.now() - listStartedAt;
  probe.httpStatus = listResponse.status;

  if (!listResponse.ok) {
    probe.error = `HTTP ${listResponse.status}`;
    return probe;
  }

  const listMessage = parseRpcBody(
    listResponse.headers.get("content-type") ?? "",
    await listResponse.text(),
    2,
  );
  const tools = (listMessage?.result as { tools?: unknown[] } | null)?.tools;
  if (!Array.isArray(tools)) {
    probe.error = "tools/list 响应无法解析";
    return probe;
  }

  probe.toolCount = tools.length;
  probe.ok = true;
  return probe;
}
