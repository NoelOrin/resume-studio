# 检查更新（Update Check）设计

日期：2026-10-23
状态：已确认（A 方案 + 顶部弹窗式设置页）

## 目标

让用户能知道「我现在用的是不是最新版」，并一键拿到新版安装包。

同时（用户追加需求）：设置页要展示**当前暴露的 MCP 能力与调用方法**，并**附上调用词**（可直接粘贴给 AI 客户端的一句话示例）。

非目标（本期不做）：

- 应用内下载并安装（Tauri 官方 updater + 签名密钥 + `latest.json` + 给 localhost webview 开 IPC 权限）
- 强制升级、灰度、增量更新
- Web 部署形态的版本公告
- 在设置页里直接发起 MCP 调用（只展示能力与调用方法，不做内置客户端）

## 背景与约束

- 应用是 Tauri 壳 + 内置 Node 运行时跑 vinext 全栈服务；窗口加载的是 `http://127.0.0.1:<port>`（外部 URL），
  默认拿不到 Tauri IPC，所以本期不改 Rust、不加 capability。
- CI 已在 `v*` tag 时创建 GitHub Release，附 `.dmg` / `Resume Studio.app.zip` / `-setup.exe`（`NoelOrin/resume-studio`）。
- 版本号目前重复在 4 处（`package.json` / `tauri.conf.json` / `Cargo.toml` / `src/mcp/config.ts`）。
  本期以 `package.json` 作为「当前版本」的唯一来源，其余不动（避免顺手重构）。
- 桌面版数据目录与 `server.log` 在 `~/Library/Application Support/dev.linzhiyuan.resume-studio`。

## 架构

```
SettingsModal (client)  ──GET /api/update──▶  app/api/update/route.ts
                                                 │  10 分钟内存缓存
                                                 ▼
                                     api.github.com/repos/.../releases/latest
```

- 检查放在**服务端**：没有 CORS/CSP 问题，也能统一加缓存与降级，前端只认一种响应结构。
- 判定逻辑（版本比较、挑安装包、说明摘要）是**纯函数**，与 `src/lib/zoom.ts` 同风格，单独单测。

## 单元划分

### 1. `src/lib/version.ts`（当前版本常量）

`APP_VERSION`（来自 `package.json`）、`APP_REPO`、`RELEASES_PAGE`、`LATEST_RELEASE_API`。
客户端与服务端共用；不含任何 IO。

### 2. `src/lib/update.ts`（纯逻辑，无 IO）

```ts
export type UpdateAsset = { name: string; url: string; size?: number };
export type ReleaseInfo = {
  tag: string; name?: string; url?: string; notes?: string;
  publishedAt?: string; prerelease?: boolean; draft?: boolean; assets?: UpdateAsset[];
};
export type UpdateCheck = {
  ok: boolean;              // false = 网络/接口错误；true = 检查完成
  current: string;
  latest: string | null;    // 无 release 时为 null
  hasUpdate: boolean;
  releaseUrl: string | null;
  downloadUrl: string | null;
  downloadName: string | null;
  notes: string;            // 已摘要
  publishedAt: string | null;
  checkedAt: string;        // ISO
  error?: string;           // ok:false 的原因，或 ok:true 时的提示（如「尚未发布」）
};

export function parseVersion(raw: string): number[] | null;
export function compareVersions(a: string, b: string): number;   // -1 | 0 | 1
export function isNewer(candidate: string, current: string): boolean;
export function pickAsset(assets: UpdateAsset[], platform: string): UpdateAsset | null;
export function summarizeNotes(notes: string, maxChars?: number): string;
export function buildUpdateCheck(input: {
  current: string;
  release: ReleaseInfo | null;
  platform: string;
  now?: Date;
  error?: string;
}): UpdateCheck;
```

规则：

- `parseVersion` 接受 `v2.1.0` / `2.1` / `2.1.0-beta.1`（取数字核心，预发布后缀忽略），非法返回 `null`。
- `compareVersions` 按段数值比较，缺段补 0；两端都非法时返回 0（不谎报更新）。
- `pickAsset`：`darwin` → 优先 `.dmg`（优先名字含 `aarch64`/`arm64`），其次 `.zip`；
  `win32` → 优先 `-setup.exe`，其次 `.exe`；**其他平台返回 `null`**（我们只发 macOS/Windows 安装包，
  把 Windows `.exe` 推荐给 Linux 宿主比直接给 Release 页面更糟），弹窗此时回落到 `releaseUrl`。
- `summarizeNotes`：去 CRLF、压缩连续空行、去首尾空白，超长截断并加 `…`。
- `buildUpdateCheck`：`draft`/`prerelease` 的 release 不触发更新；`hasUpdate = release != null && isNewer(tag, current)`。

### 3. `app/api/update/route.ts`（服务端检查 + 缓存）

- `GET /api/update?platform=darwin|win32`（缺省用服务端 `process.platform`，即宿主系统）。
- 端点：`process.env.RESUME_UPDATE_ENDPOINT ?? https://api.github.com/repos/<repo>/releases/latest`；
  仓库可用 `RESUME_UPDATE_REPO` 覆盖（默认 `NoelOrin/resume-studio`）。
- 请求头带 `accept: application/vnd.github+json` 与 `user-agent`；GitHub 未认证限流 60 次/小时，
  故模块级缓存 10 分钟（同一平台共享），并在响应里带 `checkedAt`。
- 降级：404 → `ok:true, latest:null, error:"尚未发布任何版本"`；
  其他非 2xx / 网络异常 / 超时（8s）→ `ok:false, error:"…"`，HTTP 状态仍为 200，便于前端统一处理。

