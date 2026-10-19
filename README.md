# RESUME STUDIO · 可视化简历编辑器

把原来的静态简历模板（`../resume.html`）改造成一个 **Vite + React** 的所见即所得编辑器：
左边改内容，右边实时渲染同一张 A4 工业标签风简历；可自动保存、存档多份、导出 JSON / 单页 HTML / PDF，也能一键“发布”成静态页面。
样式与模板 **100% 共享同一份 CSS**（`src/styles/sheetCss.ts`），所以预览、导出 HTML、打印出来的永远是同一个版本。

```
┌──────────────────────────────────────────────────────────────┐
│ RESUME STUDIO  文档名   保存状态      撤销 重做 缩放 导出 打印  │
├───────────────────┬──────────────────────────────────────────┤
│ 01 身份与联系      │                                          │
│ 02 个人简介        │            ┌──────────────┐              │
│ 03 工作经历        │            │   A4 预览     │  ← 点区块定位 │
│ 04 项目            │            │  210×297mm    │              │
│ 05 技术栈          │            └──────────────┘              │
│ 06 教育与证书      │                                          │
│ 07 页脚与流程      │                                          │
│ 08 主题与显示      │                                          │
└───────────────────┴──────────────────────────────────────────┘
```

## 快速开始

```bash
cd resume-editor
npm install
npm run dev          # → http://localhost:5178
```

`npm run dev` 同时启动 Vite 和本地文档 API（通过 Vite 中间件，不需要第二个进程）。

生产模式：

```bash
npm run build
npm start            # → http://localhost:5174 （静态站点 + API + 已发布页面）
```

> 需要 Node 20+。开发服务器端口 5178（被占用时自动换端口）；生产默认 5174，可用 `PORT=xxxx npm start` 覆盖。

## 编辑器功能

| 功能 | 说明 |
| --- | --- |
| 实时预览 | A4 等比缩放，支持「适应 / 50% / 75% / 100%」 |
| 面板定位 | 点击右侧简历上的任意区块，左侧自动展开对应表单 |
| 自动保存 | 300ms 防抖写入 `localStorage`，刷新不丢 |
| 撤销 / 重做 | ⌘Z / ⇧⌘Z，文本在失焦时提交历史，增删排序立即提交 |
| 原地增删 | 经历、项目、要点、联系方式、技能、流程步骤都可增删 / 上下移动 |
| 主题 | 6 套预设主色 + 任意自定义色；年份徽标 / 数字统计 / 流程条可开关 |
| 溢出检测 | 内容超出 A4 时页面顶部出现黄色提示，避免打印被裁切 |
| 导入 / 导出 | JSON（可再导入）、单页 HTML（自包含 CSS，可直接分享） |
| 打印 | ⌘P / 「打印」→ A4、边距 0、勾选「背景图形」 |
| 文档库 | 服务器端多份存档，可打开 / 删除 / 新建副本 |
| 发布 | 生成 `/p/<id>.html` 并复制链接（后端在线时） |

指标高亮：正文里用花括号包住关键数字即可渲染成蓝色等宽字体，例如
`日均 {1.2M} 单，P99 降至 {210ms}`。

## 后端 API

本地 Express 风格的零依赖 handler（`server/api.mjs`），数据落在磁盘：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查（前端据此决定是否启用服务器功能） |
| GET | `/api/docs` | 文档列表 |
| GET | `/api/docs/:id` | 读取单份简历 |
| PUT | `/api/docs/:id` | 保存（`{ title, data }`） |
| DELETE | `/api/docs/:id` | 删除 |
| POST | `/api/publish` | `{ id, title, html }` → 写入 `server/published/<id>.html` |
| GET | `/p/<id>.html` | 访问已发布的静态简历 |

- 存档目录：`server/data/*.json`
- 发布目录：`server/published/*.html`
- 开发环境由 `vite.config.mjs` 里的 `resumeApi()` 插件挂载；`npm start` 时由 `server/index.mjs` 提供。
- 后端不可用时，编辑器自动降级为纯浏览器保存，导出的 HTML 走本地下载。

## 目录结构

```
resume-editor/
├── index.html
├── vite.config.mjs          # React 插件 + 开发期 API 中间件
├── server/
│   ├── api.mjs              # 文档 / 发布 handler（dev + prod 共用）
│   └── index.mjs            # 生产入口（静态 + API）
└── src/
    ├── App.tsx              # 编辑器外壳：工具栏 / 表单 / 预览 / 打印层
    ├── types.ts             # ResumeData 数据模型
    ├── data/defaultResume.ts# 默认内容（改这里可换示例）
    ├── components/
    │   ├── ResumeSheet.tsx  # A4 简历渲染（纯展示，浏览器预览与导出共用）
    │   ├── fields.tsx       # 输入框、列表、开关等表单原语
    │   ├── Accordion.tsx
    │   └── LibraryModal.tsx
    ├── sections/            # 8 个编辑面板
    ├── lib/
    │   ├── useResumeStore.ts# 状态 + 撤销栈 + 自动保存
    │   ├── useSheetOverflow.ts
    │   ├── backend.ts       # API client
    │   ├── exporters.ts     # 单页 HTML / JSON / 下载
    │   └── arrays.ts
    └── styles/
        ├── sheetCss.ts      # 简历本体样式（从模板原样搬运，唯一真源）
        └── editor.css       # 编辑器 UI
```

## 数据模型

全部内容都在 `src/types.ts` 的 `ResumeData` 里，`version: 1`。
导入 JSON 时会校验 `version / header / experience`，失败会提示。
想改默认内容，直接编辑 `src/data/defaultResume.ts`（或导入自己导出的 JSON）。

## 打印 / 发布注意事项

- 浏览器打印：**A4、边距「无」、勾选「背景图形」**，否则蓝底与描边字会缺失。
- 字体使用 macOS 自带：`DIN Condensed`、`HarmonyOS Sans SC`、`SF Mono`，并有 Arial Narrow / PingFang 回退；跨平台分享建议直接发导出的 HTML 或 PDF。
- 发布出来的 HTML 是**完全自包含**的（样式内联在页面里），不依赖本项目的 JS/CSS。
