# 编辑器 UI 布置优化与产品一致性设计

日期：2026-10-24
状态：已实施（自主模式，依据全文审计）

## 背景

用户要求「优化 UI 布置、强化产品一致性」。对 `src/styles/editor.css`（1635 行）与编辑器壳层组件做了全文审计，发现一致性问题的根源是**缺少令牌层**：所有视觉决策以字面值散落在各规则里，同类意图各有各的写法。

## 审计结论（问题清单）

| 类别 | 现状 |
| --- | --- |
| 灰阶 | 17 种字面灰（`#8a8a83 ≈ #9a9a92 ≈ #a0a099` 等近重复并存） |
| 主色 | `--ed-blue` 有变量，但 hover `#1f3dbb` 与 6 档 `rgba(47,82,224,α)` 全部硬编码 |
| 危险色 | `#bf3b2b` 硬编码 11 处，无 token |
| 边框 | `rgba(0,0,0,0.12…0.42)` 12 档无规则，`0.15` 与 `0.16` 混用 |
| 圆角 | 2/3/4/5/6px 五档 + 两种 pill，无对应关系 |
| 字阶 | mono 8→12 共 9 档，cn 10→13 共 6 档 |
| 结构 bug | `.ed-side-foot` 写在滚动容器 `.ed-side-scroll` 内部（随内容滚走）；`.ed-warn` 中 `z-index:6` 重复两遍；`.ed-toggle` 隐藏 input 用 `position:absolute` 但父级无定位 |
| 交互一致性 | 除输入框外全部交互元素缺 `:focus-visible`；「hover 反色」模式在 4 处各写一遍 |
| 顶栏 | 「模板」按钮孤悬两组之间；「打印/保存/发布/文档库/设置」五键平铺无语义分隔 |
| 组件重复 | 5 种卡片容器（`ed-item/ed-doc-row/ed-set-block/ed-mcp-item/ed-tpl-card`）、3 种分组头（`ed-sub/ed-set-head/ed-mcp-group-head`）样式各异 |
| 脆弱选择器 | 移动端断点用 `.ed-tools .ed-group:nth-of-type(3)` 隐藏导出组，依赖 DOM 顺序 |

## 方案选择

- **A. 仅令牌化**（纯 CSS 内部重构，无视觉变化）：一致性收益高但「优化布置」落空。
- **B. 令牌化 + 结构修复 + 顶栏重排**（选定）：低视觉风险下同时满足两个诉求。
- **C. 拆分多文件 + 组件样式模块化**：工程化彻底但构建/注入链路都要动，YAGNI。

选 **B**。范围之外：模板侧样式（`styles/pages.ts`、`templates/*/styles.ts`）保持不动——那是简历纸张自己的设计系统，与编辑器 chrome 分离是有意设计。

## 设计

### 1. 设计令牌层（editor.css `:root` 扩展，保持 `--ed-` 前缀）

- **墨阶**：`--ed-ink #111`（正文/实线/反色底）、`--ed-ink-2 #3c3c37`（次级文字）、`--ed-muted #61615a`（标签）、`--ed-faint #94948d`（提示/水印字）、`--ed-dim #c9c9c1`（关闭态圆点）
- **纸面**：`--ed-paper #fff`、`--ed-panel #f8f8f4`（侧栏）、`--ed-panel-2 #f1f1ea`（表头/hover）、`--ed-panel-3 #fafaf6`（代码/浅卡）、`--ed-bg #e3e3dc`（应用底）、`--ed-stage #dedfd9`（预览台）
- **主色**：`--ed-accent #2f52e0`、`--ed-accent-strong #1f3dbb`、`--ed-accent-wash rgba(…,.07)`、`--ed-accent-ring rgba(…,.18)`、`--ed-accent-line rgba(…,.4)`、`--ed-accent-line-strong rgba(…,.85)`
- **状态色**：`--ed-danger #bf3b2b` + `--ed-danger-line rgba(…,.4)`、`--ed-warn #ffd400`
- **边框五档**：`--ed-hair .15` < `--ed-line-soft .24` < `--ed-line-mid .32` < `--ed-line-strong .45` < 实线 `--ed-line #111`；`--ed-wash rgba(0,0,0,.04)` 作 hover 水洗底
- **圆角**：`--ed-r-xs 2` / `--ed-r-sm 3` / `--ed-r-md 4` / `--ed-r-lg 6` / `--ed-r-pill 99px`（弹窗 5px 归入 lg）
- **字阶**：mono/cn 微标签收敛为 `--ed-fs-2xs 8.5` / `--ed-fs-xs 9.5` / `--ed-fs-sm 11` / `--ed-fs-md 12.5` / `--ed-fs-lg 13`（原 8→8.5、9/10→9.5、10.5/11.5→11、12→12.5，位移 ≤0.5px）；展示字号（15/17/20/25）保持字面值

### 2. 结构修复

- `EditorApp.tsx`：`.ed-side-foot` 移出 `.ed-side-scroll`，成为侧栏固定底栏
- `.ed-warn` 去重 `z-index`
- `.ed-toggle` 加 `position:relative`，隐藏 input 收进自身盒子

### 3. 交互一致性

- 全局 `:focus-visible` 规则：所有按钮/图标/手风琴头/色块/分页点获得统一的 2px accent 外描边（替代浏览器默认）
- 三种分组头统一为「大写 mono 小字 + 1px 虚线下边 `--ed-hair`」
- 五种卡片容器统一到「`--ed-line-soft` + `--ed-r-md` + `--ed-paper`」配方，`ed-item`/`ed-tpl-card` 保留 `--ed-r-lg` 的大卡层级
- 手风琴展开态加 2px 左侧 accent 强调条，与右侧版面 hover 虚线呼应

### 4. 顶栏语义重排（EditorApp.tsx）

按钮按语义成簇，簇间竖线分隔：**历史**（撤销/重做）｜**视图**（缩放）｜**内容**（模板/导入/JSON/HTML）｜**输出**（打印/保存/发布）｜**应用**（文档库/设置）。移动端断点的 `nth-of-type(3)` 改为显式 `.ed-group--io`。

## 验收

1. `npm run check`、`npm test` 通过
2. dev server 截图对比：默认态、模板库、设置弹窗无回归，focus 态可见
3. 字面色清零：editor.css 中除令牌定义外不再出现 hex 灰/主色/危险色字面值

## 风险与回滚

改动集中在 `editor.css`、`EditorApp.tsx`，测试不依赖 CSS 类名；单 commit 可整体 revert。字阶合并带来的 ≤0.5px 位移通过截图验证。
