# 桌面系统集成：托盘、系统通知、单实例设计

日期：2026-10-27
状态：待评审
范围：系统反馈与常驻（用户选定）。文件对话框/拖拽导入/打印直出/全局快捷键/深链接不在本期。

## 目标

1. **托盘/菜单栏图标**：右键菜单四项——显示主窗口、新建简历（复用 `newCopy`）、检查更新（唤起窗口并打开设置弹窗更新区块）、退出。
2. **系统通知**：
   - 发现新版本（静默自检）→ 桌面端发系统通知，替代 8 秒 toast；点击通知落地设置弹窗更新区块。
   - 操作成功反馈（保存到服务器、发布成功）→ 窗口**失焦**时走系统通知，**聚焦**时维持现有应用内 toast。
3. **单实例**：二次启动唤起已有窗口（single-instance 插件）。
4. **Dock 徽标（macOS）**：有新版本时显示「1」，用户查看更新后清除；Windows/Linux 无此概念，no-op。
5. **Web 形态零回归**：浏览器里访问同一应用，所有桌面能力优雅降级，行为与现在完全一致。

## 非目标

- 应用内下载安装更新（Tauri updater + 签名密钥，延续 2026-10-23 非目标）。
- 原生打开/保存对话框、拖拽导入、文件关联（用户本期未选）。
- `window.print()` 直出 PDF。
- 全局快捷键、`resume-studio://` 深链接。
- 通知内容的应用内开关：macOS 系统设置已支持按应用关闭通知，应用内再加开关是重复（YAGNI）。
- Windows 任务栏徽标。

## 背景与约束

