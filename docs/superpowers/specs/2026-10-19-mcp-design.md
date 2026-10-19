# Resume Studio MCP 能力设计（Node 运行时）

- 日期：2026-10-19
- 状态：已确认，待实现
- 关联：Resume Studio v2.0（vinext 全栈 / Node 存储）

## 1. 目标

把 Resume Studio 的简历读写、模板渲染、发布能力通过 **MCP（Model Context Protocol）** 暴露给 AI 客户端（Claude Code / Cursor / DSH 等）。

验收标准：

1. 客户端用 URL `http://<host>:<port>/api/mcp` 即可接入，完成 `initialize → tools/list → tools/call`。
2. 7 个工具可用，读写落到现有 `.data/docs`，渲染/发布服务端完成。
3. 应用保持 **Node 运行时**：不引入 Cloudflare Workers 适配器，`npm run build` / `npm run start` 在 Node 下通过。
4. 有自动化测试：工具单测 + SDK 端到端测试 + 真实 HTTP 冒烟脚本。

## 2. 非目标

- 不做 Cloudflare Workers 部署适配（KV / R2 / D1）。
- 不实现 legacy HTTP+SSE 传输（`SseServerTransport`）；使用标准 **Streamable HTTP**（其 SSE 流式响应已覆盖"HTTP/SSE"诉求）。
- 不做 OAuth；鉴权用可选静态 Bearer Token。
- 不改动编辑器 UI 行为与现有 REST 路由。

## 3. 架构

```
MCP 客户端
   │  Streamable HTTP（POST 携带 JSON-RPC，响应可为 SSE 流）
   ▼
app/api/mcp/route.ts             vinext Route Handler（Node）
   └─ src/mcp/handler.ts         handleMcpRequest(Request) → Response
        ├─ 鉴权 / Origin 校验 / 请求体大小限制
        └─ 每请求：createMcpServer() + WebStandardStreamableHTTPServerTransport（无状态）
             ├─ tools.ts     7 个工具（纯函数 + zod schema）
             ├─ resources.ts resume://docs、resume://docs/{id}、resume://templates
             ├─ prompts.ts   tailor_resume_to_job、polish_resume
             └─ render.ts    元素树序列化器 → 多页自包含 HTML（RSC 兼容）
```

复用：`src/server/store.ts`（node:fs 文档存储）、`src/lib/migrate.ts`（文档校验/归一化）、`src/templates/registry.tsx`（模板注册）、`src/styles/pages.ts`（A4 / 导出 CSS）。

渲染不走 `react-dom/server`：vinext dev 的路由处理器运行在 RSC 环境，该模块被替换为直接抛错的 shim。模板本身是纯函数（无 hooks），因此 `render.ts` 用 `isValidElement` 遍历元素树并序列化为 HTML（属性名转换、style 对象、SVG 大小写、void 元素、转义）。这样 dev 与生产 Node 构建行为一致。

**无状态**：每个 HTTP 请求新建 `McpServer` + transport，不维护 session；请求结束（JSON 响应或 SSE 流关闭）后关闭 server。符合 Streamable HTTP 无状态模式，便于多实例与重启。

## 4. MCP 原语契约

### 4.1 Tools

| 名称 | 入参 | 行为 |
| --- | --- | --- |
| `list_resumes` | 无 | 列出文档：`id / title / updatedAt / templateId` |
| `get_resume` | `id` | 返回 `{ id, title, updatedAt, template, data }`；不存在报错 |
| `save_resume` | `id?`, `title`, `data` | 新建（缺省 id 自动生成）或整份覆盖；经 `migrateDocument` 归一化 |
| `patch_resume` | `id`, `patch` | RFC 7386 JSON Merge Patch（`null` 删除键），合并后校验再写 |
| `delete_resume` | `id` | 删除，返回是否实际删除 |
| `render_resume_html` | `id?` 或 `data?`, `title?` | 服务端渲染全部页面为自包含 HTML，返回 HTML 文本 |
| `publish_resume` | `id`, `title?` | 渲染并写入 `.data/published/<id>.html`，返回 `/p/<id>` |

约定：

