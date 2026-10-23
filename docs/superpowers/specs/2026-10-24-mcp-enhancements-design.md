# Resume Studio MCP 能力完善设计（方案 A · 精选增强）

- 日期：2026-10-24
- 状态：已实现（同日完成；版本号改由 `npm run version:sync` 机制统一管理）
- 关联：`docs/superpowers/specs/2026-10-19-mcp-design.md`（首版 MCP 设计，本篇在其之上增量）

## 1. 目标

在现有 7 工具 / 3 资源 / 2 提示词的 MCP 端点上做一轮精选增强，覆盖三个方向：

1. **工具集**：补齐 AI 高频操作，消除最大痛点——AI 只想确认页数/溢出时，`render_resume_html` 会把几十万字节 HTML 全文拉进对话。
2. **协议**：工具输出结构化（`structuredContent`）+ 请求级访问日志。
3. **接入**：settings 页一键自检，冒烟/测试/目录/文档全量同步。

验收标准：

1. 新增 `check_resume`、`duplicate_resume` 两个工具，`list_resumes` 支持可选过滤/搜索/排序，旧调用方式完全兼容。
2. 所有返回 JSON 的工具带 `structuredContent`（保留原 text 内容，旧客户端不受影响）。
3. 每次 MCP 工具调用与鉴权/Origin 拒绝都产生一行 JSON 日志。
4. settings 页可一键自检端点（initialize → tools/list）并展示结果与耗时。
5. `npm run check`、`npm test`、`npm run mcp:smoke` 全部通过；catalog 测试保持零漂移。

## 2. 非目标（明确不做）

- **PDF 导出工具**：服务端 PDF 需要无头浏览器，违背轻量 Node 依赖原则；打印 PDF 仍走编辑器/浏览器。
- **OAuth / 鉴权增强**：静态 Bearer 已覆盖单机与桌面场景。
- **有状态会话 / GET SSE**：无状态模式是首版刻意决策，保持不变（GET 仍返回 405）。
- **限流**：单机本地应用无意义。
- **分页**：本地文档库规模小，`list_resumes` 的过滤足够。
- **MCP logging capability**（server→client 通知）：主流客户端忽略，用普通日志替代。

## 3. 新工具契约

### 3.1 `check_resume`（预检）

| 项 | 内容 |
| --- | --- |
| 入参 | `id?` 或 `data?` 二选一（与 `render_resume_html` 一致），`title?` |
| 行为 | 走与渲染相同的管线（`migrateDocument` 归一化 → `renderResumeHtml`），但**只返回元数据，不返回 `html` 字段** |
| 返回 | `{ templateId, templateName, pages, bytes, title, issues }` |
| annotations | `readOnlyHint: true, openWorldHint: false` |

`issues` 由「原始输入 vs 归一化结果」的结构对比（新纯函数模块 `src/mcp/audit.ts`）生成，三类：

- `filled`：文档级缺失键被示例默认值补齐（提示"该段当前是示例内容，发布前需替换"）
- `coerced`：标量类型被无损强转（如 `"1.2"` → `1.2`）
- `dropped`：数组中不合规的行被丢弃（报路径与数量）

上限 20 条，超出折叠为计数；`issues: []` 表示文档与归一化输出一致。错误语义与 `render_resume_html` 相同（id/data 二选一、非法 id、缺失文档、非法 data）。

### 3.2 `duplicate_resume`（复制）

| 项 | 内容 |
| --- | --- |
| 入参 | `id`（源）、`newId?`（目标 id，缺省按标题自动生成）、`title?`（缺省 `原标题 · 副本`） |
| 行为 | 读源文档 → 写目标 id。目标已存在时**报错，不覆盖** |
| 返回 | `{ ok, id, title, sourceId, updatedAt, templateId }` |
| annotations | `openWorldHint: false` |

### 3.3 `list_resumes` 可选参数（全部向后兼容）

- `templateId?`：按模板精确过滤
- `query?`：标题子串搜索（大小写不敏感）
- `sort?`：`updatedAt-desc`（默认）｜ `updatedAt-asc` ｜ `title-asc` ｜ `title-desc`
- 返回结构不变（`count` + `docs`，每项含 `templateName`）

工具总数变为 **9**。`catalog.ts` 同步 3 处：`check_resume`、`duplicate_resume` 新条目，`list_resumes` 描述补充过滤参数；`MCP_WORKFLOW` 第 4 步改为「`check_resume` 确认页数与问题清单，需要成品文件时才用 `render_resume_html`」；`MCP_EXAMPLES` 增补 1–2 条。

## 4. 协议与健壮性

### 4.1 structuredContent