- Tauri 壳目前**零 IPC、零插件**：窗口加载 `http://127.0.0.1:<动态端口>`（`WebviewUrl::External`），前端拿不到任何 Tauri API。上期 spec（update-check 2026-10-23）把「给 localhost webview 开 IPC 权限」列为非目标——本期推翻该前提，但把权限面压到最小。
- 更新检查、保存/发布成功这些事件源头都在 **web 层**（`useUpdateCheck` / `EditorApp.notify()` 单点），壳（Rust）无从感知，所以 web→壳通信是绕不开的。
- 方案对比（2026-10-27 评审）：A 远端 IPC + 官方插件（推荐，本 spec 采用）；B 零 IPC、Rust 自治（更新逻辑双份漂移、操作反馈不可能、托盘残废）；C Node 服务中转（web→Node→Rust 三段自定义链路，托盘方向还要 eval 注入）。
- 已核实：capability `remote.urls` 走 URLPattern 语法，端口通配 `http://127.0.0.1:*` 可行（同 [tauri#12673](https://github.com/tauri-apps/tauri/issues/12673) 的 `http{s}?://*` 用法）；`tauri-plugin-single-instance` 支持 macOS/Windows/Linux，要求 **Rust ≥ 1.90**（当前 `rust-version = 1.77`，需抬）；Tauri 2 **无内建 Dock 徽标 API**，需 objc2 桥接（docs.rs 默认 linux 目标不显示 cfg(macOS) 方法，勿被误导）。
- 桌面包 **adhoc 未公证**：通知子系统在新机器上的可用性无法在本机完整验证（本机 Gatekeeper 已关）。

## 架构（方案 A：远端 IPC + 官方插件，纯事件总线）

```
┌─ Tauri 壳 (Rust) ───────────────────────────────┐
│ tray-icon 菜单 ──emit "tray://action"─────────▶ │
│ listen_any("desktop://badge") → NSDockTile      │
│ plugins: notification / single-instance(首个)   │
└──────────────────┬──────────────────────────────┘
                   │ IPC：capability 仅授 http://127.0.0.1:*
                   │ 权限 = core:event:default + notification:default
┌──────────────────▼──────────────────────────────┐
│ webview = vinext 应用（127.0.0.1:<port>）        │
│ src/lib/desktop.ts  环境检测 / 发通知 / 收发事件  │
│ EditorApp.notify() 单点改造（聚焦感知）           │
│ useUpdateCheck → 新版本通知 + 徽标事件            │
└─────────────────────────────────────────────────┘
```

**零自定义命令**：web→壳只 emit（徽标），壳→web 只 emit（托盘动作），通知直接走 notification 插件的 JS API。因此不需要定义任何自定义 invoke 命令和配套 application permission——权限面就是 `core:event:default`（listen/emit）与 `notification:default`（is-permission-granted / request-permission / notify）两项。

安全面评估：IPC 只授给 `http://127.0.0.1:*` 的 webview 上下文，且只含事件与通知权限——无文件系统、无 shell、无 window 控制。127.0.0.1 服务本就对外暴露 MCP（现状），本期不扩大数据面。

## 单元划分

### 1. `src-tauri/capabilities/desktop.json`（新增）

```json
{
  "identifier": "remote-desktop-integration",
  "windows": ["main"],
  "remote": { "urls": ["http://127.0.0.1:*"] },
  "permissions": ["core:event:default", "notification:default"]
}
```

### 2. `src-tauri/src/tray.rs`（新增，main.rs 保持瘦壳）

- `TrayIconBuilder` + 菜单：显示主窗口 / 新建简历 / 检查更新 / 退出（分隔线分组）。
- 菜单事件 → `app.emit("tray://action", { action: "show" | "new-resume" | "check-update" })`，「退出」直接 `app.exit(0)`（走既有 `RunEvent::Exit` → 杀 node 子进程）。
- 「显示主窗口」壳内自处理（show + set_focus），不进事件。
- 图标：新增 `src-tauri/icons/tray.png`（32×32 单色模板图，`include_image!` + `is_template(true)`，macOS 菜单栏自动适配深浅色）。

### 3. `src-tauri/src/main.rs`（改动最小化）

- `tauri = { features = ["tray-icon"] }`；注册 `tauri-plugin-notification`、`tauri-plugin-single-instance`（**必须第一个注册**）。
- 关窗即退 = Tauri 2 默认行为（最后窗口关闭 → 进程退出），维持不动。
- single-instance 回调：show + set_focus 已有主窗口。

### 4. `src-tauri/src/badge.rs`（新增，macOS-only）

- `app.listen_any("desktop://badge")`，payload `{ count: string | null }` → `objc2`/`objc2-app-kit` 调 `NSApp.dockTile.setBadgeLabel`；`count: null` 清除。
- `#[cfg(target_os = "macos")]`，其余平台空实现。约 30 行 unsafe 边界，收敛在这一个文件。

### 5. `src/lib/desktop.ts`（新增，前端唯一桌面入口）

- `isDesktop()`：探测 `__TAURI_INTERNALS__`；web 环境 false，一切 no-op。
- `@tauri-apps/api`、`@tauri-apps/plugin-notification` 只在此文件**动态 import**，避免 SSR / web 打包引入。
- `sendSystemNotification(title, body, kind)`：先 `isPermissionGranted`，否则 `requestPermission`（结果缓存，拒绝后不再重复请求）；任一步失败 → 返回 false，调用方回退 toast。
- `listenTrayAction(handler)`：包装 `event.listen("tray://action")`。
- `setDockBadge(count | null)`：`emit("desktop://badge", { count })`。
- 纯决策函数 `shouldUseSystemNotification({ isDesktop, windowFocused, kind })`：`kind = "lifecycle" | "operation"`——lifecycle（新版本）桌面端恒走系统通知；operation（保存/发布）仅失焦且桌面端走系统通知。可单测，与 `src/lib/update.ts` 同风格。

### 6. `EditorApp.notify()` 改造（单点接线）

- `notify()` 已是全部用户反馈的唯一出口（保存成功 453 行、发布成功 477 行等）。
- 改为：`shouldUseSystemNotification` 为真 → `sendSystemNotification`，失败或决策为否 → 现有 toast 路径不变。

### 7. `useUpdateCheck` / EditorApp 静默自检（新版本路径）

- 静默自检发现 `hasUpdate` 且桌面端：`sendSystemNotification("发现新版本 v2.x.x", 更新摘要)` + `setDockBadge("1")` + `sessionStorage` 记 pending 更新标记。
- Web 端维持现有 toast（8 秒）。
- 打开设置弹窗更新区块时（无论入口）：`setDockBadge(null)` + 清 pending 标记。

### 8. 通知点击落地（不依赖插件点击回调）

- 发新版本通知时记 pending 标记；`window` focus 事件且标记未消费 → 打开设置弹窗（更新区块在弹窗顶部）→ 消费标记。
- macOS 点击横幅默认激活应用 → focus 事件触发上述流程。不依赖 notification 插件的点击回调支持，行为确定性最高。

### 9. 前端依赖与打包

- `package.json` 新增 `@tauri-apps/api`、`@tauri-apps/plugin-notification`（dependencies）。
- 动态 import 保证 vinext SSR / web 构建不触碰 Tauri 模块；`desktop.ts` 导出面在 web 下全部可安全调用。

## 数据流（关键三例）

1. **新版本**：静默自检 `hasUpdate` → 系统通知 + 徽标「1」+ pending 标记 → 用户点横幅 → 应用激活 → focus → 开设置更新区块 → 徽标清除。
2. **保存成功且失焦**：`notify()` → 决策为系统通知 →「已保存到本地数据库（id）」横幅；聚焦时原 toast 不变。
3. **托盘新建简历**：菜单点击 → `tray://action {action:"new-resume"}` → EditorApp 监听 → 调 `newCopy()`。

## 错误处理

- 通知权限被拒：永久回退 toast，不重试请求（结果缓存于 desktop.ts 模块内）。
- 插件动态 import 失败 / IPC 不可用（如 dev 环境直连 5173）：全部 no-op，编辑功能零影响。
- 徽标桥接失败：静默（console.warn），不影响主流程。
- 通知不可用不阻塞任何操作——通知是旁路，不是必经路径。

## 测试

- **单测**（node:test，与既有套件同风格）：`shouldUseSystemNotification` 决策矩阵（桌面/浏览器 × 聚焦/失焦 × lifecycle/operation）；desktop.ts 的环境探测（mock `__TAURI_INTERNALS__`）。
- **Rust**：`cargo check` 过（tray/badge 单元暂无 rust 单测，逻辑收敛在事件转发）。
- **手工验收清单**（打包产物，真机）：
  - macOS：菜单栏图标四项动作；关窗即退且 node 子进程退出；新版本通知 + 点击落地设置；徽标出现/清除；二次启动唤起。
  - Windows：托盘行为同构（徽标无）。
  - Web：`npm run dev` 浏览器打开，控制台无 Tauri 相关报错，更新提醒维持 toast。
- 权限拒绝路径：系统设置关掉应用通知 → 应用内操作回退 toast。

## 验收口径

- `npm run check`、`npm test` 全绿（既有「完成的口径」）。
- 打包产物（`npm run desktop:build`）上手工验收清单全过。

## 风险

- **端口通配 capability**：URLPattern `http://127.0.0.1:*` 语法已核实但实现首日先做最小 spike（起壳 → webview 内调 `isPermissionGranted`），不通再降级为「固定端口」方案（`free_port()` 改为从固定候选段选取）。
- **adhoc 未公证包的通知可用性**：本机 Gatekeeper 已关，无法完整复现拦截；失败模式 = 权限请求失败 → 回退 toast，不崩溃。需在另一台机器/真实用户环境补验。
- **Rust ≥ 1.90**（single-instance 要求）：`rust-version` 字段需抬到 1.90，本地与 CI 构建工具链同步确认；若 CI 镜像不满足，single-instance 单元单独降级（去掉插件，托盘/通知不受影响）。
- **dev 环境通知可能不可用**：`tauri dev` 下二进制不在 .app bundle 内，macOS UNUserNotificationCenter 可能异常——验收以打包产物为准。
- **objc2 桥接**：仅 macOS cfg、约 30 行；评审认为不值可整单元裁掉，其余不受影响。
- **远端 IPC 权限**：仅事件 + 通知，无文件系统/shell；127.0.0.1 上的服务本就暴露 MCP（现状），本期不扩大数据面。
- **push master 即发版**：本 spec commit 与后续实现合入都会触发 CI release 构建（现状行为，产物命名与资产规则不变）。
