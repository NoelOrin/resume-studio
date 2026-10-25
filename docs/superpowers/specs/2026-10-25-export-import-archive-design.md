# 导出 / 导入增强 + 存档库设计

日期：2026-10-25
状态：已确认（方案 A：MCP render 序列化器 + headless Edge CLI，零新依赖）

## 目标

1. **导出整合与新格式**：工具栏「导出」下拉菜单统一四种格式（JSON / HTML / PDF / PNG 长图）；
   PDF 与 PNG 由服务端 headless Edge 渲染，Web 与桌面端行为一致，PDF 不再依赖浏览器打印对话框。
2. **导入增强**：导入 JSON 时可选「存为新文档入库」（自动保存接管）或「替换当前编辑」（现行为）。
3. **防崩溃自动保存**：未入库文档的编辑内容以本地草稿（localStorage）兜底，崩溃/误关后重开可恢复。
4. **存档库**：每次导出成功，产物自动归档到服务端 `.data/archive/`；存档面板可重新下载、删除、清空。
5. **MCP 同步暴露**：新增 `render_resume_pdf` / `render_resume_png` / `list_archives` 三个工具，
   能力清单（`src/mcp/catalog.ts`）同步维护。

非目标（本期不做）：

- Markdown / Word (docx) 导出
- 发布产物（`.data/published/`）并入存档库（发布已有自己的存储与 `/p/<id>` 语义）
- 存档去重、压缩、容量自动清理（只提供手动删除/清空）
- 草稿跨设备同步（草稿是本机崩溃兜底，不是同步机制）
- 客户端 canvas 截图方案

## 背景与约束

- 单文档导出已存在：JSON / HTML 走客户端（`src/lib/exporters.ts`），PDF 走 `window.print()`
  （桌面 WKWebView 不支持，只能「导出 HTML → 浏览器打印」，是本期要消灭的短板）。
- **自动保存的现状缺口**：`src/EditorApp.tsx` 的 autosave effect 要求 `docId` 存在；
  新文档没点过「保存」前内容只在 React state 里，localStorage 只存标题与 docId——崩溃即全丢。
- 服务端把文档渲染成完整 HTML 的能力已存在：`renderResumeHtml()`（`src/mcp/render.ts`，
  手写序列化器，RSC 环境安全），MCP 的 `render_resume_html` 与发布兜底都在用。
- headless Edge 已有使用先例：`scripts/template-preview.tsx` 用 `--screenshot` / `--dump-dom`
  做截图与测量；Edge/Chrome 同样支持 `--print-to-pdf`。
- 模板均为 A4 固定页（`.tpl-page` 210×297mm），页数由 `pageCountOf()` 给出。
- API 校验口径沿用 `ce20484`：无效文档在入口处用 `migrateDocument` 拒绝。
- 工作区常有并行会话，实现期改动尽量收敛在新文件，侵入点见「单元划分」。

## 架构

```
编辑器 (EditorApp)
 ├─ 导出菜单 JSON/HTML ──客户端生成──▶ 下载 + POST /api/archive（归档）
 ├─ 导出菜单 PDF/PNG ──POST /api/export/[format]──▶ artifacts.buildArtifact()
 │                                                    ├─ renderResumeHtml() 完整 HTML
 │                                                    ├─ 临时文件 + headless Edge 子进程
 │                                                    │    --print-to-pdf / --screenshot
 │                                                    └─ writeArchive() 归档 ─▶ 响应二进制
 ├─ 导入 ──migrateDocument──▶ confirm：「存为新文档」/「替换当前」
 ├─ 草稿 effect ──debounce 800ms──▶ localStorage（无论有无 docId）
 └─ ArchiveModal ──GET/DELETE /api/archive[/id]──▶ src/server/archive.ts
                                                     └─ .data/archive/<id>.<ext> + index.json

MCP: render_resume_pdf / render_resume_png ──▶ 同一个 artifacts.buildArtifact()
     list_archives ──▶ archive.listArchives()
```

关键决策：

- **渲染进服务端、归档在服务端**：PDF/PNG 由 Route Handler 产出并直接归档，前端只负责触发与下载；
  JSON/HTML 在客户端生成（现状），归档走一个独立的 `POST /api/archive`。两条路最终都进同一个存档库。
- **探测链兜底**：`EDGE_BIN` 环境变量 → Edge → Chrome → Chromium →（无）抛 `NO_BROWSER`。
  前端收到后引导用户改用「打印」对话框；JSON/HTML/存档不受影响。
- **产物以存档为容器**：MCP 渲染产物也写入存档库并返回 `archiveId`，AI 客户端与编辑器
  看到同一份产物列表，不另开存储。

## 单元划分

### 1. `src/server/artifacts.ts`（新，渲染管线核心）

