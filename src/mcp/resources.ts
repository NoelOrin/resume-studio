import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listDocs, readDoc } from "../server/store";
import { catalogEntry, TEMPLATE_CATALOG } from "../templates/catalog";

function jsonContents(uri: string, value: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

/**
 * Read-only resources mirror the REST API: the document list, single documents and
 * the template catalog. Tools mutate, resources only read.
 */
export function registerResources(server: McpServer): void {
  server.registerResource(
    "resume-docs",
    "resume://docs",
    {
      title: "简历文档列表",
      description: "所有已保存简历的 id、标题、更新时间与模板。JSON。",
      mimeType: "application/json",
    },
    async (uri) => {
      const docs = await listDocs();
      return jsonContents(uri.href, { count: docs.length, docs });
    },
  );

  server.registerResource(
    "resume-doc",
    new ResourceTemplate("resume://docs/{id}", {
      list: async () => {
        const docs = await listDocs();
        return {
          resources: docs.map((doc) => ({
            uri: `resume://docs/${doc.id}`,
            name: doc.title,
            description: `简历「${doc.title}」，模板 ${catalogEntry(doc.templateId).nameZh}`,
            mimeType: "application/json",
          })),
        };
      },
    }),
    {
      title: "单份简历文档",
      description: "按 id 读取一份完整简历（数据 + 模板元数据）。JSON。",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const raw = variables.id;
      const id = Array.isArray(raw) ? raw[0] : raw;
      const doc = await readDoc(String(id));
      if (!doc) {
        throw new Error(`未找到简历 "${id}"。可通过 resume://docs 查看现有文档。`);
      }
      return jsonContents(uri.href, {
        id: doc.id,
        title: doc.title,
        updatedAt: doc.updatedAt,
        template: catalogEntry(doc.data.templateId),
        data: doc.data,
      });
    },
  );

  server.registerResource(
    "resume-templates",
    "resume://templates",
    {
      title: "模板目录",
      description: "所有可用简历模板的 id、名称、页数、默认主色与标签。JSON。",
      mimeType: "application/json",
    },
    async (uri) => jsonContents(uri.href, { templates: TEMPLATE_CATALOG }),
  );
}
