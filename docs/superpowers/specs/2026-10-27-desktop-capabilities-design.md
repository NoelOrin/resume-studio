# 桌面能力增强：关窗驻留托盘、系统通知、日志与问题上报

日期：2026-10-27
状态：已实施（自主模式，用户指令「自己决定 自己直接开发」）
关系：**补充并部分取代** [2026-10-27-desktop-tray-notifications-design.md](2026-10-27-desktop-tray-notifications-design.md)（下称「托盘 spec」）。托盘 spec 的 IPC 最小化分析（方案 A：remote capability + 官方插件）全部沿用；差异见下。

## 与托盘 spec 的差异（按用户 2026-10-27 明确选择）

| 项 | 托盘 spec | 本 spec（定稿） |
| --- | --- | --- |
| 生命周期 | 关窗即退（维持默认） | **关窗驻留托盘**（用户选定） |
| 更新提醒触发方 | web 静默自检 → JS 发通知 | **Rust 侧轮询本机 `/api/update`**——驻留（窗口隐藏/未开）时 web 不执行，无法满足「关窗也能提醒」；GitHub 查询/版本比较逻辑零复制 |
| 操作完成通知 | 保存/发布失焦 → 系统通知 | 同左，另覆盖**导出 JSON/HTML**（复用同一决策函数） |
| 壳故障告警 | 无 | **Node 子进程意外退出 → 系统通知**（用户选定） |
| 日志与上报 | 无 | **`shell.log` + 诊断包 + 托盘「反馈问题…」**（用户追加） |
| Dock 徽标（objc2 桥接） | 有 | **砍掉**（非用户所求，unsafe 桥接风险不值） |
| 托盘「新建简历」 | 有（需 tray→web 事件总线） | **砍掉**（省掉整条事件总线，capability 里因此不需要 `core:event`） |

## 目标

1. 关闭主窗口 → 应用驻留托盘（macOS 同时保留 Dock 图标），托盘可唤回/退出；托盘创建失败则退回「关窗即退」，绝不出现唤不回的隐藏窗口。
2. 系统通知三来源：新版本（后台轮询，驻留时也生效）、操作完成（保存/发布/导出，仅失焦时）、壳故障。
3. 单实例：二次启动唤回已有窗口（驻留方案的必备配套）。
4. `shell.log` 滚动日志 + 「反馈问题…」一键打包诊断信息（剪贴板 + GitHub 预填 issue）。
5. Web 形态零回归：所有桌面能力优雅降级为 no-op。

## 非目标

应用内自动更新安装（Tauri updater + 签名清单）；开机自启；Dock 徽标；托盘菜单「新建简历」；全局快捷键；深链接；通知的应用内开关；设置页「复制诊断信息」按钮（托盘已覆盖）。

## 架构

```
Rust 壳（自治，不依赖 web 存活）
  tray.rs     托盘菜单：打开 / 检查更新 / 打开数据目录 / 反馈问题… / 退出
  updater.rs  每 60min（首查延后 90s）GET http://127.0.0.1:<port>/api/update
              → hasUpdate 且（手动 或 窗口不可见 且 当天未通知过该版本）→ 系统通知 + tooltip
  logger.rs   shell.log（1MB 滚动，留一代）；诊断包 = shell.log 尾 100 行 + server.log 尾 100 行
              + 版本/系统/数据目录；issue_url() 生成 GitHub 预填链接
  server.rs   原 spawn/kill 逻辑搬移 + 崩溃监控线程（2s 轮询 try_wait，
              非 shutdown 期退出 → 通知「内置服务已退出，请重启应用」）
  main.rs     装配：single-instance(首个) → notification → opener；
              CloseRequested(main & tray_ready) → prevent_close + hide；
              RunEvent::Reopen(macOS Dock 点击) / ExitRequested / Exit

webview（127.0.0.1:<port>）
  src/lib/desktop.ts   isDesktop() / shouldUseSystemNotification()（纯函数，可单测）
                       / sendSystemNotification()（动态 import 插件，权限结果缓存，拒绝不再问）
  EditorApp.notify()   单点接线：msg 标记 system 的调用点，失焦且桌面端 → 系统通知，toast 恒走原路
```

