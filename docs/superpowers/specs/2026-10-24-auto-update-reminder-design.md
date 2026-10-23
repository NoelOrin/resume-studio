# 自动更新提醒与桌面产品属性设计

日期：2026-10-24
状态：已实施（自主模式）

## 背景

2026-10-23 的更新检查设计已交付：服务端查 GitHub Releases（`GET /api/update`），设置页可手动检查，
启动 3 秒后静默自检一次（sessionStorage 按天节流）。但**提醒手段只有设置按钮上的 6px 圆点与悬停 tooltip**，
用户几乎无感知。桌面壳（Tauri）窗口与打包元数据基本完整，但版本号散落 4 处
（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src/mcp/config.ts`）无防漂移护栏，
窗口不居中启动，品牌副标题是内部术语（"vinext full-stack / 多模板"）。

## 目标

1. 有新版本时**主动、可见、可一键行动**地提醒，仍不自动安装（延续上期非目标）。
2. 桌面形态更像一个完整产品：版本单一来源、启动居中、应用内处处可见自己跑的版本。

非目标：应用内自动下载安装（Tauri updater）、Rust 侧新增插件与 capability、强制升级。

## 设计

### A. 自动提醒（web 与桌面共用，webview 加载同一应用）

1. **`useUpdateCheck` 增强**（`src/lib/useUpdateCheck.ts`）
   - 新增可选回调 `onAutoUpdate?: (check: UpdateCheck) => void`：仅在**静默自检**发现 `hasUpdate` 时触发
     （手动检查意味着用户已打开设置页，不再弹 toast 打扰）。
   - 新增 `visibilitychange` 重查：可见时若当日尚未成功检查过（跨天）则自动再查一次——
     桌面应用可能连续开数日，原实现只在挂载时查一次，长开场景永远不知道发了新版。
2. **工具栏提醒胶囊**（`EditorApp.tsx` + `fields.tsx` 新 `notice` 变体）
   - `updateCheck.ok && hasUpdate` 时，顶栏「应用」组出现「新版本 v2.3.0」描边胶囊（accent 描边 + wash 底），
     点击直接打开设置弹窗（更新区块就在弹窗顶部，无需滚动定位）。胶囊持续存在直到用户查看或升级，
     比圆点可见一个数量级，且不打断输入。
   - 静默发现时 toast 提示 8 秒（`notify` 增加可选时长参数，默认仍 3 秒）。
3. 版本展示统一走 `formatVersionLabel`（已有）。

### B. 桌面产品属性

1. **版本单一来源**：新增 `scripts/sync-version.mjs`，从 `package.json` 读版本写入
   `tauri.conf.json` / `Cargo.toml` / `src/mcp/config.ts`；`npm run version:sync`。
   `desktop:build` 前置同步，`tests/version-sync.test.ts` 在 CI 里对四处做逐字比对——漂移即红。
2. **窗口居中启动**：`main.rs` 主窗口加 `.center()`（纯窗口配置，不涉及 IPC/capability）。
3. **品牌说话像产品**：顶栏品牌副标题由「vinext full-stack / 多模板」改为
   「多模板简历编辑器 · v{APP_VERSION}」——技术栈术语退场，版本号常驻可见（`lib/version.ts` 已是 web 侧单一来源）。
4. `tauri.conf.json` 补 `bundle.category: "Productivity"`。

## 单元与测试

- `tests/version-sync.test.ts`：读仓库内 4 个文件，断言与 `package.json.version` 一致。
- 既有 `tests/update.test.ts` 不动（服务端纯逻辑已覆盖）。
- hook 行为（静默回调、跨天重查）为 React 侧效果，无既有 React 测试设施，靠类型检查 + 手工验证。

## 验收

1. `npm run check`、`npm test` 全绿（含新漂移测试）。
2. `RESUME_UPDATE_ENDPOINT` 指向本地桩：启动后 toast + 顶栏胶囊出现，点胶囊打开设置弹窗。
3. `node scripts/sync-version.mjs --check` 幂等；改动 `package.json` 后运行可同步三处。
4. 截图确认顶栏胶囊与品牌副标题。

## 风险与回滚

改动集中在客户端 hook/壳层与构建脚本，单 commit 可 revert。`main.rs` 仅追加一行方法调用，
`cargo` 无新依赖；CI 桌面构建路径不受影响（version:sync 失败会提前红，属期望行为）。
