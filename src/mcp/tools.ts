import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { auditDocument, type ResumeAudit } from "./audit";
import { migrateDocument } from "../lib/migrate";
import type { ResumeData } from "../types";
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

// Output schemas stay deliberately loose: migration fills demo values in, so a
// strict shape would reject exactly the documents clients need to see.
const docDataOutput = z.record(z.string(), z.unknown());

const idSchema = z
  .string()
  .describe('文档 id：小写字母/数字/连字符，例如 "lin-zhiyuan-2026"。');

const SORT_OPTIONS = [
  "updatedAt-desc",
  "updatedAt-asc",
  "title-asc",
  "title-desc",
] as const;

export type ListResumesOptions = {
  templateId?: string;
  query?: string;
  sort?: (typeof SORT_OPTIONS)[number];
};

/** List every stored resume document, newest first by default. */
export async function listResumes(options: ListResumesOptions = {}): Promise<CallToolResult> {
  const sort = options.sort ?? "updatedAt-desc";
  if (!SORT_OPTIONS.includes(sort)) {
    throw new McpToolError(`sort 只支持 ${SORT_OPTIONS.join(" / ")}，收到 "${sort}"。`);
  }
  const templateId = options.templateId?.trim() || undefined;
  const query = options.query?.trim().toLowerCase() || undefined;

  let docs = await listDocs();
  if (templateId) docs = docs.filter((doc) => doc.templateId === templateId);
  if (query) docs = docs.filter((doc) => doc.title.toLowerCase().includes(query));
  docs = [...docs].sort((a, b) => {
    if (sort === "title-asc") return a.title.localeCompare(b.title, "zh");
    if (sort === "title-desc") return b.title.localeCompare(a.title, "zh");
    const order = String(b.updatedAt).localeCompare(String(a.updatedAt));
    return sort === "updatedAt-asc" ? -order : order;
  });

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

/**
 * Resolve the shared `id`-or-`data` input of the render-family tools: exactly one
 * must be present, and both paths yield migrated data plus a fallback title.
 */
async function resolveResumeInput(input: {
  id?: string;
  data?: unknown;
  title?: string;
}): Promise<{ data: ResumeData; title: string; fromStore: boolean }> {
  if (input.id && input.data) {
    throw new McpToolError("id 与 data 只能二选一：id 指向已存文档，data 是临时内容。");
  }

  if (input.id) {
    const id = requireValidId(input.id);
    const doc = await readDoc(id);
    if (!doc) {
      throw new McpToolError(`未找到简历 "${id}"。先调用 list_resumes 查看现有文档。`);
    }
    return { data: doc.data, title: input.title ?? doc.title, fromStore: true };
  }

  if (input.data) {
    const normalized = migrateDocument(input.data);
    if (!normalized) {
      throw new McpToolError("data 不是合法的简历文档：至少需要 header 和 experience 两个对象。");
    }
    return { data: normalized, title: input.title ?? "简历", fromStore: false };
  }

  throw new McpToolError("需要提供 id（检查/渲染已存文档）或 data（检查/渲染临时内容）。");
}

/** Render a stored document (or inline data) to a standalone multi-page HTML file. */
export async function renderResume(input: {
  id?: string;
  data?: unknown;
  title?: string;
}): Promise<CallToolResult> {
  const resolved = await resolveResumeInput(input);
  const rendered = renderResumeHtml(resolved.data, resolved.title);
  return toolJson({
    templateId: rendered.templateId,
    templateName: rendered.templateName,
    pages: rendered.pages,
    title: resolved.title,
    bytes: rendered.bytes,
    html: rendered.html,
  });
}

const emptyAudit = (): ResumeAudit => ({ issues: [], counts: { filled: 0, coerced: 0, dropped: 0 } });

/**
 * Dry-run the render pipeline and report only metadata: page count, byte size and
 * what migration filled in or dropped. Keeps big HTML payloads out of the model's
 * context when all the client wants to know is "does this fit and is it complete".
 */
export async function checkResume(input: {
  id?: string;
  data?: unknown;
  title?: string;
}): Promise<CallToolResult> {
  const resolved = await resolveResumeInput(input);
  const rendered = renderResumeHtml(resolved.data, resolved.title);
  // Stored documents were normalized on write, so only inline data can drift.
  const audit = resolved.fromStore ? emptyAudit() : auditDocument(input.data, resolved.data);

  return toolJson({
    templateId: rendered.templateId,
    templateName: rendered.templateName,
    pages: rendered.pages,
    bytes: rendered.bytes,
    title: resolved.title,
    issues: audit.issues,
    issueCounts: audit.counts,
  });
}

/** Copy a stored document to a new id; never overwrites an existing target. */
export async function duplicateResume(input: {
  id: string;
  newId?: string;
  title?: string;
}): Promise<CallToolResult> {
  const sourceId = requireValidId(input.id);
  const doc = await readDoc(sourceId);
  if (!doc) {
    throw new McpToolError(`未找到简历 "${sourceId}"。先调用 list_resumes 查看现有文档。`);
  }

  const title = (input.title ?? `${doc.title} · 副本`).slice(0, 120);
  const targetId = input.newId ? requireValidId(input.newId) : newDocId(title);
  if (await readDoc(targetId)) {
    throw new McpToolError(`已存在 id 为 "${targetId}" 的简历。请换一个 newId，或先删除该文档。`);
  }

  const record = await writeDoc(targetId, title, doc.data);
  return toolJson({
    ok: true,
    id: record.id,
    title: record.title,
    sourceId,
    updatedAt: record.updatedAt,
    templateId: record.data.templateId,
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
        "列出服务器上的简历文档（id、标题、更新时间、模板），支持按模板过滤、按标题搜索与排序。只读，返回 JSON。编辑前先用它找到目标文档 id。",
      inputSchema: {
        templateId: z.string().optional().describe("按模板 id 精确过滤，例如 minimal"),
        query: z.string().optional().describe("按标题子串搜索（大小写不敏感）"),
        sort: z
          .enum(SORT_OPTIONS)
          .optional()
          .describe("排序方式，默认按更新时间倒序"),
      },
      outputSchema: {
        count: z.number(),
        docs: z.array(z.record(z.string(), z.unknown())),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async (input) => runTool("list_resumes", () => listResumes(input)),
  );

  server.registerTool(
    "get_resume",
    {
      title: "读取简历",
      description:
        "读取一份简历的完整数据（ResumeData）和模板信息。返回 JSON；文档不存在时返回错误并提示先 list_resumes。",
      inputSchema: { id: idSchema },
      outputSchema: {
        id: z.string(),
        title: z.string(),
        updatedAt: z.string().nullable(),
        template: z.record(z.string(), z.unknown()),
        data: docDataOutput,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => runTool("get_resume", () => getResume(id)),
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
      outputSchema: {
        ok: z.boolean(),
        id: z.string(),
        title: z.string(),
        updatedAt: z.string(),
        templateId: z.string(),
        created: z.boolean(),
      },
      annotations: { destructiveHint: true, openWorldHint: false },
    },
    async (input) => runTool("save_resume", () => saveResume(input)),
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
      outputSchema: {
        ok: z.boolean(),
        id: z.string(),
        title: z.string(),
        updatedAt: z.string(),
        templateId: z.string(),
        data: docDataOutput,
      },
      annotations: { destructiveHint: true, openWorldHint: false },
    },
    async (input) => runTool("patch_resume", () => patchResume(input)),
  );

  server.registerTool(
    "check_resume",
    {
      title: "预检简历",
      description:
        "把简历渲染成多页 HTML 但只返回元数据（模板、页数、字节、数据问题清单），不返回 html 正文。用 id 检查已存文档，或用 data 检查临时内容，二选一。适合发布或导出前确认页数与数据完整度。",
      inputSchema: {
        id: idSchema.optional().describe("已存文档 id；与 data 二选一"),
        data: dataSchema.optional().describe("临时简历数据；与 id 二选一"),
        title: z.string().max(120).optional().describe("标题（可选）"),
      },
      outputSchema: {
        templateId: z.string(),
        templateName: z.string(),
        pages: z.number(),
        bytes: z.number(),
        title: z.string(),
        issues: z.array(z.record(z.string(), z.unknown())),
        issueCounts: z.record(z.string(), z.number()),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) => runTool("check_resume", () => checkResume(input)),
  );

  server.registerTool(
    "duplicate_resume",
    {
      title: "复制简历",
      description:
        "复制一份简历为新文档：保留全部内容并写入新 id，返回新文档信息。目标 id 已存在时报错，不会覆盖；缺省标题为「原标题 · 副本」。",
      inputSchema: {
        id: idSchema.describe("源文档 id"),
        newId: idSchema.optional().describe("目标 id；省略时按标题自动生成"),
        title: z.string().max(120).optional().describe("新文档标题，缺省为「原标题 · 副本」"),
      },
      outputSchema: {
        ok: z.boolean(),
        id: z.string(),
        title: z.string(),
        sourceId: z.string(),
        updatedAt: z.string(),
        templateId: z.string(),
      },
      annotations: { openWorldHint: false },
    },
    async (input) => runTool("duplicate_resume", () => duplicateResume(input)),
  );

  server.registerTool(
    "delete_resume",
    {
      title: "删除简历",
      description: "删除一份简历文档。文档不存在时返回 deleted: false，不视为失败。",
      inputSchema: { id: idSchema },
      outputSchema: {
        ok: z.boolean(),
        deleted: z.boolean(),
        id: z.string(),
        note: z.string().optional(),
      },
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => runTool("delete_resume", () => deleteResume(id)),
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
      outputSchema: {
        templateId: z.string(),
        templateName: z.string(),
        pages: z.number(),
        title: z.string(),
        bytes: z.number(),
        html: z.string(),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) => runTool("render_resume_html", () => renderResume(input)),
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
      outputSchema: {
        ok: z.boolean(),
        id: z.string(),
        title: z.string(),
        path: z.string(),
        url: z.string(),
        templateId: z.string(),
        pages: z.number(),
        bytes: z.number(),
      },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) => runTool("publish_resume", () => publishResume(input)),
  );
}
