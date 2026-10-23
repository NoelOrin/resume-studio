# Resume Studio 检查更新 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在顶部弹窗式设置页里提供「检查更新」：显示当前版本，向 GitHub Releases 查询最新版本，有新版本时给出更新说明与下载引导。

**架构：** 纯函数（版本比较 / 挑安装包 / 说明摘要）→ 服务端 Route Handler（GitHub API + 10 分钟缓存 + 降级）→ `useUpdateCheck` hook（自动/手动检查、sessionStorage 去重）→ `SettingsModal` 展示组件 → `EditorApp` 接线。桌面版不改 Rust：检查走内置 Node 服务端，下载链接用「打开 + 复制链接」双通道。

**技术栈：** React 19 + TypeScript + vinext/Vite；测试用 `node:test` + `tsx`。

**规格：** `docs/superpowers/specs/2026-10-23-update-check-design.md`

---

## 文件结构

| 文件 | 职责 |
| --- | --- |
| `src/lib/version.ts`（创建） | 当前版本与仓库地址常量（`package.json` 为唯一来源） |
| `src/lib/update.ts`（创建） | 纯逻辑：`parseVersion` / `compareVersions` / `isNewer` / `pickAsset` / `summarizeNotes` / `buildUpdateCheck` |
| `tests/update.test.ts`（创建） | 上述纯函数单测（12 项） |
| `app/api/update/route.ts`（创建） | `GET /api/update`：查 GitHub Releases，缓存与降级，恒返回 200 + UpdateCheck |
| `src/lib/backend.ts`（修改） | 新增 `fetchUpdateCheck()` 客户端封装 |
| `src/lib/useUpdateCheck.ts`（创建） | 检查状态机 + 3 秒静默自检 + 当天去重 |
| `src/components/SettingsModal.tsx`（创建） | 设置弹窗：关于 / 检查更新 / MCP 能力三个区块 |
| `src/EditorApp.tsx`（修改） | 工具栏「设置」入口（带更新小圆点）+ 弹窗接线 |
| `src/styles/editor.css`（修改） | 设置弹窗与圆点样式 |
| `src/mcp/catalog.ts`（创建） | MCP 能力的单一事实来源：tools/resources/prompts/客户端片段/调用词/instructions |
| `src/mcp/server.ts`（修改） | instructions 改为从 catalog 引入，消除重复文本 |
| `app/api/mcp/info/route.ts`（创建） | `GET /api/mcp/info`：把目录喂给设置页，替换 `{endpoint}`/`{token}` |
| `tests/mcp-catalog.test.ts`（创建） | 防漂移：真实 MCP client 与目录逐字比对 |
| `README.md`（修改） | 后端路由表与更新检查说明 |

---

### 任务 1：纯逻辑 + 单测 ✅

**文件：** 创建 `src/lib/version.ts`、`src/lib/update.ts`；测试 `tests/update.test.ts`

- [x] 版本解析容忍 `v` 前缀、缺段、预发布后缀；非法输入不谎报更新
- [x] `pickAsset` 按 CI 真实产物名匹配（darwin → `.dmg`（优先 aarch64）→ `.zip`；win32 → `-setup.exe`）
- [x] `buildUpdateCheck` 忽略 draft/prerelease；`downloadUrl` 只表示安装包资产
- [x] `npm test`：42 项全绿（新增 12 项）

### 任务 2：服务端路由 + README（task-1）

**文件：** 创建 `app/api/update/route.ts`；修改 `README.md`

- [ ] `GET /api/update?platform=`，缺省用 `process.platform`
- [ ] `RESUME_UPDATE_ENDPOINT` / `RESUME_UPDATE_REPO` / `RESUME_UPDATE_CACHE_MS` 可覆盖
- [ ] 10 分钟模块级缓存；8 秒超时；404 / 非 2xx / 网络异常一律 200 + UpdateCheck
- [ ] README 补路由表与说明

### 任务 3：设置弹窗与接线（task-2）

