import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(tmpdir(), "resume-mcp-e2e-"));
process.env.RESUME_DATA_DIR = dataDir;

const { defaultResume } = await import("../src/data/defaultResume");
const { templates } = await import("../src/templates/registry");
const { createMcpServer } = await import("../src/mcp/server");
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js");

function jsonOf(result: unknown): Record<string, any> {
  const content = ((result as { content?: unknown }).content ?? []) as { type: string; text?: string }[];
  const block = content.find((item) => item.type === "text");
  assert.ok(block?.text, "tool result should contain a text block");
  return JSON.parse(block!.text!);
}

test("MCP client can use tools, resources and prompts end to end", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  await server.connect(serverTransport);

  const client = new Client({ name: "resume-studio-test", version: "1.0.0" });
  await client.connect(clientTransport);

  try {
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      [
        "check_resume",
        "delete_resume",
        "duplicate_resume",
        "get_resume",
        "list_archives",
        "list_resumes",
        "patch_resume",
        "publish_resume",
        "render_resume_html",
        "save_resume",
      ],
    );
    for (const tool of tools) {
      assert.ok(tool.description && tool.description.length > 10, `${tool.name} needs a description`);
      assert.ok(tool.inputSchema, `${tool.name} needs an input schema`);
    }

    const { resources } = await client.listResources();
    assert.ok(resources.some((resource) => resource.uri === "resume://docs"));
    assert.ok(resources.some((resource) => resource.uri === "resume://templates"));

    const { prompts } = await client.listPrompts();
    assert.deepEqual(prompts.map((prompt) => prompt.name).sort(), ["polish_resume", "tailor_resume_to_job"]);

    const saved = jsonOf(
      await client.callTool({
        name: "save_resume",
        arguments: { title: "端到端测试", data: defaultResume },
      }),
    );
    const id = saved.id as string;
    assert.match(id, /^[a-z0-9][a-z0-9-]{0,63}$/);

    const got = jsonOf(await client.callTool({ name: "get_resume", arguments: { id } }));
    assert.equal(got.title, "端到端测试");
    assert.equal(got.data.header.nameZh, defaultResume.header.nameZh);

    const patched = jsonOf(
      await client.callTool({
        name: "patch_resume",
        arguments: { id, patch: { header: { tag: "RESUME / E2E" } } },
      }),
    );
    assert.equal(patched.data.header.tag, "RESUME / E2E");

    const checked = (await client.callTool({ name: "check_resume", arguments: { id } })) as {
      structuredContent?: Record<string, unknown>;
    };
    const checkBody = jsonOf(checked);
    assert.equal(checkBody.pages, 1);
    assert.ok(!("html" in checkBody), "check_resume must not return the html payload");
    assert.ok(checked.structuredContent, "check_resume should expose structuredContent");

    const filtered = jsonOf(
      await client.callTool({
        name: "list_resumes",
        arguments: { query: "端到端" },
      }),
    );
    assert.ok(filtered.docs.some((doc: { id: string }) => doc.id === id));

    const dup = jsonOf(
      await client.callTool({
        name: "duplicate_resume",
        arguments: { id, newId: "e2e-copy", title: "端到端副本" },
      }),
    );
    assert.equal(dup.id, "e2e-copy");
    const dupGot = jsonOf(await client.callTool({ name: "get_resume", arguments: { id: "e2e-copy" } }));
    assert.equal(dupGot.title, "端到端副本");

    const published = jsonOf(await client.callTool({ name: "publish_resume", arguments: { id } }));
    assert.equal(published.path, `/p/${id}`);

    const rendered = jsonOf(
      await client.callTool({ name: "render_resume_html", arguments: { id } }),
    );
    assert.ok(rendered.html.startsWith("<!doctype html>"));
    assert.match(rendered.html, /RESUME \/ E2E/);

    const docResource = await client.readResource({ uri: `resume://docs/${id}` });
    assert.equal(docResource.contents.length, 1);
    assert.ok("text" in docResource.contents[0]);
    assert.equal(JSON.parse(docResource.contents[0].text).id, id);

    const templatesResource = await client.readResource({ uri: "resume://templates" });
    assert.ok("text" in templatesResource.contents[0]);
    assert.equal(JSON.parse(templatesResource.contents[0].text).templates.length, templates.length);

    const prompt = await client.getPrompt({ name: "polish_resume", arguments: { resumeId: id } });
    assert.equal(prompt.messages.length, 1);
    assert.equal(prompt.messages[0].role, "user");

    const deleted = jsonOf(await client.callTool({ name: "delete_resume", arguments: { id } }));
    assert.equal(deleted.deleted, true);
    await client.callTool({ name: "delete_resume", arguments: { id: "e2e-copy" } });

    const missing = (await client.callTool({ name: "get_resume", arguments: { id } })) as {
      isError?: boolean;
    };
    assert.equal(missing.isError, true);
  } finally {
    await client.close();
    await server.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});
