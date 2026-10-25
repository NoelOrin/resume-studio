# 模板亮色变体（industrial-day / moonlight-day）— 设计

日期：2026-10-25 · 状态：已实施

## 背景

用户新增统一设计约束：**模板尽量亮色、不张扬、克制且有设计感**。对 5 个注册模板体检：quiet / proof / minimal 达标；industrial（高饱和钴蓝 `#2F52E0` 实心横带）与 moonlight（整页 `#111` 深底 + 荧光绿 `#97F11D` 大色块）违规。

**用户决策：不做替换，旧模板原样保留，亮色版以新模板条目新增**（模板库并存，用户自选）。

## 非目标

- 不动 industrial / industrial-duplex / moonlight 三个既有条目的任何样式与元数据。
- 不动排版骨架、栅格与分页结构；FITS 溢出指标保持 0。
- 不改既有模板 id、面板联动（PANEL_IDS）、MCP 工具注册。

## 设计

**共享实现 + 皮肤覆盖层**，不复制整份实现：

- 页面组件加 `day?: boolean` prop：industrial 的 `PageRoot` 追加根类 `t-industrial-day`，moonlight 根追加 `t-moonlight-day`；不传时行为与旧版逐字节一致。
- 新增 `src/templates/industrial/day-styles.ts`（`INDUSTRIAL_DAY_CSS`）与 `src/templates/moonlight/day-styles.ts`（`MOONLIGHT_DAY_CSS`）：全部覆盖规则以**双前缀**（`.t-industrial.t-industrial-day …`）书写，特异度恒高于基础实现，不依赖注入顺序。
- 覆盖策略（与首次替换版一致）：主色降饱和（`--blue` 由 registry accent 内联注入：灰蓝 `#3D5A80` / 苔绿 `#4F7D63`）；实心大色块 → 8% `color-mix` 浅底 + 细墨线；moonlight 翻转变量语义（onyx 阶梯变纸面浅灰、`--paper` 变底色）+ 逐条翻转 `--paper` 文字引用；页脚巨字改描边幽灵字；cur job 高亮收敛为描边。
- registry 新增 3 条目（`cssScope` 指向共享实现，`css = 基础 + DAY 覆盖` 拼接）：
  - `industrial-day`（工业标签 · 日光，1 页）
  - `industrial-day-duplex`（工业标签 · 日光双页，2 页）
  - `moonlight-day`（月光海报 · 日光版，1 页）
- `src/mcp/catalog.ts` 的 server instructions 模板枚举同步补齐新 id。

## 验收

- `npm run check` / `npm test` 全绿（contract test 自动覆盖新条目：scope 类、面板 id、溢出）。
- `preview:tpl --all` 全部 FITS=yes、overflow=0；旧 5 模板截图与改前逐像素一致（样式未触碰）。
- 目检：新条目无大面积高饱和色块；moonlight-day 全页亮色。

## 风险

- 覆盖层漏翻 `--paper` 文字引用会出现"纸上纸字"——以全量截图目检兜底（首版替换时抓到过 `.ml-sen`）。
- 用户在编辑器里自选 accent 偏艳时，浅底色块会随之变艳：主色面积已收敛，接受。
- 皮肤与基础层耦合：改 industrial/moonlight 基础样式时需回归两条 day 变体的截图。
