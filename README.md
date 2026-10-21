# RESUME STUDIO · vinext 全栈多模板简历编辑器

工业标签风简历模板 → 可视化编辑器 → **vinext（Next.js API on Vite）全栈应用**。
左侧表单实时编辑，右侧 A4 预览；支持 **多套模板 / 多页模板**、撤销重做、自动保存、文档库、发布分享、JSON / HTML / PDF 导出，并通过 **MCP** 把读写、渲染、发布能力开放给 AI 客户端。

```
Next.js App Router on Vite (vinext 1.2 / Vite 8 / React 19 RSC)
├── app/                     路由：页面、Route Handlers、发布页
├── src/
│   ├── EditorApp.tsx        编辑器（client component）
│   ├── templates/           模板注册表：industrial / industrial-duplex / minimal / moonlight / quiet
│   ├── sections/            8 个编辑面板
│   ├── server/store.ts      文件存储（.data/docs、.data/published）
│   └── ...
└── .data/                   本地数据（gitignore）
```

## 快速开始

```bash
npm install
npm run dev        # vinext dev → http://localhost:5173
```

生产：

```bash
npm run build
npm run start      # 默认 3000，被占用时：npx vinext start --port 3020
```

类型检查：`npm run check`。需要 Node 20+。

模板预览（不启动应用，直接渲染真 A4 + 截图 + 溢出测量）：

```bash
npm run preview:tpl -- moonlight      # 单个模板
npm run preview:tpl -- --all          # 全部模板
# → /tmp/tpl-preview/<id>.png (1600×2400) + <id>.html
# 输出行给出 page / flow 溢出像素与 FITS=yes|no
```

## 模板系统（多页 / 可扩展）

模板在 `src/templates/catalog.ts` 注册元数据，在 `src/templates/registry.tsx` 绑定渲染器。每个模板是一个纯函数：

```ts
type TemplateDefinition = TemplateMeta & {
  css: string;                                  // 作用域内的模板 CSS
  render: (data: ResumeData, page: number) => ReactNode; // 渲染第 page 页（0 起）
};
```

当前内置：

| 模板 | 页数 | 说明 |
| --- | --- | --- |
| `industrial` | 1 | 原版工业标签：模切卡片、钴蓝条带、信号波形 / 套准标记 |
| `industrial-duplex` | 2 | 第 1 页身份 + 简介 + 履历 + 技能，第 2 页项目档案 + 证书 + 联系 |
| `minimal` | 1 | 极简编辑排版：细规则线、大字号姓名、黑白 + 主色强调 |
| `moonlight` | 1 | 月光海报：巨月与城市剪影、彩纸碎屑、三行压缩巨字，默认 Kiwi 绿 `#97F11D` |
| `quiet` | 1 | 色卡规格表：纸白印刷风、严格网格、编号即索引，主色只做线与编号 |

新增模板只需三步：

1. 新建 `src/templates/<id>/`：一个渲染组件 + 一份以 `.t-<id>` 为根的 scoped CSS；
2. 在 `catalog.ts` 加一条元数据（名称、描述、`pages`、默认主色、标签）；
3. 在 `registry.tsx` 注册 `css` 与 `render`。

约定：页面根节点使用 `.tpl-page`，内容流包在 `.tpl-flow` 内（编辑器据此做 **逐页 A4 溢出检测**）；需要联动编辑面板的区块加 `data-panel="identity|profile|experience|projects|stack|education|flow|footer"`。

编辑器会自动：注入全部模板 CSS、渲染模板缩略图、显示页码 / 翻页器、打印与导出全部页面、切换模板时套用该模板默认主色（用户自定义主色则保留）。

## 编辑器能力

- **实时 A4 预览**：适应 / 50% / 75% / 100%，多页模板可翻页（PAGE 01 / 02）
- **点击定位**：点右侧版面任意区块 → 左侧展开对应表单
- **撤销 / 重做**：⌘Z / ⇧⌘Z；输入框内直接撤销会先提交编辑历史
- **原地增删排序**：经历、要点、项目、指标、技能、联系方式、流程步骤
- **指标高亮**：正文里 `日均 {1.2M} 单` → 蓝色等宽重点
- **模板库**：5 套实时缩略图，单击切换；模板默认主色自动适配
- **主题**：6 套主色 + 任意取色；年份徽标 / 统计 / 流程条可开关
- **溢出检测**：按当前页检测 `.tpl-flow`，超出 A4 顶部出现黄色警示
- **自动保存**：localStorage（350ms 防抖）+ 服务器静默同步
- **导出**：JSON（v2，含 `templateId`，兼容导入 v1）、自包含 HTML（全部页面）、打印 PDF
- **文档库**：服务器多份存档；打开走 `/?doc=<id>` 服务端渲染
- **发布**：`POST /api/publish` → 生成 `/p/<id>` 静态 HTML，复制链接即可分享