- `NoBrowserError`（`code: "NO_BROWSER"`）。
- `probeBrowserBin(): string | null`：探测顺序 `EDGE_BIN` →
  `/Applications/Microsoft Edge.app/...` → `Google Chrome.app/...` → `Chromium.app/...`
  →（PATH 中 `microsoft-edge` / `google-chrome` / `chromium`）→ null；结果按进程缓存。
- `buildArtifact(format: "pdf" | "png", data: ResumeData, title: string):
  Promise<{ bytes: Buffer; filename: string; pages: number }>`：
  1. `renderResumeHtml(data, title)` 得完整 HTML；
  2. `fs.mkdtemp` 写临时 html；`execFile` 起无头浏览器：
     - PDF：`--headless=new --disable-gpu --no-sandbox --no-pdf-header-footer
       --print-to-pdf=<out> file://<tmp>`；
     - PNG：页数 `pages = pageCountOf(getTemplate(data.templateId), data)`，窗口高度
       `pages * 1123 + 24`，`--force-device-scale-factor=2 --window-size=794,<H>
       --screenshot=<out> file://<tmp>`（页数上限 20，防超大图）；
  3. 超时 30s kill 并 reject；`finally` 清理临时目录；
  4. 读产物 bytes，filename 用 `fileBase(title)` + 后缀。
- 不含 HTTP 与存储逻辑（Route Handler 与 MCP 工具各自包装），便于单测。

### 2. `src/server/archive.ts`（新，存档存储）

- 目录 `RESUME_DATA_DIR`（同 store.ts 约定）下 `archive/`；产物文件 `<id>.<ext>`；
  元数据集中在 `archive/index.json`（单用户单进程，读-改-写即可）。
- 记录：`{ id, title, format: "json"|"html"|"pdf"|"png", filename, bytes, templateId?,
  pages?, docId?, createdAt }`；`id` 为 `<base36 时间戳>-<4 位随机>`，满足 `isValidId`。
- API：`listArchives()`（按 createdAt 倒序）、`writeArchive(format, filename, content:
  Buffer|string, meta)`、`readArchive(id)`、`deleteArchive(id)`、`clearArchives()`。
- 校验：format 白名单、内容大小上限 20MB、filename 清洗（复用 `fileBase`）。

### 3. Route Handlers（新 3 个文件）

- `app/api/export/[format]/route.ts`：POST `{ data, title }` → `migrateDocument` 拒无效 →
  `buildArtifact` → `writeArchive` → 二进制响应（`Content-Disposition: attachment`，
  文件名 RFC 5987 编码支持中文）。归档写失败不阻断下载（响应头标注 `x-archive: miss`）。
  `format` 非 pdf/png → 404。
- `app/api/archive/route.ts`：GET 列表；POST 客户端产物归档 `{ title, format, filename,
  content /* base64 编码，统一按二进制语义解码为 Buffer */, meta }` → 201 `{ id }`。
  客户端 JSON/HTML 导出时 `btoa(unescape(encodeURIComponent(text)))` 编码后上报。
- `app/api/archive/[id]/route.ts`：GET 产物内容（下载）；DELETE 删除。清空走
  `DELETE /api/archive?all=1`（与 [id] 路由并存，[id] 优先匹配）。

### 4. 编辑器 UI（改 `src/EditorApp.tsx`，新 `ArchiveModal.tsx`）

- 工具栏 io-group 重排为 `模板 | 导入 | 导出▾ | 存档`，打印/保存/发布留在原组。
  「导出▾」为简单下拉（ed- 令牌样式，Esc/外点关闭，不引组件库）：JSON / HTML / PDF / PNG。
- 导出行为：
  - JSON / HTML：沿用现有客户端生成 + `download()`，成功后静默 `POST /api/archive`；
  - PDF / PNG：POST 导出路由 → blob 下载；`NO_BROWSER` 时 notify「未检测到 Edge/Chrome，
    无法服务端导出，可使用『打印』对话框导出 PDF」。
- 导入增强：`migrateDocument` 成功后 `window.confirm("存为新文档入库？（取消 = 替换当前编辑）")`
  ——与现有 `removeDoc` 的 confirm 风格一致。「确定」→ 生成新 id、`putDoc`、`setDocId(新id)`、
  `replace(parsed)`（自动保存随即接管）；「取消」→ 现行为（脱离 docId，手动保存才入库）。
- `ArchiveModal`：仿 `LibraryModal` 结构。列：filename、格式徽标、人类可读大小、时间、
  来源（title + 模板名）；行操作「下载 / 删除」；头部「清空」（confirm）；空态文案。
  入口为工具栏「存档」按钮，打开时刷新列表。

### 5. 草稿自动保存 `src/lib/draft.ts`（新）

- `Draft = { title, data, docId: string | null, savedAt: number }`，key `rs-draft-v1`。
- `saveDraft / loadDraft / clearDraft`：localStorage 读写，quota 异常静默吞掉。
- **恢复决策是纯函数**（可单测）：`shouldRestoreDraft(urlHasDoc: boolean, draft: Draft | null):
  boolean` —— 仅当「URL 无 `?doc=`」且草稿存在时恢复；有 `?doc=` 时服务端文档是事实源，
  忽略并清除草稿。
