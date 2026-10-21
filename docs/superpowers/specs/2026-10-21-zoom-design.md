# Resume Studio 画布自由缩放设计

- 日期：2026-10-21
- 状态：已确认，待实现
- 关联：Resume Studio v2.1（vinext 全栈多模板简历编辑器）

## 1. 目标

把预览画布从「适应 / 50% / 75% / 100%」四个离散档位升级为连续、可记忆的自由缩放。

验收标准：

1. 顶栏出现连续缩放控件：`适应 · − · 滑块 · + · 百分比`，百分比实时反映当前有效比例。
2. 缩放范围 25%–400%，任意比例可用；滑块拖动即进入手动模式，点「适应」/百分比数字回到适应。
3. `⌘/Ctrl + 滚轮`（含触控板双指捏合）以光标位置为锚点连续缩放，光标下的纸张内容不漂移。
4. 放大到溢出时，可在画布上按住拖拽平移；位移超过阈值时不触发现有「点版面定位表单」。
5. 双击画布背景回到适应。
6. 缩放偏好写入 `localStorage`，刷新/重开沿用；值超范围自动钳制。
7. 25% 与 400% 下，纸张左上角内容均可滚动到达（修复现有居中溢出的不可达区域）。

## 2. 非目标

- 不做键盘快捷键（用户未选 `⌘+ / ⌘− / ⌘0`）。
- 不改导出 HTML / 打印 PDF 的版式：`.tpl-export` 仍按 A4 实际尺寸输出，与预览缩放无关。
- 缩放比例不写入简历 JSON 或服务端文档，仅作为本地 UI 偏好。
- 不改 MCP / 模板渲染 / 表单结构。

## 3. 交互契约

| 操作 | 行为 |
| --- | --- |
| 滑块拖动 | 进入 `manual`，比例 = 滑块值（1% 步进），实时重绘 |
| `−` / `+` | 进入 `manual`，比例 ∓10 个百分点，钳制到 25%–400% |
| 点「适应」或百分比数字 | 进入 `fit`，比例 = 视口可用宽高比（沿用现有 `fit` 计算，下限 20%） |
| `⌘/Ctrl + 滚轮` | `manual`；以光标为锚点按指数步进缩放，`preventDefault` 阻止浏览器页面缩放 |
| 画布拖拽 | 仅当内容溢出可滚动时生效；`grab/grabbing` 光标；位移 > 4px 抑制该次 click |
| 双击画布背景 | 回到 `fit`（双击纸张内文本区不触发） |

有效比例 `scale = mode === "fit" ? fit : value`。顶部百分比与底部 caption 百分比都读取 `scale`。

## 4. 实现单元

### 4.1 `src/lib/useZoom.ts`（新增）

职责：缩放状态与持久化的唯一来源。

- 常量 `ZOOM_MIN = 0.25`、`ZOOM_MAX = 4`、`ZOOM_STEP = 0.1`。
- 状态：`mode: "fit" | "manual"`、`value`；hook 签名 `useZoom(fit: number)`，返回 `{ mode, scale, setFit, setManual, zoomBy }`，`scale` 由 hook 内部按 `mode` 与 `fit` 计算。
- 方法：`setManual(next)`（钳制并置 manual）、`setFit()`、`zoomBy(delta)`（钳制后置 manual）。光标锚点补偿留在 `EditorApp`，不进 hook。
- 持久化：`localStorage["resume-studio:zoom"] = JSON.stringify({ mode, value })`；挂载后恢复一次，解析失败/越界回退 `fit`。
- 避免 SSR 不一致：首帧恒为 `fit`，恢复放在 `useEffect`。

### 4.2 `src/components/ZoomControl.tsx`（新增）

纯展示组件：`{ mode, scale, onFit, onZoomBy, onSlide }`。

- 结构：`适应` 按钮、`−` 按钮、`<input type="range" min=25 max=400 step=1>`、`+` 按钮、百分比按钮。
- `scale` 同步到滑块值；`aria-label` 完整（缩放比例、放大、缩小、适应窗口）。
- 键盘可达：滑块原生键盘行为即可。

### 4.3 `src/EditorApp.tsx`（接线）

- 删除本地 `zoom` state，改用 `useZoom`；`fit` 仍由 ResizeObserver 计算。
- 滚轮：在 `.ed-stage` 上以原生 `{ passive: false }` 监听，仅 `event.ctrlKey || event.metaKey` 时拦截；否则放行常规滚动。
- 锚点补偿：缩放前记录光标在纸张坐标系中的位置（用 `.ed-canvas` 的 `getBoundingClientRect()` 与 `scale` 反算），`useLayoutEffect` 中按新尺寸调整 `.ed-stage.scrollLeft/scrollTop`。
- 拖拽平移：`pointerdown/move/up` 记录起始滚动位置与位移；超过 4px 设 `dragged` 标记，click 捕获阶段消费并阻止一次「点版面定位」。
- 双击：仅当 `event.target` 不属于 `.tpl-page` 时回适应。

### 4.4 `src/styles/editor.css`

- 新增 `.ed-zoomctl`、滑块样式（轨道/滑块与工业风一致）、`.ed-zoompct` 按钮。
- `.ed-stage-inner` 改为安全居中：`margin-block: auto` + `min-height: 100%`（内容高于视口时 auto margin 归零，顶部可滚动到达）；`.ed-stage` 增加 `overscroll-behavior: contain`。
- 拖拽态 `.ed-stage.is-panning { cursor: grabbing }`；可平移时 `cursor: grab`。
- 响应式：≤1240px 显示紧凑形态 `− 百分比 +`，隐藏滑块；不整体隐藏缩放能力。

## 5. 边界与错误处理

- 恢复的比例若在当前视口下大于可用空间：照常显示并允许滚动（用户可点适应），不静默改值。
- `localStorage` 不可用（隐私模式）时静默降级，仅内存生效。
- 滚轮缩放频率高：状态更新按帧合并（`requestAnimationFrame`），避免每个 wheel 事件一次 React render。
- 滑块拖动期间不写入 localStorage 每条事件；`change`/节流 200ms 写入。
- 缩放后保留当前页码；切模板仍重置到第 1 页（现状不变）。

## 6. 验证

- `npm run check`（tsc）通过。
- 手动验证清单：滑块全范围、±按钮、适应、⌘+滚轮锚点、触控板捏合、拖拽平移、双击背景、刷新后比例记忆、1240px 以下紧凑形态、25%/400% 角落可达。
- 现有导出/打印回归：`npm run preview:tpl -- --all` 输出 FITS 状态不受影响。
