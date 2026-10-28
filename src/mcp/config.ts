/** MCP endpoint configuration. Everything is optional so the server works out of the box on Node. */

export const MCP_PATH = "/api/mcp";

/** Synced from package.json by `npm run version:sync` (pinned by tests/version-sync.test.ts). */
export const MCP_SERVER_INFO = {
  name: "resume-studio",
  version: "2.3.12",
} as const;

/** Streamable HTTP body cap (applies before JSON parsing). */
export const MAX_BODY_BYTES = 4 * 1024 * 1024;

/** Resume documents above this size are rejected by the write tools. */
export const MAX_DOC_BYTES = 2 * 1024 * 1024;

/** Static bearer token. Empty means "no auth" (local development default). */
export function mcpAuthToken(): string | null {
  const token = process.env.RESUME_MCP_TOKEN?.trim();
  return token ? token : null;
}

/** Extra origins allowed to call the endpoint from a browser. Comma separated. */
export function mcpAllowedOrigins(): string[] {
  return (process.env.RESUME_MCP_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Absolute origin used to build shareable publish URLs, e.g. https://resume.example.dev */
export function publicBaseUrl(): string | null {
  const url = process.env.RESUME_PUBLIC_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}
