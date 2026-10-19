import { handleMcpOptions, handleMcpRequest } from "@/src/mcp/handler";

export const dynamic = "force-dynamic";

/**
 * MCP Streamable HTTP endpoint (Node runtime).
 *
 *   POST   /api/mcp   JSON-RPC requests (initialize / tools/call / …), SSE or JSON replies
 *   GET    /api/mcp   405 — stateless endpoint, no standalone server→client SSE stream
 *   DELETE /api/mcp   session teardown; stateless mode has no session → 200
 *   OPTIONS /api/mcp  CORS preflight
 *
 * Auth: set RESUME_MCP_TOKEN to require `Authorization: Bearer <token>`.
 * The endpoint is stateless: every request gets a fresh server instance.
 */
export function POST(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export function GET(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export function DELETE(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export function OPTIONS(request: Request): Response {
  return handleMcpOptions(request);
}