**文件：** 创建 `src/components/SettingsModal.tsx`、`src/lib/useUpdateCheck.ts`；修改 `src/lib/backend.ts`、`src/EditorApp.tsx`、`src/styles/editor.css`

- [ ] `fetchUpdateCheck()` 客户端封装
- [ ] hook：3 秒静默自检、`sessionStorage` 当天去重、防重复触发、卸载保护
- [ ] 弹窗：关于 / 检查更新；有新版本时展示说明与「前往下载」+「复制链接」兜底
- [ ] 工具栏「设置」入口 + 更新小圆点；Esc / 遮罩 / 关闭按钮

### 任务 4：MCP 能力展示（Lead）

**文件：** 创建 `src/mcp/catalog.ts`、`app/api/mcp/info/route.ts`、`tests/mcp-catalog.test.ts`；修改 `src/mcp/server.ts`

- [x] 目录：7 工具 / 3 资源 / 2 提示词，每项都带 `whenToUse` 与**调用词**
- [x] instructions 从 `server.ts` 移入 catalog，服务端与设置页共用同一份文本
- [x] `GET /api/mcp/info`：绝对端点、传输说明、鉴权状态（不下发 token）、客户端配置片段（占位符已替换）
- [x] 防漂移测试：真实 MCP client 双向比对，`description` 逐字相等
- [ ] 设置页「MCP 能力」区块渲染（task-2 承担）

### 任务 5：独立验证（task-3）

**文件：** 只写 `/tmp/**`；桩 `/tmp/update-stub.mjs`

- [ ] `npm run check` / `npm test` / `npm run build`
- [x] 桩契约测试：newer / same / notfound / malformed / 死端口 / 缓存命中（14 种畸形 payload 全部 200 且结构合法）
- [x] 反向核对：错误路径状态码、异常 payload、hook 卸载、window.open 兜底、越界改动
- [x] 交互证据：SSR + 系统 Edge headless + CDP 真实点击（43 项通过）
- [x] 列出未验证项

### 任务 6：修复与复验（fixer ≠ verifier）

验证发现 1 个必修缺陷 + 6 项次要问题，Lead 修复后交回验证者独立复验：

- [x] **D1（必修）** `window.open(..., 'noopener')` 按规范必返回 `null` → 每次成功点击都误报「被拦截」；
      改为 `window.open(url, '_blank')` + 手动 `opened.opener = null`
- [x] M1 客户端 note 与实际（端点已自动填入）不符
- [x] M2 未知平台不再回落 `assets[0]`（Linux 宿主不再被推荐 Windows `.exe`），回落到 Release 页
- [x] M3 检查失败不再写「当天已检查」标记，静默重试仍可用
- [x] M4 有更新但无安装包时给出明确说明
- [x] M5 `formatVersionLabel` 不再给非语义化 tag 加 `v`；「当前版本」两处改走该函数
- [x] M6 防漂移测试补 3 处盲区（资源模板 title/description、prompt arg description、服务端 instructions 逐字比对）
- [ ] 验证者复验（task-4）

---

## 验收标准

- `npm run check`、`npm run build` 全绿；本功能测试（`tests/update.test.ts`、`tests/mcp-catalog.test.ts`）全绿。
  全量 `npm test` 的绿与否还取决于同一工作区里**并行工作流**的临时探针
  （`src/templates/industrial/pages.tsx` 里注入的 `BOUNDARY PROBE` throw），与本功能无关。
- 真实仓库当前最新为 `v2.1.0`，与 `package.json` 相同 → 线上首次检查应显示「已是最新」；
  用 `RESUME_UPDATE_ENDPOINT` 指向桩可复现「有新版本」分支。
- Rust 侧零改动，`npm run desktop:build` 行为不变。

## 未纳入本期

- 应用内下载并安装（Tauri updater + 签名密钥 + `latest.json` + localhost webview IPC 权限）
- 版本号四处重复（`package.json` / `tauri.conf.json` / `Cargo.toml` / `src/mcp/config.ts`）的统一
