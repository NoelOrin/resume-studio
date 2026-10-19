# RESUME STUDIO · vinext 全栈多模板简历编辑器

工业标签风简历模板 → 可视化编辑器 → **vinext（Next.js API on Vite）全栈应用**。
左侧表单实时编辑，右侧 A4 预览；支持 **多套模板 / 多页模板**、撤销重做、自动保存、文档库、发布分享、JSON / HTML / PDF 导出。

```
Next.js App Router on Vite (vinext 1.2 / Vite 8 / React 19 RSC)
├── app/                     路由：页面、Route Handlers、发布页
├── src/
│   ├── EditorApp.tsx        编辑器（client component）
│   ├── templates/           模板注册表：industrial / industrial-duplex / minimal
│   ├── sections/            8 个编辑面板
│   ├── server/store.ts      文件存储（.data/docs、.data/published）
│   └── ...
└── .data/                   本地数据（gitignore）
```

## 快速开始

```bash
npm install
npm run dev        # vinext dev → http://localhost:5173
```

生产：

```bash
npm run build
npm run start      # 默认 3000，被占用时：npx vinext start --port 3020
```

类型检查：`npm run check`。需要 Node 20+。

## 模板系统（多页 / 可扩展）

模板在 `src/templates/catalog.ts` 注册元数据，在 `src/templates/registry.tsx` 绑定渲染器。每个模板是一个纯函数：

```ts
type TemplateDefinition = TemplateMeta & {
  css: string;                                  // 作用域内的模板 CSS
  render: (data: ResumeData, page: number) => ReactNode; // 渲染第 page 页（0 起）
};
```

当前内置：

| 模板 | 页数 | 说明 |
| --- | --- | --- |
| `industrial` | 1 | 原版工业标签：模切卡片、钴蓝条带、信号波形 / 套准标记 |
| `industrial-duplex` | 2 | 第 1 页身份 + 简介 + 履历 + 技能，第 2 页项目档案 + 证书 + 联系 |
| `minimal` | 1 | 极简编辑排版：细规则线、大字号姓名、黑白 + 主色强调 |

新增模板只需三步：

1. 新建 `src/templates/<id>/`：一个渲染组件 + 一份以 `.t-<id>` 为根的 scoped CSS；
2. 在 `catalog.ts` 加一条元数据（名称、描述、`pages`、默认主色、标签）；
3. 在 `registry.tsx` 注册 `css` 与 `render`。

约定：页面根节点使用 `.tpl-page`，内容流包在 `.tpl-flow` 内（编辑器据此做 **逐页 A4 溢出检测**）；需要联动编辑面板的区块加 `data-panel="identity|profile|experience|projects|stack|education|flow|footer"`。

编辑器会自动：注入全部模板 CSS、渲染模板缩略图、显示页码 / 翻页器、打印与导出全部页面、切换模板时套用该模板默认主色（用户自定义主色则保留）。

## 编辑器能力

- **实时 A4 预览**：适应 / 50% / 75% / 100%，多页模板可翻页（PAGE 01 / 02）
- **点击定位**：点右侧版面任意区块 → 左侧展开对应表单
- **撤销 / 重做**：⌘Z / ⇧⌘Z；输入框内直接撤销会先提交编辑历史
- **原地增删排序**：经历、要点、项目、指标、技能、联系方式、流程步骤
- **指标高亮**：正文里 `日均 {1.2M} 单` → 蓝色等宽重点
- **模板库**：3 套实时缩略图，单击切换；模板默认主色自动适配
- **主题**：6 套主色 + 任意取色；年份徽标 / 统计 / 流程条可开关
- **溢出检测**：按当前页检测 `.tpl-flow`，超出 A4 顶部出现黄色警示
- **自动保存**：localStorage（350ms 防抖）+ 服务器静默同步
- **导出**：JSON（v2，含 `templateId`，兼容导入 v1）、自包含 HTML（全部页面）、打印 PDF
- **文档库**：服务器多份存档；打开走 `/?doc=<id>` 服务端渲染
- **发布**：`POST /api/publish` → 生成 `/p/<id>` 静态 HTML，复制链接即可分享

## 后端（vinext Route Handlers）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 + 已注册模板列表 |
| GET | `/api/docs` | 文档列表 |
| GET / PUT / DELETE | `/api/docs/:id` | 读取 / 保存 / 删除（`{ title, data }`） |
| POST | `/api/publish` | `{ id, title, html }` → `.data/published/<id>.html` |
| GET | `/p/:id` | 返回已发布的完整 HTML |

存储目录：`process.env.RESUME_DATA_DIR ?? <cwd>/.data`，文档为 JSON，发布页为自包含 HTML。
`app/page.tsx` 是 **Server Component**：读取文档列表与 `?doc=` 指定文档后传入客户端编辑器；写操作全部走 Route Handlers。

## 目录

```
app/
├── layout.tsx               Metadata + 全局 editor.css
├── page.tsx                 SSR：listDocs / readDoc → <EditorApp/>
├── icon.svg
├── api/health|docs|publish  Route Handlers
└── p/[id]/route.ts          发布页
src/
├── EditorApp.tsx            编辑器外壳（工具栏 / 表单 / 预览 / 打印层）
├── templates/
│   ├── catalog.ts           模板元数据（服务端安全）
│   ├── registry.tsx         模板注册 + CSS 聚合
│   ├── types.ts             TemplateDefinition 契约
│   ├── industrial/          pages.tsx + styles.ts（原版 + 双页）
│   └── minimal/             MinimalPage.tsx + styles.ts
├── components/              Accordion / fields / TemplatePicker / LibraryModal
├── sections/                8 个编辑面板
├── lib/                     store / overflow / backend / exporters / migrate
├── server/store.ts          fs 存储
├── styles/                  editor.css、pages.ts（A4 + 导出壳）
├── data/defaultResume.ts    示例内容
└── types.ts                 ResumeData v2
```

## 打印 / 字体

- 打印：A4、边距「无」、勾选「背景图形」；多页模板每页自动分页。
- 字体使用系统自带：DIN Condensed、HarmonyOS Sans SC、SF Mono（含 Arial Narrow / PingFang 回退）。
- 导出的 HTML 与发布页不依赖本项目 JS/CSS，可独立打开与二次分发。

## 说明

- 目标运行时为 **Node**（vinext 的 Node 平台）。如果部署到 Cloudflare Workers，需要把 `src/server/store.ts` 换成 KV/R2/D1 实现，其余代码不变。
- vinext 仍处于快速迭代期，本项目只使用其稳定的 App Router / Route Handler 能力。