**IPC 面（最终）**：capability 仅授 `http://127.0.0.1:*`（dev 另加 `http://localhost:*`）的 `notification:default`——零自定义命令、零事件。通知插件的 Rust API（更新/故障告警）不走 ACL。web 不可达时壳自治路径全部照常。

## 关键决策

- **通知抑制统一规则**：系统通知只在用户看不到应用时发。窗口可见 → Rust 侧静默（web toast 已覆盖）、web 侧不发（`document.hasFocus()`）；更新通知按「版本 + 日期」节流，同一版本每天最多一条自动通知。手动「检查更新」绕过节流，无更新时也给确认提示。
- **日志**：只滚动 `shell.log`（1MB → `shell.log.1`）；`server.log` 归 Node 重定向所有，不动。诊断包读取按 256KB 窗口 seek 尾部，server.log 再大也安全。剪贴板失败时：issue body 内联截断 2000 字符诊断 + 自动打开数据目录让用户手动取日志。**stdout 契约**：`[resume-studio] serving on http://127.0.0.1:<port>` 等 println 保留——CI 冒烟脚本靠它发现端口（本次实现曾误删导致 CI 红两条，已恢复；stdout=运维/CI 契约，shell.log=诊断副本，并存）。
- **日志条目**：启动参数、服务就绪/意外退出、托盘创建失败、更新检查结果、通知发送失败、关窗驻留/退出。低频写，每次 open-append-close，不持句柄。

## 错误处理

延续「setup never panics」：托盘/通知/轮询/剪贴板/日志任何失败只记日志，不崩溃、不阻断。托盘创建失败 → `tray_ready=false` → 关窗驻留自动停用（退回关窗即退）。dev 模式（`RESUME_DEV_URL`）端口记 0：不启动轮询与崩溃监控，托盘照常（检查更新提示跳过）。

## 测试

- Rust 单测（`cargo test`，src-tauri）：日志滚动阈值、`read_tail`（300 行取尾 100）、`truncate` 中文字符边界、`issue_url` 百分号编码、诊断包拼装。
- 前端单测（`tests/desktop-notify.test.ts`）：`shouldUseSystemNotification` 决策矩阵（桌面/浏览器 × 聚焦/失焦）。
- 完成口径：`npm run check`、`npm test` 全绿 + `cargo test` 全绿。
- 手工验收（打包产物）：关窗驻留/唤回/退出杀服务、二次启动唤回、驻留下假 `/api/update` 触发通知、失焦保存触发通知、反馈问题剪贴板+浏览器、`shell.log` 滚动。dev 下通知可能不可用（非 .app bundle），验收以打包产物为准。

## 风险

- **端口通配 capability**：`http://127.0.0.1:*` URLPattern 语法托盘 spec 已核实；`cargo check` 会校验 capability/权限标识符合法性（编译期 ACL 检查）。
- **adhoc 未公证包的通知可用性**：失败模式 = 请求权限失败 → web 侧回退 toast / Rust 侧仅记日志，不崩溃（本机 Gatekeeper 已关，无法复现拦截，需真机补验）。
- **Rust ≥ 1.90**（single-instance 要求）：本地 1.97、CI dtolnay stable，`rust-version` 抬到 1.90。
- **CI Linux AppImage 托盘**：tauri 打包链自动捆绑 appindicator 依赖；若 CI 镜像缺失，托盘构建失败走「关窗即退」降级路径，发布产物仍可用。
- **push master 即发版**：本仓库 push master 自动触发 release 构建，合入即按现状发版（版本号不变则产物仍为 2.3.6 递增由 release 流程决定）。