### 4. `src/components/SettingsModal.tsx` + 编辑器入口（设置页）

- 顶部工具栏最右加「设置」按钮（ghost），打开弹窗式设置页。
- 弹窗分区块：**关于**（版本号、仓库链接）、**检查更新**（当前版本、检查按钮、结果区）、**MCP 能力**（见下）。
- 交互状态：`idle → checking → up-to-date | update-available | error`。
- 有新版本时展示：当前 → 最新、发布日期、更新说明摘要、「前往下载」、「复制链接」。
- 桌面版 WKWebView 可能拦 `window.open`：因此「复制链接」是并列的兜底动作，复制成功给 toast。
  注意 `window.open(url, "_blank", "noopener")` 按规范**必然返回 `null`**（窗口照常打开），
  用它判断「是否被拦」会每次误报；必须用 `window.open(url, "_blank")` 再手动 `opened.opener = null`。
- 有更新但该 release 没有安装包时，两个下载按钮禁用并给出「请到 Releases 页面手动下载」的说明，不留白。
- 启动 3 秒后静默自检一次（`sessionStorage` 记当天已查，避免每次刷新都请求）；
  有新版本时「设置」按钮上显示小圆点。

### 5. `src/mcp/catalog.ts`（MCP 能力的单一事实来源）

纯数据，**不 import MCP SDK**，所以既能被服务端注册流程使用，也能被设置页展示：

- `MCP_INSTRUCTIONS`：原本硬编码在 `server.ts` 的 instructions 文本，移到这里（`server.ts` 改为 import），
  保证设置页展示的就是服务端真正下发的文本。
- `MCP_WORKFLOW`：5 步推荐工作流，instructions 由它拼装。
- `MCP_TOOLS`（7 项）：`name` / 中文 `title` / `description` / `whenToUse` / **`example`（调用词）**。
- `MCP_RESOURCES`（3 项）：`uri` / `title` / `description` / `example`。
- `MCP_PROMPTS`（2 项）：`name` / `title` / `description` / `args`（含必填标注）/ `example`。
- `MCP_CLIENTS`：可直接粘贴的客户端配置片段（Claude Code CLI、通用 `.mcp.json`、带 Bearer Token、仓库自带 `mcp:smoke`），
  片段里的 `{endpoint}` / `{token}` 由路由替换（桌面版端口是随机的，不能写死）。
- `MCP_EXAMPLES`：通用调用词。
- `MCP_TRANSPORT_NOTE`：说明这是无状态 Streamable HTTP（POST JSON-RPC，GET 返回 405 是规范行为）。

`description` 与真实注册**逐字相等**，由测试强制（见下），因此设置页不会宣传服务端没有的能力。

### 6. `app/api/mcp/info/route.ts`（把能力喂给设置页）

- `GET /api/mcp/info`，恒 HTTP 200 + JSON：`endpoint`（按请求 origin 拼绝对地址）、`path`、`transport`、
  `authRequired`（`mcpAuthToken() !== null`，**绝不下发 token 本身**）、`serverName`、`version`（`APP_VERSION`）、
  `instructions`、`workflow`、`tools`、`resources`、`prompts`、`clients`（已替换 `{endpoint}`/`{token}` 占位符）、
  `examples`、`counts`、`checkedAt`。
- 响应头 `cache-control: no-store`。

### 7. `tests/mcp-catalog.test.ts`（防漂移）

用 `InMemoryTransport` 连一个真实 MCP client，对 `listTools` / `listResources` / `listResourceTemplates` / `listPrompts`
做**双向集合比对**，并断言 `title` 与 `description` 逐字相等、每个工具/资源/提示词都有调用词、
提示词的 `args`（名称与必填性）一致、每个客户端片段都引用了运行时端点。

### 8. `tests/update.test.ts`

覆盖：版本解析（含 `v` 前缀、预发布、非法输入）、比较、`isNewer`、`pickAsset` 三平台与无匹配、
`summarizeNotes` 截断、`buildUpdateCheck` 的 draft/prerelease/无 release/有更新四种情形。

## 错误处理

| 情况 | 表现 |
| --- | --- |
| 网络不通 / 超时 | 弹窗显示「检查失败：…」+ 重试按钮 |
| GitHub 限流（403） | 同上，提示稍后再试 |
| 仓库无 release（404） | 「尚未发布任何版本」 |
| 版本号非法 | 视为不更新，不弹「有新版本」 |
| 复制链接失败 | toast 报错，用户可手动复制弹窗里显示的 URL |
| `/api/mcp/info` 失败 | MCP 区块显示「加载失败」+ 重试按钮，不影响更新检查区块 |
| 目录与注册漂移 | 单测直接失败（`tests/mcp-catalog.test.ts`），不允许发布 |

## 测试与验收

- `npm run check`（tsc）与 `npm test`（node:test）全绿（含 MCP 防漂移测试）。
- 手工：`npm run dev` → 打开设置页 → 点「检查更新」→ 得到「已是最新」或「有新版本」；
  用 `RESUME_UPDATE_ENDPOINT` 指向本地桩数据可复现「有新版本」分支。
- 手工：设置页 MCP 区块显示端点（绝对地址）、传输与鉴权说明、7 个工具（含调用词）、3 个资源、
  2 个提示词（含参数）、可粘贴的客户端配置片段与通用调用词；点复制有 toast 反馈。
- `curl -s localhost:5173/api/mcp/info | jq '.counts'` → `{ tools: 7, resources: 3, prompts: 2 }`。
- 桌面版不回归：Rust 未改动，`npm run desktop:build` 行为不变。
