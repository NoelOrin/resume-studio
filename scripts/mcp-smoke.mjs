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
  "tools/list exposes 7 tools",
  names.length === 7,
  names.join(", "),
);

const list = await rpc("tools/call", { name: "list_resumes", arguments: {} });
const listPayload = JSON.parse(list.content[0].text);
check("list_resumes returns a document list", Array.isArray(listPayload.docs), `${listPayload.count} doc(s)`);

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

const resources = await rpc("resources/list", {});
check(
  "resources/list includes docs + templates",
  resources.resources.some((resource) => resource.uri === "resume://docs") &&
    resources.resources.some((resource) => resource.uri === "resume://templates"),
  `${resources.resources.length} resource(s)`,
);

const templates = await rpc("resources/read", { uri: "resume://templates" });
const templatePayload = JSON.parse(templates.contents[0].text);
check("resources/read resume://templates returns 3 templates", templatePayload.templates.length === 3);

const prompts = await rpc("prompts/list", {});
check(
  "prompts/list returns 2 prompts",
  prompts.prompts.length === 2,
  prompts.prompts.map((prompt) => prompt.name).join(", "),
);

const passed = checks.filter((entry) => entry.ok).length;
console.log(`\n${passed}/${checks.length} checks passed`);