## 后端（vinext Route Handlers）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 + 已注册模板列表 |
| GET | `/api/docs` | 文档列表 |
| GET / PUT / DELETE | `/api/docs/:id` | 读取 / 保存 / 删除（`{ title, data }`） |
| POST | `/api/publish` | `{ id, title, html }` → `.data/published/<id>.html` |
| GET | `/p/:id` | 返回已发布的完整 HTML |

存储目录：`process.env.RESUME_DATA_DIR ?? <cwd>/.data`，文档为 JSON，发布页为自包含 HTML。
`app/page.tsx` 是 **Server Component**：读取文档列表与 `?doc=` 指定文档后传入客户端编辑器；写操作全部走 Route Handlers。

## MCP（AI 客户端接入）

同一份简历数据通过 **MCP（Model Context Protocol）** 暴露给 AI 客户端。端点是 **无状态 Streamable HTTP** 的 vinext Route Handler，纯 Node 运行时，不需要 Cloudflare 适配器。

```bash
npm run dev                                  # 端点：http://localhost:5173/api/mcp
npm run build && npm run start -- --port 3020  # 生产：http://localhost:3020/api/mcp
npm run mcp:smoke                            # HTTP 冒烟（MCP_URL 可覆盖地址）
npm test                                     # 工具单测 + InMemoryTransport 端到端
```

通用客户端配置（Streamable HTTP）：

```json
{
  "mcpServers": {
    "resume-studio": {
      "url": "http://localhost:5173/api/mcp",
      "headers": { "Authorization": "Bearer <RESUME_MCP_TOKEN>" }
    }
  }
}
```

- Claude Code：`claude mcp add --transport http resume-studio http://localhost:5173/api/mcp`
- 仅支持 stdio 的客户端（如 Claude Desktop）：`npx mcp-remote http://localhost:5173/api/mcp`
- 调试：`npx @modelcontextprotocol/inspector`，Transport 选 Streamable HTTP 并填写 URL。

### Tools

| 工具 | 说明 |
| --- | --- |
| `list_resumes` | 列出文档（id / 标题 / 更新时间 / 模板） |
| `get_resume` | 读取完整 `ResumeData` + 模板元数据 |
| `save_resume` | 新建（缺省 id 自动生成）或整份覆盖 |
| `patch_resume` | RFC 7386 Merge Patch 局部修改（`null` 删除字段） |
| `delete_resume` | 删除，幂等 |
| `render_resume_html` | 服务端渲染多页自包含 HTML（可传 `id` 或临时 `data`） |
| `publish_resume` | 渲染并写入 `.data/published`，返回 `/p/<id>` |

### Resources / Prompts

- `resume://docs`、`resume://docs/{id}`、`resume://templates`（只读 JSON）
- `tailor_resume_to_job`（按 JD 定制）、`polish_resume`（润色文案）：引导模型先读后改、保留 `{指标}` 写法

### 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `RESUME_DATA_DIR` | `<cwd>/.data` | 文档与发布页目录，与 REST 共用 |
| `RESUME_MCP_TOKEN` | 空 | 设置后要求 `Authorization: Bearer <token>`；空 = 不鉴权（建议仅本机） |
| `RESUME_MCP_ALLOWED_ORIGINS` | 空 | 额外允许的浏览器 Origin，逗号分隔 |
| `RESUME_PUBLIC_URL` | 空 | 发布结果返回绝对地址 |

### 传输与安全

- `POST /api/mcp` 承载 JSON-RPC，响应按 Streamable HTTP 返回 SSE 流；`GET` 返回 `405`（无状态端点不提供独立 SSE 流），`OPTIONS` 处理 CORS 预检。
- 每个请求新建 server + transport，不保存会话；请求体上限 4 MiB、文档上限 2 MiB。
- 浏览器请求带 `Origin` 时必须与 Host 一致或命中 `RESUME_MCP_ALLOWED_ORIGINS`，否则 `403`。
- `render_resume_html` 使用 `src/mcp/render.ts` 的元素树序列化器（RSC 环境会禁用 `react-dom/server`），产出与编辑器导出的 HTML 同构。

## 目录

