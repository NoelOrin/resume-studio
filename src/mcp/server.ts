import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MCP_INSTRUCTIONS } from "./catalog";
import { MCP_SERVER_INFO } from "./config";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";
import { registerTools } from "./tools";

/** Build a fully registered MCP server. Transport wiring lives in handler.ts. */
export function createMcpServer(): McpServer {
  // The instructions live in catalog.ts so the settings page shows the exact text
  // this server hands to clients.
  const server = new McpServer(MCP_SERVER_INFO, { instructions: MCP_INSTRUCTIONS });
  registerTools(server);
  registerResources(server);
  registerPrompts(server);
  return server;
}
