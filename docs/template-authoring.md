# 模板开发规范（Template Authoring Guide）

这是 Resume Studio 模板开发的**唯一权威文档**。新模板从零到可预览只需要一条命令；
本规范告诉你哪些是强制的（契约测试会拦住你）、哪些是推荐的（让模板像这个产品的一部分）。

```
npm run tpl:new blueprint "蓝图"     # ① 生成骨架并注册
npm run preview:tpl -- blueprint     # ② 真实 A4 渲染 + 溢出测量
npm run check && npm test            # ③ 契约校验（提交前必跑）
```

## 1. 契约

一个模板 = 一条目录元数据 + 一份作用域 CSS + 一个纯函数渲染器，由 `TemplateDefinition`（`src/templates/types.ts`）绑定：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | ✓ | kebab-case，唯一；决定 `.t-<id>` 作用域类与文件目录 |
| `name` / `nameZh` | ✓ | 模板库展示名（英文 / 中文） |
| `description` | ✓ | 一句话版面描述（模板库卡片） |
| `pages` | ✓ | 固定页数，或 `(data) => number` 按内容分页 |
| `accent` | ✓ | 默认主色；用户切到此模板时若未自定义主色则自动套用 |
| `tags` | ✓ | 模板库标签（单页 / 海报 / 印刷…） |
| `cssScope` | — | 与其他条目**共享实现**时声明（见 §5.1），否则不写 |
| `css` | ✓ | 字符串模板；全部选择器必须在 `.t-<id>` 作用域内 |
| `render(data, page)` | ✓ | 渲染第 `page` 页（0 起），返回该页根节点 |

渲染器的调用时机：编辑器对**当前页**实时调用、导出对**全部页**逐页调用、
模板库缩略图对**第 0 页**以模板默认主色调用（`previewDataFor`）。同一个 render 必须在任何 data 下不抛错——
`TemplateBoundary` 只隔离渲染期异常保住编辑器，模板自身的 bug 会在契约测试里被抓出来。

## 2. 硬性约定（`tests/template-contract.test.ts` 强制，违反即红）

1. **每页根节点**必须是 `<div class="tpl-page t-<id>">`（共享实现时为 `t-<cssScope>`）。
   `.tpl-page` 承载 A4 尺寸、分页与打印；`.t-<id>` 是 CSS 作用域。
2. **内容流**包在 `.tpl-flow` 里。编辑器的「超出 A4」警告靠测量它；漏掉则该页溢出检测静默失效。
3. **联动编辑面板**的区块加 `data-panel`，值只允许：
   `identity | profile | experience | projects | stack | education | flow | footer`（单一来源 `PANEL_IDS`）。
   点击右侧版面 → 左侧展开对应表单全靠它。
4. **CSS 全部作用域在 `.t-<id>` 下**。所有模板的 CSS 会同时注入同一个文档，
   一条裸选择器（如 `h2{...}`）会污染所有模板。
5. **全部页可渲染且不抛错**。多页模板的每一页都会被校验。
6. **id 唯一且 kebab-case**（进入 CSS 类名与文件路径）。

## 3. 结构约定（推荐，产品一致性的来源）

- **内部类名前缀**：`.t-<id>` 之内用统一短前缀（如 industrial → `.in-*`，quiet → `.qt-*`），避免与其他模板撞名。
- **主色只经 `--blue`**：根节点写 `style={{ "--blue": data.theme.accent }}`，模板内部不硬编码主题色——
  用户在「主题」面板改色时全模板联动。主色的用法建议克制（规则线、编号、点），大面积色块留给版面底色。
- **字体栈**：中文 `"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`；
  等宽 `"SF Mono",Menlo,monospace`；展示字体自选但给出回退。根节点统一
  `-webkit-font-smoothing:antialiased` 与 `print-color-adjust:exact`（打印保留底色）。
