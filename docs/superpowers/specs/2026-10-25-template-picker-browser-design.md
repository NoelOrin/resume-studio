# 模板库「左列表 + 右放大预览」设计

日期：2026-10-25
状态：已实施（自主模式，交互方案由用户指定）

## 背景

用户反馈模板库「不够直接、可展示的量不够多、交互不够方便」，期望：**模板库列表在左侧，hover 对应模板时右侧出现放大预览**。

现状（`TemplatePicker.tsx` + `editor.css` `.ed-tpl-*`）：920px 弹窗内 3 列网格，每卡缩略图仅 124px 宽、只渲染第 1 页；模板细节（排版、字号、留白）根本看不清，想对比只能切换后回编辑器看，再不行就 `npm run preview:tpl` 截图。

## 非目标

- 不改模板注册与定义（`registry.tsx`、`defineTemplate`、`catalog.ts`）；新模板进 registry 自动出现在列表里。
- 不改纸张设计系统（`styles/pages.ts`、`templates/*/styles.ts`）。
- 不做模板筛选/搜索/市场（当前注册量个位数，列表滚动即可；超过 ~15 个再议）。

## 设计

### 1. 布局（`TemplatePicker.tsx` 重写 + `editor.css`）

弹窗加宽到 `min(1080px, 100%)`，body 换成左右双栏（`.ed-tpl-body`，高 `min(66vh, 640px)`，两栏各自滚动）：

- **左栏 `.ed-tpl-list`**（固定 ~300px）：紧凑模板行 `.ed-tpl-row`，每行 = 56px 宽小缩略图 + 英文名/中文名 + 页数徽标与标签。一次可见 4–6 行，模板增多时滚动。当前使用中的模板加 `is-active` 高亮。
- **右栏 `.ed-tpl-stage`**：放大预览。
  - 信息条 `.ed-tpl-stage-head`：模板名 + 中文名、描述、页数与标签（复用现有 `.ed-tpl-tags` 样式）。
  - 滚动区：按 `pageCountOf` 渲染**全部页**（现有实现只画第 1 页），页宽 500px（scale ≈ 0.63），页间留白并标注页码；页面居中。
- 页脚保留「新增模板」提示与关闭按钮。

### 2. 交互

- 组件引入 `useState` 维护 `previewedId`，默认当前模板 id。
- 行 `onMouseEnter` / `onFocus` → `setPreviewedId(t.id)`；鼠标离开列表**不回弹**（sticky，避免快速扫过时预览闪烁）。
- 点击行 / Enter / Space → `onPick(t.id)`，沿用 `EditorApp.switchTemplate`（应用模板并关弹窗）。
- 键盘：列表容器 `onKeyDown` 处理 ↑/↓，把焦点移到相邻行（预览随 focus 联动）。
- 预览切换不做防抖：模板量为个位数、每页是纯组件树，实测足够快；列表上 `onMouseLeave` 不回弹也消除了大部分抖动场景。

### 3. 安全与性能

- 预览每页独立包 `TemplateBoundary`（单个模板/页渲染失败不拖垮整个库，与缩略图同策略）。
- 预览页样式 `content-visibility: auto` + `contain-intrinsic-size`，滚出视口的页跳过渲染。
- 预览数据一律走 `previewDataFor`：各模板用自己的 catalog accent、保留文档内容（既有契约）。

### 4. 可访问性

- 行保持 `role="button"` + `tabIndex={0}`，`aria-pressed` 标注使用中。
- 预览信息条 `aria-live="polite"`，播报当前预览的模板名，键盘用户也能感知 hover 语义。

### 5. 测试（`tests/template-picker.test.ts`）

组件引入 hooks 后不能再以普通函数方式调用，测试改用 `createElement(TemplatePicker, …)` + `renderToStaticMarkup`。保留三条既有 accent 契约断言（分块锚点 `ed-tpl-card` → `ed-tpl-row`），新增：

- 列表行数 === `templates.length`（每个注册模板一行）。
- 预览区静态渲染默认展示当前模板，且使用该模板自己的 accent。

## 验收

1. `npm run check`、`npm test` 全绿。
2. 打开模板库：左侧一屏可见全部模板行，hover 任意行右侧立即出现该模板全页放大预览；点击即应用并关闭。
3. 纯键盘：Tab 进列表后 ↑/↓ 移动、预览联动、Enter 应用。
4. 视觉全部走 `--ed-*` 令牌，无新字面值（`editor.css` 约定）。

## 风险

- hover 高频切换触发整模板重渲染——个位数模板下可接受；若未来模板数大增，再给 `previewedId` 加 80ms 延迟或缓存。
- 并行会话正在新增 zine 模板（`registry.tsx` 有未提交改动）：本次只动 `TemplatePicker.tsx`、`editor.css`、`template-picker.test.ts` 与本 spec，提交时逐文件 `git add`，不碰他人改动。
