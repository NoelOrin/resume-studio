# 模板能力优化与快速开发规范设计

日期：2026-10-24
状态：已实施（自主模式）

## 背景

模板系统已有清晰契约（`TemplateDefinition`：meta + css + render(data, page)），但开发一个新模板仍靠「读 README 散落段落 + 抄现有模板」：约定（`.tpl-page` 根、`.tpl-flow` 流、`data-panel` 联动、`.t-<id>` 作用域 CSS、`--blue` 主色）全靠自觉，违反时**静默破坏**溢出检测和点击定位；`{指标}` 富文本助手在全部 4 个模板中逐字重复；`npm run preview:tpl` 只渲染第 1 页；没有脚手架。

## 目标

1. 一份**规范文档**作为新模板开发的唯一入口，照做即可产出合格模板。
2. 规约**可执行**：契约校验进测试，未来任何模板违反约定直接红。
3. 脚手架把「新建 → 注册 → 可预览」压缩到一条命令。

非目标：改任何现有模板的视觉；改运行时渲染管线（PAGE_CSS / TemplateBoundary 不动）。

## 设计

### A. 规范文档 `docs/template-authoring.md`

唯一权威：契约与生命周期、硬性约定（含理由）、ResumeData 速查、富文本 `{metric}` 约定、
四步工作流（scaffold → register → preview → validate）、检查清单、常用配方（双页、按数据分页、flags 条件区块）。README 模板章节指向它。

### B. 契约校验（规约可执行）

- `src/templates/validate.tsx`：`validateTemplate(tpl)` 用 `renderToStaticMarkup` 渲染全部页（0..pageCount-1，`previewDataFor` 套模板默认主色），断言：
  1. 每页根节点含 `tpl-page` 与 `t-<id>` 两个类；
  2. 存在 `.tpl-flow` 后代（溢出检测依赖）；
  3. 所有 `data-panel` 值 ∈ 已知面板 id；
  4. `css` 含 `.t-<id>` 选择器（作用域约定）；
  5. 渲染期间不抛错（TemplateBoundary 只兜编辑器，不兜模板 bug）。
  校验器只跑在测试/脚本（Node），不进应用运行时。
- `tests/template-contract.test.ts`：对**全部注册模板**跑校验——未来新模板一注册就被覆盖，规约自动生效。

### C. 面板 id 单一来源

`src/templates/types.ts` 导出 `PANEL_IDS`（identity/profile/experience/projects/stack/education/flow/footer）与 `PanelLink` 类型；`EditorApp` 的编辑面板 id 改为 `PanelLink | "theme"`，点击定位的 `dataset.panel` 收敛到同一类型，消除字符串漂移。

### D. 共享模板工具 `src/templates/kit.tsx`

`rich()`（`{1.2M}` → mono 强调）从 4 个模板去重为单一实现；`splitKicker` 一并入 kit（quiet 在用）。

### E. 脚手架 `scripts/scaffold-template.mjs`（`npm run tpl:new <id> [中文名]`）

生成 `src/templates/<id>/`：渲染组件（tpl-page/tpl-flow 骨架 + 全部 data-panel 区块占位 + kit 引入）与
`.t-<id>` 作用域 CSS 起步文件（主色变量、字体栈、打印规则齐备）；并以标记注释
（`catalog.ts` / `registry.tsx` 内新增 `TPL:NEW` 标记）自动插入注册片段。生成后打印预览与校验命令。

### F. 预览工具增强

`preview:tpl` 渲染**全部页**（多页模板每页各出 html/png），逐页报告溢出；`--all` 汇总保持既有行为。

## 验收

1. `npm run check`、`npm test` 全绿（含新契约测试覆盖 5 个现有模板）。
2. `npm run preview:tpl -- --all` 对 duplex 模板输出 2 页。
3. `npm run tpl:new demo` 端到端：生成文件、注册片段就位、契约测试对其生效（演示后删除）。
4. 规范文档与 README 互相引用。

## 风险与回滚

不动运行时渲染管线与现有模板视觉；kit 去重为纯等价替换（逐字相同实现）。单 commit 可 revert。