- 所有返回 JSON 的工具（9 个，含 `render_resume_html`）声明 `outputSchema`，成功结果同时填 `structuredContent` 与原 `text`（text 保持 `JSON.stringify(value, null, 2)`，逐字节不变）。
- schema 刻意宽松：`data` 用 `z.record(z.string(), z.unknown())`，数组元素不逐字段收紧，避免归一化补齐的示例内容触发校验失败。
- 失败结果（`isError: true`）保持纯 text，不带 `structuredContent`。
- 兜底：若 SDK 对「声明了 `outputSchema` 但错误结果缺 `structuredContent`」报错，则降级为**不声明 `outputSchema`、只填 `structuredContent`**（MCP 规范允许），行为对客户端等价。

### 4.2 访问日志

- `runTool` 增加工具名参数，每次调用结束记一行 JSON 到 `console`：`{ ts, tool, ms, ok, error? }`。
- handler 层记录请求级事件：鉴权失败、Origin 拒绝、传输异常（`{ ts, event, detail? }`）。
- 输出经 `console`，dev 直接可见，桌面版沿用现有 server.log 收集；不引入日志依赖。

## 5. 接入与体验

### 5.1 settings 页「测试连接」

- 位置：MCP 能力组顶部，按钮 + 结果面板。
- 行为：浏览器内 `fetch` 端点两次——POST `initialize`、POST `tools/list`，`Accept: application/json, text/event-stream`；响应可能为 SSE 流，`data:` 行解析抽成纯函数 `parseSseData`（新模块 `src/mcp/selftest.ts`，浏览器可用，无 node 依赖）。
- 展示：HTTP 状态、`serverInfo` 名称与版本、工具数、两次往返耗时。
- 鉴权边界：服务端启用 `RESUME_MCP_TOKEN` 时，浏览器拿不到 token，401 **不算故障**，面板明确提示「已启用鉴权，浏览器自检仅验证端点可达性，请在客户端配置 token」。
- 403（Origin 拒绝）给出 `RESUME_MCP_ALLOWED_ORIGINS` 指引。

### 5.2 同步更新

| 文件 | 变更 |
| --- | --- |
| `src/mcp/tools.ts` | 3 个新工具 + 全部 `outputSchema`/`structuredContent` |
| `src/mcp/audit.ts` | 新增：`diffNormalized` 纯函数（filled/coerced/dropped，上限 20） |
| `src/mcp/selftest.ts` | 新增：`parseSseData` 纯函数 |
| `src/mcp/util.ts` | `runTool` 带工具名与日志 |
| `src/mcp/handler.ts` | 请求级事件日志 |
| `src/mcp/catalog.ts` | 新条目 + 工作流 + 示例（`tests/mcp-catalog.test.ts` 逐字 pin） |
| `src/components/SettingsModal.tsx` | 测试连接按钮 + 结果面板 |
| `tests/tools.test.ts` | 新工具单测 + `list_resumes` 过滤用例 |
| `tests/mcp.test.ts` | InMemoryTransport 端到端覆盖新工具 |
| `tests/audit.test.ts` | `diffNormalized` 单测 |
| `scripts/mcp-smoke.mjs` | 补 `check_resume`、`duplicate_resume` |
| `README.md` | 工具表 7→9、能力描述、自检说明 |
| `package.json` / `config.ts` | 版本号 2.2.0 → 2.3.0（`MCP_SERVER_INFO` 与 `APP_VERSION` 一致） |

## 6. 测试策略

1. **单测**：`diffNormalized`（filled/coerced/dropped/上限/空）、`parseSseData`（单事件/多事件/非 JSON 行）、`list_resumes` 过滤与排序、`duplicate_resume`（成功/目标已存在/非法 id）、`check_resume`（id 与 data 两种入参、非法数据）。
2. **端到端**：InMemoryTransport 连接真实 server，`tools/list` 数量为 9，逐一 `tools/call` 新工具并校验 `structuredContent` 存在。
3. **catalog**：现有逐字比对测试自动防漂移，新条目与注册描述必须一致。
4. **冒烟**：`npm run mcp:smoke` 覆盖 initialize / tools/list / 新工具调用。
5. **手动**：Inspector 验证 structuredContent 展示；settings 页自检按钮在免鉴权与设 token 两种模式下各跑一次。

## 7. 风险与取舍

| 风险 | 处理 |
| --- | --- |
| SDK 对 outputSchema + 错误结果的行为不符预期 | 兜底降级：不声明 outputSchema，仅填 structuredContent（见 4.1） |
| `check_resume` 复用渲染管线有服务端渲染开销 | 渲染本身是纯函数遍历元素树（无浏览器），开销毫秒级；省下的是客户端对话 token，收益远大于成本 |
| 归一化对比的误报（示例内容 vs 用户有意为之） | issues 只做提示不做校验失败，工具始终成功返回；文案明确"发布前需替换" |
| 前端 SSE 解析的客户端差异 | 解析器是纯函数 + 单测；fetch 已是浏览器标准，无兼容性问题 |
| 版本号两处硬编码漂移 | 本次统一为 2.3.0 并纳入验收（`/api/mcp/info` 的 version 与 package.json 一致） |
