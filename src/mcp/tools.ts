import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { migrateDocument } from "../lib/migrate";
import { deleteDoc, listDocs, readDoc, writeDoc, writePublished } from "../server/store";
import { catalogEntry } from "../templates/catalog";
import { renderResumeHtml } from "./render";
import { publicBaseUrl } from "./config";
import {
  assertDocSize,
  McpToolError,
  mergePatch,
  newDocId,
  requireValidId,
  runTool,
  toolJson,
} from "./util";

const dataSchema = z
  .record(z.string(), z.unknown())
  .describe(
    "完整简历数据（ResumeData）。至少包含 header 与 experience；缺失字段会用示例默认值补齐。可先用 get_resume 读取现有文档作为模板。",
  );

const idSchema = z
  .string()
  .describe('文档 id：小写字母/数字/连字符，例如 "lin-zhiyuan-2026"。');

/** List every stored resume document, newest first. */
export async function listResumes(): Promise<CallToolResult> {
  const docs = await listDocs();
  return toolJson({
    count: docs.length,
    docs: docs.map((doc) => ({
      ...doc,
      templateName: catalogEntry(doc.templateId).nameZh,
    })),
  });
}

/** Read one document plus its template metadata. */
export async function getResume(id: string): Promise<CallToolResult> {
  const docId = requireValidId(id);
  const doc = await readDoc(docId);
  if (!doc) {
    throw new McpToolError(`未找到简历 "${docId}"。先调用 list_resumes 查看现有文档。`);
  }
  return toolJson({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    template: catalogEntry(doc.data.templateId),
    data: doc.data,
  });
}

/** Create (when `id` is omitted) or overwrite a document. */
export async function saveResume(input: {
  id?: string;
  title?: string;
  data: unknown;
}): Promise<CallToolResult> {
  const title = (input.title ?? "未命名简历").slice(0, 120);
  const data = migrateDocument(input.data);
  if (!data) {
    throw new McpToolError(
      "data 不是合法的简历文档：至少需要 header 和 experience 两个对象。可先 get_resume 读取一份现有文档再修改。",
    );
  }
  assertDocSize(data);

  const id = input.id ? requireValidId(input.id) : newDocId(title);
  const record = await writeDoc(id, title, data);
  return toolJson({
    ok: true,
    id: record.id,
    title: record.title,
    updatedAt: record.updatedAt,
    templateId: record.data.templateId,
    created: !input.id,
  });
}

/** Apply an RFC 7386 JSON Merge Patch to an existing document. */
export async function patchResume(input: {
  id: string;
  title?: string;
  patch: unknown;
}): Promise<CallToolResult> {
  const id = requireValidId(input.id);
  const doc = await readDoc(id);
  if (!doc) {
    throw new McpToolError(`未找到简历 "${id}"。先调用 list_resumes 查看现有文档。`);
  }
  if (!input.patch || typeof input.patch !== "object" || Array.isArray(input.patch)) {
    throw new McpToolError('patch 必须是 JSON 对象，例如 { "header": { "nameZh": "林知远" } }。');
  }

  const normalized = migrateDocument(mergePatch(doc.data, input.patch));
  if (!normalized) {
    throw new McpToolError("合并后的文档不合法：至少需要 header 和 experience 两个对象。");
  }
  assertDocSize(normalized);

  const record = await writeDoc(id, input.title ?? doc.title, normalized);
  return toolJson({
    ok: true,
    id: record.id,
    title: record.title,
    updatedAt: record.updatedAt,
    templateId: record.data.templateId,
    data: record.data,
  });
}

/** Delete a document. Missing documents are reported, not treated as failures. */
export async function deleteResume(id: string): Promise<CallToolResult> {
  const docId = requireValidId(id);
  const existing = await readDoc(docId);
  if (!existing) {
    return toolJson({ ok: true, deleted: false, id: docId, note: "文档不存在，无需删除。" });
  }
  await deleteDoc(docId);
  return toolJson({ ok: true, deleted: true, id: docId });
}

/** Render a stored document (or inline data) to a standalone multi-page HTML file. */
export async function renderResume(input: {
  id?: string;
  data?: unknown;
  title?: string;
}): Promise<CallToolResult> {
  if (input.id && input.data) {
    throw new McpToolError("id 与 data 只能二选一：id 渲染已存文档，data 渲染临时内容。");
  }

  let data;
  let title = input.title ?? "简历";

  if (input.id) {
    const id = requireValidId(input.id);
    const doc = await readDoc(id);
    if (!doc) {
      throw new McpToolError(`未找到简历 "${id}"。先调用 list_resumes 查看现有文档。`);
    }
    data = doc.data;
    title = input.title ?? doc.title;
  } else if (input.data) {
    const normalized = migrateDocument(input.data);
    if (!normalized) {
      throw new McpToolError("data 不是合法的简历文档：至少需要 header 和 experience 两个对象。");
    }
    data = normalized;
  } else {
    throw new McpToolError("需要提供 id（渲染已存文档）或 data（渲染临时内容）。");
  }

  const rendered = renderResumeHtml(data, title);
  return toolJson({
    templateId: rendered.templateId,
    templateName: rendered.templateName,
    pages: rendered.pages,
    title,
    bytes: rendered.bytes,
    html: rendered.html,
  });
}

