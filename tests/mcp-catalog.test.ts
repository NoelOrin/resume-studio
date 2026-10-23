import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(tmpdir(), "resume-mcp-catalog-"));
process.env.RESUME_DATA_DIR = dataDir;

const {
  MCP_CLIENTS,
  MCP_EXAMPLES,
  MCP_INSTRUCTIONS,
  MCP_PROMPTS,
  MCP_RESOURCES,
  MCP_TOOLS,
  MCP_WORKFLOW,
  mcpCatalogSummary,
} = await import("../src/mcp/catalog");
const { createMcpServer } = await import("../src/mcp/server");
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js");

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/**
 * The settings page renders `src/mcp/catalog.ts` and promises the user that these
 * are the capabilities the endpoint really exposes. This test connects a real MCP
 * client and fails the moment the catalog drifts from the registered server.
 */
test("MCP catalog matches what the server actually registers", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  await server.connect(serverTransport);
  const client = new Client({ name: "resume-studio-catalog-test", version: "1.0.0" });
  await client.connect(clientTransport);

  try {
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      MCP_TOOLS.map((tool) => tool.name).sort(),
      "catalog tools must match the registered tools",
    );
    for (const tool of tools) {
      const doc = MCP_TOOLS.find((entry) => entry.name === tool.name)!;
      assert.equal(doc.title, tool.title, `${tool.name} title drifted`);
      assert.equal(doc.description, tool.description, `${tool.name} description drifted`);
      assert.ok(doc.whenToUse.length > 4, `${tool.name} needs a 何时使用`);
      assert.ok(doc.example.length > 4, `${tool.name} needs a 调用词`);
    }

    const { resources } = await client.listResources();
    const documentedStatic = MCP_RESOURCES.filter((entry) => !entry.uri.includes("{"));
    assert.deepEqual(
      resources.map((resource) => resource.uri).sort(),
      documentedStatic.map((entry) => entry.uri).sort(),
      "catalog static resources must match the registered ones",
    );
    for (const resource of resources) {
      const doc = MCP_RESOURCES.find((entry) => entry.uri === resource.uri)!;
      assert.equal(doc.title, resource.title ?? resource.name, `${resource.uri} title drifted`);
      assert.equal(doc.description, resource.description, `${resource.uri} description drifted`);
    }

    const { resourceTemplates } = await client.listResourceTemplates();
    const documentedTemplates = MCP_RESOURCES.filter((entry) => entry.uri.includes("{"));
    assert.deepEqual(
      resourceTemplates.map((template) => template.uriTemplate).sort(),
      documentedTemplates.map((entry) => entry.uri).sort(),
      "catalog resource templates must match the registered ones",
    );
    for (const template of resourceTemplates) {
      const doc = MCP_RESOURCES.find((entry) => entry.uri === template.uriTemplate)!;
      assert.equal(doc.title, template.title ?? template.name, `${template.uriTemplate} title drifted`);
      assert.equal(doc.description, template.description, `${template.uriTemplate} description drifted`);
    }

    const { prompts } = await client.listPrompts();
    assert.deepEqual(
      prompts.map((prompt) => prompt.name).sort(),
      MCP_PROMPTS.map((prompt) => prompt.name).sort(),
      "catalog prompts must match the registered ones",
    );
    for (const prompt of prompts) {
      const doc = MCP_PROMPTS.find((entry) => entry.name === prompt.name)!;
      assert.equal(doc.title, prompt.title, `${prompt.name} title drifted`);
      assert.equal(doc.description, prompt.description, `${prompt.name} description drifted`);
      const registered = (prompt.arguments ?? [])
        .map((arg) => ({
          name: arg.name,
          required: Boolean(arg.required),
          description: arg.description,
        }))
        .sort(byName);
      const documented = doc.args
        .map((arg) => ({
          name: arg.name,
          required: arg.required,
          description: arg.description,
        }))
        .sort(byName);
      assert.deepEqual(documented, registered, `${prompt.name} args drifted`);
      assert.ok(doc.example.length > 4, `${prompt.name} needs a 调用词`);
    }

    for (const resource of MCP_RESOURCES) {
      assert.ok(resource.example.length > 4, `${resource.uri} needs a 调用词`);
    }

    // The settings page shows `instructions` as "what the server tells clients";
    // compare it against what the server actually hands over during initialize.
    assert.equal(
      client.getInstructions(),
      MCP_INSTRUCTIONS,
      "server instructions drifted from the catalog",
    );
  } finally {
    await client.close();
    await server.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("settings-page copy is complete and self-consistent", () => {
  assert.deepEqual(mcpCatalogSummary(), {
    tools: MCP_TOOLS.length,
    resources: MCP_RESOURCES.length,
    prompts: MCP_PROMPTS.length,
  });
  assert.ok(MCP_WORKFLOW.length >= 3, "workflow steps are shown in the settings page");
  for (const step of MCP_WORKFLOW) {
    assert.ok(MCP_INSTRUCTIONS.includes(step), `instructions must contain the workflow step: ${step}`);
  }
  assert.ok(MCP_EXAMPLES.length >= 3, "通用调用词 should offer a few starting points");
  assert.ok(MCP_CLIENTS.length >= 2, "at least a CLI and a generic JSON client snippet");
  for (const client of MCP_CLIENTS) {
    assert.ok(client.label.length > 2, "client snippet needs a label");
    assert.ok(client.note.length > 4, `${client.label} needs a note`);
    // Every snippet must be usable as-is: it either carries the runtime endpoint
    // placeholder (filled by /api/mcp/info) or is a standalone repo command.
    assert.ok(
      client.snippet.includes("{endpoint}") || client.snippet.includes("npm run mcp:smoke"),
      `${client.label} snippet must reference the runtime endpoint`,
    );
  }
});
