# AGENTS.md

给 AI 编码代理在本仓库工作的指引。人类读者请看 [README.md](README.md)。

## 项目是什么

Resume Studio——多模板简历编辑器：

- **Web**：vinext（Next.js App Router on Vite）+ React 19 RSC，全栈跑在 Node（Route Handlers + 内嵌 libSQL 本地库，`src/server/db.ts` 打开 `<RESUME_DATA_DIR>/resume-studio.db`，不用浏览器 localStorage）。
- **桌面**：Tauri 壳 + 内置 Node 运行时拉起 `vinext start`；窗口加载 `http://127.0.0.1:<port>`。IPC 面最小：capability（`src-tauri/capabilities/desktop.json`）只给 localhost 来源授 `notification:default`。托盘、关窗驻留、后台更新轮询（Rust 每小时拉本机 `/api/update`）、壳日志 `shell.log` 与「反馈问题」都在 Rust 侧（`src-tauri/src/{tray,updater,logger,server}.rs`），设计见 `docs/superpowers/specs/2026-10-27-desktop-capabilities-design.md`。
- **AI 接入**：同一份数据通过 MCP（Streamable HTTP，`/api/mcp`）暴露给客户端。

目标运行时是 **Node 20+**；不考虑 Cloudflare Workers。

## 常用命令

```bash
npm run dev          # vinext dev → http://localhost:5173
npm run check        # tsc --noEmit
npm test             # node:test（含 MCP 端到端与模板契约测试）
npm run preview:tpl -- <id|--all>   # 真实 A4 渲染 + 截图 + 溢出测量（headless Edge，EDGE_BIN 可覆盖）
npm run tpl:new <id> "中文名"        # 脚手架：生成模板并注册
npm run version:sync # 把 package.json 版本同步到 tauri.conf.json / Cargo.toml / mcp config
npm run build && npm run start      # 生产（默认 3000）
npm run desktop:build               # version:sync → 组装 runtime → tauri build
```

**完成的口径**：`npm run check` 与 `npm test` 全绿；改了 `src-tauri/` 还要 `cargo test`（在 src-tauri/ 下）全绿。commit 信息用 Conventional Commits（`feat(editor): …`），风格对照 `git log`。

## 工作区雷区

- **常有并行会话同时改这个仓库**：动手前和提交前都重新看 `git status`；只 `git add` 自己改过的文件，禁止 `git add -A` / `git commit -a`；不要 checkout 含他人未提交改动的文件。
- 本机 **curl 访问 localhost 会被系统代理劫持（502）**：用 `curl --noproxy '*' http://localhost:…`。
- `vinext dev` 有**项目级锁文件**，起第二个实例用 `VINEXT_NO_DEV_LOCK=1`。
- 含中文的路径下写脚本时，文件 URL 必须过 `fileURLToPath`，不能直接用 `URL.pathname`（会被百分号编码）。

## 单一来源（改错位置会破坏一致性，测试会拦）

| 事实 | 唯一来源 | 派生 / 护栏 |
| --- | --- | --- |
| 应用版本 | `package.json` | `npm run version:sync` 同步其余三处；`tests/version-sync.test.ts` 拦漂移 |
| 模板注册 | `src/templates/registry.tsx`（每模板一次 `defineTemplate()`） | `catalog.ts` 是派生元数据，**不要手改**；`tests/template-contract.test.ts` 强制契约 |
| 模板开发规范 | `docs/template-authoring.md` | 契约由 `src/templates/validate.tsx`（仅测试/脚本可用）执行 |
| 编辑面板联动 id | `src/templates/types.ts` 的 `PANEL_IDS` | `EditorApp.PANELS` 用 `PanelLink` 类型锁定 |
| MCP 能力清单 | `src/mcp/catalog.ts` | 与真实注册**逐字**比对（`tests/mcp-catalog.test.ts`） |
| 编辑器 chrome 视觉 | `src/styles/editor.css` `:root` 的 `--ed-*` 令牌 | 灰/边框/圆角/字号一律用令牌，不加新字面值 |

## 代码约定

- 模板纸张样式（`src/styles/pages.ts` + `src/templates/*/styles.ts`）与编辑器 chrome（`editor.css`）是**两套设计系统**，互不引用；`.tpl-page > .tpl-flow` 结构与 `data-panel` 是两者的契约。
- `react-dom/server` 在应用运行时被禁用（RSC）：服务端渲染 HTML 走 `src/mcp/render.ts` 的序列化器；`src/templates/validate.tsx` 与 `scripts/template-preview.tsx` 只在测试/脚本环境用 `renderToStaticMarkup`。
- 编辑器壳层的组件类名带 `ed-` 前缀；模板内部类名全部作用域在 `.t-<id>` 下——新模板用各自短前缀（quiet → `.qt-*`、minimal → `.mn-*`、moonlight → `.ml-*`），industrial 是历史实现（裸类名 + 作用域）。
- 富文本约定：正文的 `{1.2M}` 用 `rich()`（`src/templates/kit.tsx`）转 `<b>`。

## 设计类改动的工作流

非平凡的功能/重构先写设计文档到 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`（模板参照既有 spec：背景 → 非目标 → 设计 → 验收 → 风险），实现计划放 `docs/superpowers/plans/`。已有 spec 先读：更新提醒（2026-10-24）、编辑器一致性（2026-10-24）、模板工厂（2026-10-24）、MCP 设计（2026-10-19）。

## 桌面版注意

- 桌面数据目录：`~/Library/Application Support/dev.linzhiyuan.resume-studio`。
- macOS WKWebView 不支持 `window.print()`；桌面导出 PDF 走「导出 HTML」再浏览器打印。
- `runtime/` 冒烟测试必须在项目目录**之外**复制运行，否则 Node 会向上找到项目 `node_modules` 掩盖缺依赖。