```
app/
├── layout.tsx               Metadata + 全局 editor.css
├── page.tsx                 SSR：listDocs / readDoc → <EditorApp/>
├── icon.svg
├── api/health|docs|publish  Route Handlers
├── api/mcp/route.ts         MCP Streamable HTTP 端点
└── p/[id]/route.ts          发布页
src/
├── EditorApp.tsx            编辑器外壳（工具栏 / 表单 / 预览 / 打印层）
├── mcp/
│   ├── handler.ts           鉴权 / Origin / 无状态 transport 生命周期
│   ├── server.ts            createMcpServer：注册三原语 + instructions
│   ├── tools.ts             7 个工具
│   ├── resources.ts         3 个只读资源
│   ├── prompts.ts           2 个提示词模板
│   ├── render.ts            SSR 元素树 → 自包含 HTML
│   └── config.ts            环境变量与限制
├── templates/
│   ├── catalog.ts           模板元数据（服务端安全）
│   ├── registry.tsx         模板注册 + CSS 聚合
│   ├── types.ts             TemplateDefinition 契约
│   ├── industrial/          pages.tsx + styles.ts（原版 + 双页）
│   ├── minimal/             MinimalPage.tsx + styles.ts
│   ├── moonlight/           MoonlightPage.tsx + styles.ts（暗底海报）
│   └── quiet/               QuietPage.tsx + styles.ts（纸白规格表）
├── components/              Accordion / fields / TemplatePicker / LibraryModal
├── sections/                8 个编辑面板
├── lib/                     store / overflow / backend / exporters / migrate
├── server/store.ts          fs 存储
├── styles/                  editor.css、pages.ts（A4 + 导出壳）
├── data/defaultResume.ts    示例内容
└── types.ts                 ResumeData v2
tests/                       工具单测 + MCP 端到端
scripts/mcp-smoke.mjs        真实 HTTP 冒烟
```

## 打印 / 字体

- 打印：A4、边距「无」、勾选「背景图形」；多页模板每页自动分页。
- 字体使用系统自带：DIN Condensed、HarmonyOS Sans SC、SF Mono（含 Arial Narrow / PingFang 回退）。
- 导出的 HTML 与发布页不依赖本项目 JS/CSS，可独立打开与二次分发。

## 桌面版（Tauri）

Tauri 只提供 WebView，而本项目是 Node 全栈服务（Route Handlers + 文件存储 + MCP）。
因此桌面壳内置一份 Node 运行时：启动时挑一个空闲端口拉起 `vinext start`，等端口就绪再开窗口，
退出时杀掉子进程。

```bash
npm run desktop:runtime   # 构建 + 组装 runtime/（node + node_modules + dist，约 250MB）
npm run desktop:build     # 上一步 + tauri build → .app / .dmg
npm run desktop:dev       # 只调壳：窗口指向已在跑的 http://localhost:5173
```

产物：`src-tauri/target/release/bundle/{macos,dmg}`。

- `runtime/` 里的 node 会按宿主架构 `lipo -thin`；依赖用 `npm ci --omit=dev` 装出**真实的生产树**（不手工裁剪，避免删掉 `rolldown` 这类运行时传递依赖）。
- 组装脚本自带冒烟：把 `runtime/` 复制到**项目目录之外**再起服务、拉 `/api/health` 与首页。必须隔离，否则 Node 会沿目录向上找到项目自己的 `node_modules`，把缺失依赖藏起来。
- 应用数据目录：`~/Library/Application Support/dev.linzhiyuan.resume-studio`（文档库与 `server.log`）。
- 已知限制：macOS 的 WKWebView 不支持 `window.print()`，桌面版导出 PDF 请走「导出 HTML」再在浏览器打印。

## CI（GitHub Actions）

`.github/workflows/desktop.yml`：

- `verify`：`npm run check` + `npm test`（ubuntu）
- `bundle`：矩阵构建 **macOS arm64**（`.app` + `.dmg`）与 **Windows x64**（NSIS `.exe`），产物上传到 Actions artifacts（保留 30 天）
- `release`：打 `v*` tag 时自动创建 **GitHub Release**，附上三个安装包（`.dmg` / `.app.zip` / `-setup.exe`），发行说明按提交自动生成

触发方式：手动 `workflow_dispatch`、push 到 `master`/`main` 且改动 `src-tauri/**` 等桌面相关路径、或打 `v*` tag。

发版：`git tag v2.1.0 && git push origin v2.1.0` —— 构建完成后自动出现在仓库 Releases 页面。
macOS 任务在打包后会**把 .app 复制到 /tmp 并真启动一次**、拉 `/api/health` 验证，避免「job 绿但产物打不开」。

## 说明

- 目标运行时为 **Node**（vinext 的 Node 平台），MCP 端点同样跑在 Node 上；本期不考虑 Cloudflare Workers。如果部署到 Workers，需要把 `src/server/store.ts` 换成 KV/R2/D1 实现，其余代码不变。
- MCP 设计文档：`docs/superpowers/specs/2026-10-19-mcp-design.md`。
- vinext 仍处于快速迭代期，本项目只使用其稳定的 App Router / Route Handler 能力。