- 写入时机：EditorApp 新增 effect，`[data, title, docId]` 变化后 debounce 800ms 写草稿
  （**无论有无 docId**——docId 有值时草稿是第二道保险）。
- 恢复时机：编辑器 mount 后（`?doc=` 缺失时）`replace(draft.data)` + notify
  「已恢复上次未保存的草稿 · <时间>」。恢复动作在首帧之后进行，不做 SSR 抢渲染，避免水合不一致。
- 「保存 / 发布」成功与「新建副本」时 `clearDraft()`。

### 6. MCP 工具（改 `src/mcp/tools.ts` + `catalog.ts`）

- `render_resume_pdf` / `render_resume_png`：inputSchema 沿用 `render_resume_html` 的
  `id | data` 二选一 + `title?`；执行 `buildArtifact` → `writeArchive` →
  输出 `{ archiveId, path, filename, bytes, pages, templateName }`。
  `NO_BROWSER` 抛带指引文案的工具错误。
- `list_archives`：无入参，输出 `{ archives: [{ id, filename, format, bytes, createdAt, title }] }`。
- `catalog.ts` 能力清单同步增补（逐字比对测试会拦漂移）；MCP info / prompts 不动。

### 7. 样式与常量

- `EXPORT_PAGE_CSS`（`src/styles/pages.ts`）按需增补打印语义：`@page { size: A4; margin: 0 }`
  与 `.tpl-page { page-break-after: always }`（实现时以五模板 PDF 页数验证为准，缺什么补什么）。
- 编辑器 chrome 一律用 `--ed-*` 令牌，下拉菜单与 ArchiveModal 不引入新字面值。

## 测试

- `tests/artifacts.test.ts`：probe 探测链顺序与缓存；`buildArtifact` 的 spawn 参数断言
  （mock `child_process`）与超时 kill；`NO_BROWSER` 路径。真实浏览器端到端（真出一份 PDF/PNG）
  在本机跑：找不到浏览器二进制时 skip，不卡 CI。
- `tests/archive.test.ts`：CRUD、index.json 一致性、format/大小校验、id 合法性、清空。
- `tests/draft.test.ts`：`shouldRestoreDraft` 决策表；saveDraft 的 quota 异常静默（注入 mock storage）。
- 路由层：无效 format / 无效文档 / 归档超限的拒绝路径，纳入现有测试基建口径。
- MCP：`tests/mcp-catalog.test.ts` 自动覆盖新工具清单；mcp smoke 增补 `list_archives`
  调用（`render_resume_pdf` 冒烟依赖浏览器，同上 skip 语义）。
- 完成口径不变：`npm run check` + `npm test` 全绿，`npm run preview:tpl -- --all` 无回归；
  版本随 feat bump（2.3.0 → 2.4.0）并 `npm run version:sync`。

## 验收

1. 「导出」菜单四种格式均可下载；每次导出后存档面板出现对应产物（四种格式、来源正确）。
2. `EDGE_BIN` 指向不存在路径且无 Chrome/Edge 时：PDF/PNG 报 NO_BROWSER 并提示打印兜底，
   JSON/HTML 导出与存档不受影响。
3. 五个模板的服务端 PDF 页数与 `pageCountOf` 一致、页尺寸为 A4（`preview:tpl` 口径）。
4. 导入 JSON 选「存为新文档」后文档入库，编辑 2.2s 内自动保存接管；选「取消」保持现行为。
5. 新文档键入内容后立即杀掉进程/窗口，重开（无 `?doc=`）恢复草稿并有提示；有 `?doc=` 时不恢复。
6. MCP：`list_archives` 列出产物；`render_resume_pdf`（有浏览器时）产物入库并返回 archiveId；
   能力清单一致性测试通过。
7. 桌面端（内置 runtime）全流程可用，无新增打包依赖。

## 风险

| 风险 | 应对 |
| --- | --- |
| `--print-to-pdf` 分页/边距与浏览器打印不一致 | `EXPORT_PAGE_CSS` 显式补 `@page` 与 page-break；验收 3 逐模板验证 |
| 用户机器无 Chromium 系浏览器（macOS Edge/Chrome 覆盖率很高但非 100%） | 探测链 + NO_BROWSER 明确降级路径，打印对话框兜底 |
| 多页 PNG 超大（页数 ×2 缩放） | 页数上限 20；超限报错 |
| localStorage 写入失败（quota/隐私模式） | try/catch 静默；服务端 autosave 对已入库文档仍是主保护 |
| 并行会话冲突 | 新逻辑收敛在新文件；EditorApp/tools/catalog 是仅有的共享侵入点，动手前与提交前重看 `git status`，只 add 自己的文件 |
