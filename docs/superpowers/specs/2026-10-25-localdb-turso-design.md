# 本地嵌入式数据库（libSQL / Turso）替代 localStorage — 设计

日期：2026-10-25
状态：实现中

## 背景

- 桌面壳每次启动随机挑选回环端口（`main.rs` 的 `free_port()`），WebView 的
  localStorage 按源（scheme+host+**port**）分区。端口一变就是新源，旧数据全丢——
  桌面版的 localStorage 自动保存实际上从未跨启动生效过。
- 前端共有 6 个 web storage 键：`resume-studio:doc`（当前简历，350ms 防抖）、
  `resume-studio:title`、`resume-studio:doc-id`（EditorApp）、`resume-studio:draft`
  （并行会话新加的崩溃恢复草稿）、`resume-studio:zoom`、`resume-studio:update-pill`，
  外加 sessionStorage 的 `resume-studio:update-checked-at`。
- 服务端已有一套 JSON 文件存储（`.data/docs/*.json`、`.data/published/*.html`），
  由 REST（`/api/docs`、`/api/publish`）、MCP、`/?doc=` RSC 共用。

目标：全部持久化收敛到一个内嵌在打包应用里的本地数据库文件，浏览器 storage API
彻底退场。

## 非目标

- 不接 Turso 云端 / 远程同步（`@libsql/client` 的 `file:` 模式即 Turso 的嵌入式
  本地形态，未来想加云同步时换 url 即可）。
- 不动并行会话的 `src/server/archive.ts`（导出归档，继续用文件）与
  `src/server/artifacts.ts`。
- 不做 SQLite 全文检索 / 复杂查询——数据量是「一个人的简历库」。

## 设计

### 数据库引擎与位置

- 依赖 `@libsql/client`（Node 端 `file:` URL，纯本地，无账号、无网络）。
- 数据库文件：`<RESUME_DATA_DIR>/resume-studio.db`，WAL 模式。桌面版即
  `~/Library/Application Support/dev.linzhiyuan.resume-studio/`；dev 为 `<cwd>/.data/`。
  数据不放 `.app` 包内（只读且升级会丢）；「内嵌」指引擎：`@libsql/client` 及其
  平台 napi 二进制随 `npm ci --omit=dev` 进 `runtime/node_modules`，与应用一起打包。
- `src/server/db.ts`：懒加载单例 client + 建表（幂等）+ kv 读写助手 + `closeDb()`。
  懒加载避免构建期在项目目录里落库文件。

### 表结构

```sql
CREATE TABLE IF NOT EXISTS docs      (id TEXT PRIMARY KEY, title TEXT NOT NULL,
                                      template_id TEXT, updated_at TEXT NOT NULL,
                                      data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS published (id TEXT PRIMARY KEY, html TEXT NOT NULL,
                                      updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS kv        (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

- `docs` / `published` 取代 `.data/docs/*.json`、`.data/published/*.html`；
  `store.ts` 对外签名不变（`isValidId/listDocs/readDoc/writeDoc/deleteDoc/
  writePublished/readPublished/publishedIds`），REST、MCP、RSC 页面零改动。
- `kv` 存编辑器工作区与 UI 偏好：
  - `workspace` → `{ title, data, docId, savedAt }`（把原 localStorage 三键 + 崩溃
    恢复草稿合成一条记录，天然解决三键不同步的撕裂问题）；
  - `ui:zoom` → `{ mode, value }`；`update:pill` → 版本号或删除；`update:checked-at`
    → `YYYY-MM-DD`（原 sessionStorage 每日一次的自动更新检查去重，改为全局每日一次）。

### 新 REST 面

- `GET/PUT /api/workspace`：GET 返回工作区快照或 null；PUT `{ title, data, docId }`
  服务端经 `migrateDocument` 校验后整条 upsert，返回 `{ savedAt }`。
- `GET/PUT /api/prefs`：`{ zoom?, pill?, checkedAt? }`，PUT 为部分更新（读-合-写）。

### 前端改造

- `src/lib/backend.ts` 增 `fetchWorkspace/saveWorkspace/fetchPrefs/savePrefs`。
- `useResumeStore`：删除 localStorage 读写与 `skipLocal`，只管文档状态与撤销栈。
- `EditorApp`：
  - 挂载时（无 `?doc=`）`fetchWorkspace()` 恢复 title/data/docId；用
    `data !== 初始引用 || title !== 初始值` 做 dirty 守卫，防止异步水合晚到覆盖
    用户已输入的内容。
  - data/title/docId 变化 400ms 防抖 `PUT /api/workspace`，`savedAt` 取响应
    （顶栏「已自动保存/已同步」语义不变）。
  - 取代并行会话的 draft 接线：DB 工作区就是崩溃恢复草稿（服务端、跨端口、跨
    重启）。`src/lib/draft.ts` 留给该会话自行处置。
- `useZoom`：挂载后从 prefs 恢复，变更 150ms 防抖写回。
- `useUpdateCheck`：pill 与每日标记走 prefs；缓存先入内存，visibilitychange 读
  内存副本，标记写入内存 + 异步落库。

### 数据迁移（一次性、可跳过、不删源）

- 服务端：首次访问 store 时，若 `kv.migrated:json-store` 未置位，把
  `<data>/docs/*.json`、`<data>/published/*.html` 导入对应表（`INSERT OR IGNORE`，
  已有 id 不覆盖），然后置位。旧文件原地保留作为备份。
- 浏览器：工作区为空且 localStorage 存在 legacy 键（`resume-studio:draft` 优先，
  退回 `doc`/`doc:v1` + `title` + `doc-id`）时，组装快照上传成功后删除这些键；
  上传失败则保留待下次。桌面版因端口分区通常无 legacy 可迁，此路径主要服务
  `localhost:5173` 的 dev 浏览器。

## 验收

- `npm run check`、`npm test` 全绿；新增 `tests/localdb.test.ts` 覆盖：docs
  读写/list 排序、workspace/prefs 读写合并、legacy JSON 导入、`closeDb` 收尾。
- `tests/tools.test.ts` 中「发布后磁盘有 html」的断言改为经 `readPublished` 验证。
- `npm run build` 后 `dist` 服务端产物对 `@libsql/client` 保持外置引用（不内联
  napi 二进制路径）。
- runtime 目录**外**复制冒烟：`node node_modules/vinext/dist/cli.js start` 起服务，
  `--noproxy` curl 验证 `/api/health`、`PUT/GET /api/docs/x`、`PUT/GET /api/workspace`、
  `PUT/GET /api/prefs`、`/p/<id>`，并在数据目录看到 `resume-studio.db`。
- 代码中不再出现 `localStorage`（`src/`、`app/` 全量 grep 为零；迁移读取除外）。

## 风险

- **并行会话正在改 `EditorApp.tsx`/`backend.ts`**（导出/归档功能，未提交）：
  共享文件只做定点小编辑、编辑前重读；提交时只 add 自己的文件，若对方仍未
  提交，共享文件的提交推迟并说明。
- napi 平台二进制：`runtime/` 由本机 `npm ci --omit=dev` 装配，架构随构建机，
  与现有 node 二进制 lipo 逻辑一致；冒烟测试兜底。
- vinext 若把 `@libsql/client` 打进服务端 bundle 会破坏 napi 加载——构建后 grep
  dist 确认外置；必要时在 vite 配置 `ssr.external`。
- 工作区整条 upsert 与 2.2s 的 `putDoc` 自动保存并存：前者是「当前编辑视图」，
  后者是「具名文档落库」，语义不同，保留两者。
