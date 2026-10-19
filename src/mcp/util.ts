import { randomUUID } from "node:crypto";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { isValidId } from "../server/store";
import { MAX_DOC_BYTES } from "./config";

export class McpToolError extends Error {}

/** Serialize any JSON value as a single text content block. */
export function toolJson(value: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

export function toolText(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

export function toolError(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Wrap a tool handler so unexpected exceptions become actionable tool errors instead of crashed requests. */
export async function runTool(fn: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof McpToolError) return toolError(error.message);
    const message = error instanceof Error ? error.message : String(error);
    return toolError(`工具执行失败：${message}`);
  }
}

/** Turn a title into a safe document id (`^[a-z0-9][a-z0-9-]{0,63}$`). */
export function newDocId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const id = `${slug || "resume"}-${randomUUID().slice(0, 8)}`;
  return isValidId(id) ? id : `resume-${randomUUID().slice(0, 8)}`;
}

export function requireValidId(id: string): string {
  if (!isValidId(id)) {
    throw new McpToolError(
      `id "${id}" 不合法。只允许小写字母、数字和连字符，长度 1–64，例如 "lin-zhiyuan-2026"。`,
    );
  }
  return id;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** RFC 7386 JSON Merge Patch: objects merge recursively, `null` deletes a key, anything else replaces. */
export function mergePatch(target: unknown, patch: unknown): unknown {
  if (!isPlainObject(patch)) return patch;
  const base: Record<string, unknown> = isPlainObject(target) ? { ...target } : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete base[key];
    else base[key] = mergePatch(base[key], value);
  }
  return base;
}

export function assertDocSize(value: unknown): void {
  const bytes = Buffer.byteLength(JSON.stringify(value), "utf8");
  if (bytes > MAX_DOC_BYTES) {
    throw new McpToolError(
      `文档过大（${bytes} 字节）。上限为 ${Math.round(MAX_DOC_BYTES / 1024 / 1024)} MiB，请精简内容后重试。`,
    );
  }
}