- **尺寸单位**：页面内边距与栅格用 `mm`，字号用 `pt`——A4 打印是第一公民。
- **溢出**：`.tpl-page` 自带 `overflow:hidden`，超出即裁切；设计时留出底部余量，
  用 `preview:tpl` 的 `flowOverflow` 数字而不是肉眼判断。
- **富文本**：正文里的 `{1.2M}`、`{60%}` 用 `rich()`（`src/templates/kit.tsx`）转成 `<b>`，
  模板内把 `b` 样式化为等宽强调。不要自己再实现一遍。
- **条件区块**：`data.flags.showYears / showStats / showFlow` 控制可选区块，关闭时**完全不留空位**。

## 4. 数据速查（`ResumeData`，v2）

| 区段 | 关键字段 |
| --- | --- |
| `header` | `nameZh` `nameEn` `titleZh` `titleEn` `tag` `status[]` `years{value,label}` `contacts[{label,value}]` |
| `profile` | `kicker`（"PROFILE / 个人简介"，用 `splitKicker` 拆） `text` `stats[{value,label}]` |
| `experience` | `no` `title` `zh` `meta` `jobs[{roleZh,roleEn,company,date,bullets[]}]` |
| `projects` | `no` `title` `zh` `meta` `items[{code,name,kind,desc,stats[{v,l}]}]` |
| `stack` | `no` `kicker` `groups[{k,v}]` `skills[{label,level(0-10)}]` |
| `education` | `no` `kicker` `school` `schoolMeta` `date` `degree` `items[]` |
| `flow` / `footer` | `flow{label,steps[],tag}`；`footer{copyright,code,product,edgeR}` |
| `strip` | 页眉小字段：`date` `sheet` `rev` |
| `flags` | `showYears` `showStats` `showFlow` |
| `theme` | `accent` — 唯一主题色来源 |

## 5. 常用配方

### 5.1 双页 / 共享实现（`cssScope`）

同一设计语言的多个条目共享一套组件与 CSS 时（如 `industrial` 与 `industrial-duplex`），
共享方的目录条目声明 `cssScope: "industrial"`：根节点写 `t-industrial`，CSS 只有一份
`.t-industrial`。契约测试按 `cssScope ?? id` 校验，不写会在两条目之一上报错。
页内差异用修饰类（如 `t-industrial--p2`）。

### 5.2 按内容分页

`pages: (data) => Math.max(1, Math.ceil(data.experience.jobs.length / N))`；
`render` 内按 `page` 参数切片数据，每页仍然输出完整的 `.tpl-page > .tpl-flow` 结构。

### 5.3 新区块 / 新面板

`PANEL_IDS` 里没有的面板不能直接出现在 `data-panel`（契约测试会拦）。
需要新增联动面板时：在 `src/templates/types.ts` 的 `PANEL_IDS` 加值，
并在 `src/EditorApp.tsx` 的 `PANELS` 加对应编辑表单——两者由测试与类型共同锁定。

## 6. 提交前检查清单

- [ ] `npm run preview:tpl -- <id>` 每页 `FITS=yes`，截图肉眼过一遍
- [ ] `npm run check && npm test` 全绿（契约测试自动覆盖你的模板）
- [ ] 模板库卡片信息完整：`name/nameZh/description/tags`，`accent` 是模板的"本命色"
- [ ] 换 3 种主色 + 关掉全部 `flags` 再预览一次（主题联动与条件区块）
- [ ] 用「打印预览」确认打印不被裁切

## 7. 工具参考

| 命令 | 作用 |
| --- | --- |
| `npm run tpl:new <id> [中文名]` | 生成 `src/templates/<id>/`（组件 + CSS）并自动注册 |
| `npm run preview:tpl -- <id>` | 真实 A4 + 截图 + 溢出数字（多页模板逐页输出） |
| `npm run preview:tpl -- --all` | 全部模板回归一遍 |
| `npm test` | 契约测试对每个注册模板强制执行 §2 |