/** Render a stored document and persist it as a shareable `/p/<id>` page. */
export async function publishResume(input: {
  id: string;
  title?: string;
}): Promise<CallToolResult> {
  const id = requireValidId(input.id);
  const doc = await readDoc(id);
  if (!doc) {
    throw new McpToolError(`未找到简历 "${id}"。先调用 list_resumes 查看现有文档。`);
  }

  const title = input.title ?? doc.title;
  const rendered = renderResumeHtml(doc.data, title);
  const path = await writePublished(id, rendered.html);
  const base = publicBaseUrl();

  return toolJson({
    ok: true,
    id,
    title,
    path,
    url: base ? `${base}${path}` : path,
    templateId: rendered.templateId,
    pages: rendered.pages,
    bytes: rendered.bytes,
  });
}

/** Register all 7 tools on a server instance. Descriptions tell the model when to reach for each one. */
export function registerTools(server: McpServer): void {
  server.registerTool(
    "list_resumes",
    {
      title: "列出简历",
      description:
        "列出服务器上所有简历文档（id、标题、更新时间、模板）。只读，返回 JSON。编辑前先用它找到目标文档 id。",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async () => runTool(() => listResumes()),
  );

  server.registerTool(
    "get_resume",
    {
      title: "读取简历",
      description:
        "读取一份简历的完整数据（ResumeData）和模板信息。返回 JSON；文档不存在时返回错误并提示先 list_resumes。",
      inputSchema: { id: idSchema },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => runTool(() => getResume(id)),
  );

  server.registerTool(
    "save_resume",
    {
      title: "保存简历",
      description:
        "新建或整份覆盖一份简历。data 必须是完整 ResumeData（至少 header 与 experience）。省略 id 时按标题自动生成新 id。写入前会归一化校验，返回 id 与更新时间。",
      inputSchema: {
        id: idSchema.optional().describe("已有文档 id；省略则新建"),
        title: z.string().max(120).describe("文档标题，例如 林知远 · 全栈开发工程师"),
        data: dataSchema,
      },
      annotations: { destructiveHint: true, openWorldHint: false },
    },
    async (input) => runTool(() => saveResume(input)),
  );

  server.registerTool(
    "patch_resume",
    {
      title: "局部修改简历",
      description:
        "用 RFC 7386 JSON Merge Patch 局部修改已有简历：对象递归合并，null 删除字段，其余值直接替换。适合只改一两个字段。返回修改后的完整数据。",
      inputSchema: {
        id: idSchema,
        title: z.string().max(120).optional().describe("同时更新标题（可选）"),
        patch: z
          .record(z.string(), z.unknown())
          .describe('合并补丁，例如 { "header": { "nameEn": "LIN" }, "flags": { "showFlow": false } }'),
      },
      annotations: { destructiveHint: true, openWorldHint: false },
    },
    async (input) => runTool(() => patchResume(input)),
  );

  server.registerTool(
    "delete_resume",
    {
      title: "删除简历",
      description: "删除一份简历文档。文档不存在时返回 deleted: false，不视为失败。",
      inputSchema: { id: idSchema },
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => runTool(() => deleteResume(id)),
  );

  server.registerTool(
    "render_resume_html",
    {
      title: "渲染简历 HTML",
      description:
        "把简历渲染成自包含的多页 HTML（内联全部 CSS，不依赖本站 JS），可直接保存或分发。用 id 渲染已存文档，或用 data 渲染临时内容，二选一。返回 JSON，其中 html 字段是完整文件。",
      inputSchema: {
        id: idSchema.optional().describe("已存文档 id；与 data 二选一"),
        data: dataSchema.optional().describe("临时简历数据；与 id 二选一"),
        title: z.string().max(120).optional().describe("HTML 标题（可选）"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) => runTool(() => renderResume(input)),
  );

  server.registerTool(
    "publish_resume",
    {
      title: "发布简历",
      description:
        "渲染已存文档并写入 .data/published/<id>.html，返回可分享的 /p/<id> 路径（设置了 RESUME_PUBLIC_URL 时返回绝对地址）。",
      inputSchema: {
        id: idSchema,
        title: z.string().max(120).optional().describe("发布页标题（可选，默认用文档标题）"),
      },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) => runTool(() => publishResume(input)),
  );
}
