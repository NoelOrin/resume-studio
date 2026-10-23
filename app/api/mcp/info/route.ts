import { MCP_SERVER_INFO, mcpAuthToken } from "@/src/mcp/config";
import {
  MCP_CLIENTS,
  MCP_ENDPOINT_PATH,
  MCP_EXAMPLES,
  MCP_INSTRUCTIONS,
  MCP_PROMPTS,
  MCP_RESOURCES,
  MCP_TOOLS,
  MCP_TRANSPORT_NOTE,
  MCP_WORKFLOW,
  mcpCatalogSummary,
} from "@/src/mcp/catalog";
import { APP_VERSION } from "@/src/lib/version";

export const dynamic = "force-dynamic";

/**
 * What the MCP endpoint actually exposes, for the settings page.
 *
 * Descriptions and 调用词 come from `src/mcp/catalog.ts`, which
 * `tests/mcp-catalog.test.ts` pins against the real registered server — so this
 * endpoint cannot advertise a capability the server does not have.
 *
 * The token itself is never returned: only whether one is required.
 */
function absoluteEndpoint(request: Request): string {
  try {
    return new URL(MCP_ENDPOINT_PATH, new URL(request.url).origin).toString();
  } catch {
    return MCP_ENDPOINT_PATH;
  }
}

export function GET(request: Request) {
  const endpoint = absoluteEndpoint(request);
  const fill = (snippet: string) =>
    snippet.replaceAll("{endpoint}", endpoint).replaceAll("{token}", "<你的 RESUME_MCP_TOKEN>");

  return Response.json(
    {
      endpoint,
      path: MCP_ENDPOINT_PATH,
      transport: MCP_TRANSPORT_NOTE,
      authRequired: mcpAuthToken() !== null,
      serverName: MCP_SERVER_INFO.name,
      version: APP_VERSION,
      instructions: MCP_INSTRUCTIONS,
      workflow: MCP_WORKFLOW,
      tools: MCP_TOOLS,
      resources: MCP_RESOURCES,
      prompts: MCP_PROMPTS,
      clients: MCP_CLIENTS.map((client) => ({ ...client, snippet: fill(client.snippet) })),
      examples: MCP_EXAMPLES,
      counts: mcpCatalogSummary(),
      checkedAt: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
