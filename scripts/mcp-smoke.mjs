#!/usr/bin/env node
/**
 * Real HTTP smoke test for the MCP endpoint.
 *
 *   npm run dev                        # in one terminal
 *   npm run mcp:smoke                  # in another
 *   MCP_URL=http://127.0.0.1:3000/api/mcp npm run mcp:smoke   # production build
 *
 * Exercises: initialize → tools/list → tools/call (list + render) → resources → prompts.
 * Works with both SSE and JSON responses.
 */
const endpoint = process.env.MCP_URL ?? "http://127.0.0.1:5173/api/mcp";
const token = process.env.RESUME_MCP_TOKEN;

const headers = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};

let nextId = 1;

function parseBody(response, text) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) return JSON.parse(text);
  const messages = text
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
  return messages.find((message) => message.id !== undefined) ?? messages[0];
}

async function rpc(method, params) {
  const id = nextId++;
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} → HTTP ${response.status}: ${text.slice(0, 300)}`);
  }
  const message = parseBody(response, text);
  if (message.error) {
    throw new Error(`${method} → ${message.error.code}: ${message.error.message}`);
  }
  return message.result;
}

async function notify(method, params) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method, params }),
  });
  if (!response.ok) throw new Error(`${method} → HTTP ${response.status}`);
}

const checks = [];
function check(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!condition) process.exitCode = 1;
}

console.log(`MCP smoke → ${endpoint}\n`);

const init = await rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "resume-studio-smoke", version: "1.0.0" },
});
check("initialize returns serverInfo", init?.serverInfo?.name === "resume-studio", init?.serverInfo?.version);
check("initialize declares tools/resources/prompts", Boolean(init?.capabilities?.tools && init?.capabilities?.resources && init?.capabilities?.prompts));

await notify("notifications/initialized", {});

const tools = await rpc("tools/list", {});
const names = tools.tools.map((tool) => tool.name).sort();
check(
  "tools/list exposes 12 tools",
  names.length === 12,
  names.join(", "),
);

const list = await rpc("tools/call", { name: "list_resumes", arguments: {} });
const listPayload = JSON.parse(list.content[0].text);
check("list_resumes returns a document list", Array.isArray(listPayload.docs), `${listPayload.count} doc(s)`);
check(
  "list_resumes honours structuredContent",
  list.structuredContent && list.structuredContent.count === listPayload.count,
  "schema-aware clients get machine-readable JSON",
);

const rendered = await rpc("tools/call", {
  name: "render_resume_html",
  arguments: { data: { header: {}, experience: {} }, title: "Smoke Test" },
});
const renderPayload = JSON.parse(rendered.content[0].text);
check(
  "render_resume_html produces standalone HTML",
  renderPayload.html.startsWith("<!doctype html>") && renderPayload.html.includes('class="tpl-page'),
  `${renderPayload.pages} page(s), ${renderPayload.bytes} bytes`,
);

const checked = await rpc("tools/call", {
  name: "check_resume",
  arguments: { data: { header: {}, experience: {} }, title: "Smoke Check" },
});
const checkPayload = JSON.parse(checked.content[0].text);
check(
  "check_resume reports metadata without the html payload",
  !("html" in checkPayload) && checkPayload.pages >= 1 && Array.isArray(checkPayload.issues),
  `${checkPayload.pages} page(s), ${checkPayload.issueCounts?.filled ?? 0} filled issue(s)`,
);

const archives = await rpc("tools/call", { name: "list_archives", arguments: {} });
const archivePayload = JSON.parse(archives.content[0].text);
check(
  "list_archives reports the archive library",
  Array.isArray(archivePayload.archives) && archivePayload.count === archivePayload.archives.length,
  `${archivePayload.count} archived artifact(s)`,
);

// duplicate_resume needs a stored source doc; write two throwaway docs and clean
// them up afterwards (ids are smoke-prefixed so a collision is unlikely).
await rpc("tools/call", {
  name: "save_resume",
  arguments: { id: "smoke-dup-src", title: "Smoke 复制源", data: { header: {}, experience: {} } },
});
const dup = await rpc("tools/call", {
  name: "duplicate_resume",
  arguments: { id: "smoke-dup-src", newId: "smoke-dup-copy" },
});
const dupPayload = JSON.parse(dup.content[0].text);
check(
  "duplicate_resume copies a document",
  dupPayload.ok === true && dupPayload.id === "smoke-dup-copy" && dupPayload.title === "Smoke 复制源 · 副本",
);
for (const id of ["smoke-dup-src", "smoke-dup-copy"]) {
  await rpc("tools/call", { name: "delete_resume", arguments: { id } });
}

const resources = await rpc("resources/list", {});
check(
  "resources/list includes docs + templates",
  resources.resources.some((resource) => resource.uri === "resume://docs") &&
    resources.resources.some((resource) => resource.uri === "resume://templates"),
  `${resources.resources.length} resource(s)`,
);

const templates = await rpc("resources/read", { uri: "resume://templates" });
const templatePayload = JSON.parse(templates.contents[0].text);
check(
  "resources/read resume://templates lists the registry",
  templatePayload.templates.length >= 5,
  `${templatePayload.templates.length} template(s)`,
);

const prompts = await rpc("prompts/list", {});
check(
  "prompts/list returns 2 prompts",
  prompts.prompts.length === 2,
  prompts.prompts.map((prompt) => prompt.name).join(", "),
);

const passed = checks.filter((entry) => entry.ok).length;
console.log(`\n${passed}/${checks.length} checks passed`);