- 工具名 `snake_case`，描述写清"用途 + 返回内容 + 限制"。
- 所有工具 `try/catch`，失败返回 `{ content, isError: true }` 且信息可操作。
- 返回文本为格式化 JSON（HTML 工具返回原始 HTML）。
- id 规则沿用 `isValidId`：`^[a-z0-9][a-z0-9-]{0,63}$`；自动生成时用 `crypto.randomUUID` 后缀。
- 请求体上限 4 MiB（transport `maxRequestBodySize`），文档数据另限 2 MiB。

### 4.2 Resources

| URI | 内容 |
| --- | --- |
| `resume://docs` | 文档列表（JSON） |
| `resume://docs/{id}` | 单份文档 + 模板元数据（JSON） |
| `resume://templates` | 模板目录（JSON） |

### 4.3 Prompts

| 名称 | 参数 | 用途 |
| --- | --- | --- |
| `tailor_resume_to_job` | `jobDescription`, `resumeId?` | 引导 AI 先读简历，再按 JD 用 `patch_resume` 改动 |
| `polish_resume` | `resumeId?`, `focus?` | 引导润色文案并保持指标花括号格式 |

## 5. HTTP / 安全

- 路径：`/api/mcp`，`POST`（JSON-RPC）、`GET`（客户端请求 SSE；无状态模式返回 405，`Allow: POST, DELETE`）、`DELETE`（关闭会话）、`OPTIONS`（CORS 预检）。
- 鉴权：`RESUME_MCP_TOKEN` 存在时要求 `Authorization: Bearer <token>`，缺省/错误返回 401 + `WWW-Authenticate`；未设置则跳过（默认仅本机使用）。
- Origin 校验：请求带 `Origin` 且 host 与请求 Host 不一致时，除非命中 `RESUME_MCP_ALLOWED_ORIGINS`（逗号分隔）否则 403，防 DNS rebinding / 浏览器跨站调用。
- 响应头：`cache-control: no-store`、`x-content-type-options: nosniff`。

## 6. Node 运行时

- 依赖仅 `@modelcontextprotocol/sdk`、`zod`；不使用任何 `@cloudflare/*` 或 `wrangler`。
- 存储保持 `node:fs`；渲染用 `react-dom/server`（Node 条件）。
- 验收命令：`npm run check`、`npm test`、`npm run build`、`npm run start`，再跑 `npm run mcp:smoke`。

## 7. 文件清单

```
app/api/mcp/route.ts          传输入口（GET/POST/DELETE/OPTIONS）
src/mcp/handler.ts            鉴权、Origin 校验、无状态 transport 生命周期
src/mcp/server.ts             createMcpServer()：注册三原语 + instructions
src/mcp/tools.ts              7 个工具（zod schema + handler）
src/mcp/resources.ts          3 个资源
src/mcp/prompts.ts            2 个提示词
src/mcp/render.ts             元素树 → 自包含 HTML
src/mcp/util.ts               id 生成、JSON 响应封装、错误包装
src/mcp/config.ts             环境变量与常量
tests/tools.test.ts           工具单测（临时 RESUME_DATA_DIR）
tests/mcp.test.ts             InMemoryTransport 端到端
scripts/mcp-smoke.mjs         真实 HTTP 冒烟
```

## 8. 测试策略

1. **工具单测**：临时目录 + 环境变量隔离；覆盖 save → get → patch → render → publish → delete、非法 id、缺失文档、非法数据。
2. **协议端到端**：`InMemoryTransport.createLinkedPair()` + SDK `Client`，验证 `tools/list`、`resources/list`、`prompts/list`、`tools/call`。
3. **HTTP 冒烟**：对已启动服务发 `initialize`、`tools/list`、`tools/call(list_resumes)`，兼容 SSE 与 JSON 响应。
4. 手动：`npx @modelcontextprotocol/inspector` 可填 URL 调试。

## 9. 风险与取舍

| 风险 | 处理 |
| --- | --- |
| vinext dev 的 RSC 环境禁用 `react-dom/server` | 已实测：改为自研元素树序列化器（`render.ts`），dev 与生产构建均验证通过 |
| SSE 长连接 | 冒烟脚本按 SSE 解析验证；`GET` 在无状态模式下直接返回 405，避免半开连接 |
| 无状态模式下客户端 `GET` 预期落空 | 返回明确 405 + `Allow` 头，并在文档中说明 |
| 大文档写放大 | 4 MiB 请求上限 + 2 MiB 数据上限 + 前端 350ms 防抖不受影响 |
