import type { TemplateDefinition } from "./types";
import { defineTemplate } from "./factory";
import { IndustrialPage } from "./industrial/pages";
import { INDUSTRIAL_CSS } from "./industrial/styles";
import { INDUSTRIAL_DAY_CSS } from "./industrial/day-styles";
import { MinimalPage } from "./minimal/MinimalPage";
import { MINIMAL_CSS } from "./minimal/styles";
import { MoonlightPage } from "./moonlight/MoonlightPage";
import { MOONLIGHT_CSS } from "./moonlight/styles";
import { MOONLIGHT_DAY_CSS } from "./moonlight/day-styles";
import { QuietPage } from "./quiet/QuietPage";
import { QUIET_CSS } from "./quiet/styles";

import { ProofPage } from "./proof/ProofPage";
import { PROOF_CSS } from "./proof/styles";
// npm run tpl:new inserts imports for new templates above this line — do not remove

/**
 * Template registry — the single source of truth. Every entry is one
 * defineTemplate() call carrying its own metadata; the server-safe catalog
 * (src/templates/catalog.ts) is derived from this list. Contract, conventions
 * and recipes: docs/template-authoring.md
 */
export const templates: TemplateDefinition[] = [
  defineTemplate({
    id: "industrial",
    nameZh: "工业标签",
    description: "模切贴纸 / 钴蓝条带 / 信号波形与套准标记，高信息密度单页。",
    pages: 1,
    accent: "#2F52E0",
    tags: ["单页", "标签风", "高密度"],
    css: INDUSTRIAL_CSS,
    render: (data) => <IndustrialPage data={data} page={0} duplex={false} />,
  }),
  defineTemplate({
    id: "industrial-duplex",
    nameZh: "工业标签 · 双页",
    description: "同一套工业语言的跨页版本：第 1 页履历与技能，第 2 页项目档案。",
    pages: 2,
    accent: "#2F52E0",
    tags: ["双页", "作品集", "标签风"],
    cssScope: "industrial",
    css: INDUSTRIAL_CSS,
    render: (data, page) => <IndustrialPage data={data} page={page} duplex />,
  }),
  defineTemplate({
    id: "minimal",
    nameZh: "极简档案",
    description: "无衬线 + 细规则线的编辑排版，扫描线式信息层级。",
    pages: 1,
    accent: "#111111",
    tags: ["单页", "极简", "编辑排版"],
    css: MINIMAL_CSS,
    render: (data) => <MinimalPage data={data} />,
  }),
  defineTemplate({
    id: "minimal-duplex",
    nameZh: "极简档案 · 双页",
    description: "极简档案的跨页版本：第 1 页履历与技术栈，第 2 页项目档案与证书。",
    pages: 2,
    accent: "#111111",
    tags: ["双页", "极简", "编辑排版"],
    cssScope: "minimal",
    css: MINIMAL_CSS,
    render: (data, page) => <MinimalPage data={data} page={page} duplex />,
  }),
  defineTemplate({
    id: "moonlight",
    nameZh: "月光海报",
    description: "夜行海报式版面：巨月与城市剪影、彩纸碎屑、三行压缩巨字，Kiwi 绿点睛。",
    pages: 1,
    accent: "#97F11D",
    tags: ["单页", "海报", "高视觉"],
    css: MOONLIGHT_CSS,
    render: (data) => <MoonlightPage data={data} />,
  }),
  defineTemplate({
    id: "moonlight-duplex",
    nameZh: "月光海报 · 双页",
    description: "月光海报的跨页版本：第 1 页海报与履历，第 2 页项目档案与证书。",
    pages: 2,
    accent: "#97F11D",
    tags: ["双页", "海报", "高视觉"],
    cssScope: "moonlight",
    css: MOONLIGHT_CSS,
    render: (data, page) => <MoonlightPage data={data} page={page} duplex />,
  }),
  defineTemplate({
    id: "quiet",
    nameZh: "色卡规格表",
    description: "以色卡为母版的印刷规格表：纸白、严格网格、编号索引，Kiwi 只做线与编号。",
    pages: 1,
    accent: "#97F11D",
    tags: ["单页", "极简", "印刷"],
    css: QUIET_CSS,
    render: (data) => <QuietPage data={data} />,
  }),
  defineTemplate({
    id: "quiet-duplex",
    nameZh: "色卡规格表 · 双页",
    description: "色卡规格表的跨页版本：第 1 页履历，第 2 页项目规格索引与技术栈证书。",
    pages: 2,
    accent: "#97F11D",
    tags: ["双页", "极简", "印刷"],
    cssScope: "quiet",
    css: QUIET_CSS,
    render: (data, page) => <QuietPage data={data} page={page} duplex />,
  }),
  defineTemplate({
    id: "proof",
    nameZh: "打样稿",
    description: "拼贴小报的安静版：勾线巨字、细规则线与 hairline 网格，无噪点无胶带，主色只做文字点缀。",
    pages: 1,
    accent: "#C2431F",
    tags: ["单页", "印刷", "低调"],
    css: PROOF_CSS,
    render: (data) => <ProofPage data={data} />,
  }),
  defineTemplate({
    id: "proof-duplex",
    nameZh: "打样稿 · 双页",
    description: "打样稿的跨页版本：第 1 页履历，第 2 页项目附录与技术栈证书。",
    pages: 2,
    accent: "#C2431F",
    tags: ["双页", "印刷", "低调"],
    cssScope: "proof",
    css: PROOF_CSS,
    render: (data, page) => <ProofPage data={data} page={page} duplex />,
  }),
  defineTemplate({
    id: "industrial-day",
    nameZh: "工业标签 · 日光",
    description: "工业标签的亮色版：灰蓝条带、浅底横带、幽灵描边页脚，主色只做小面积点缀。",
    pages: 1,
    accent: "#3D5A80",
    tags: ["单页", "标签风", "亮色"],
    cssScope: "industrial",
    css: INDUSTRIAL_CSS + INDUSTRIAL_DAY_CSS,
    render: (data) => <IndustrialPage data={data} page={0} duplex={false} day />,
  }),
  defineTemplate({
    id: "industrial-day-duplex",
    nameZh: "工业标签 · 日光双页",
    description: "亮色工业语言的跨页版本：第 1 页履历与技能，第 2 页项目档案。",
    pages: 2,
    accent: "#3D5A80",
    tags: ["双页", "作品集", "亮色"],
    cssScope: "industrial",
    css: INDUSTRIAL_CSS + INDUSTRIAL_DAY_CSS,
    render: (data, page) => <IndustrialPage data={data} page={page} duplex day />,
  }),
  defineTemplate({
    id: "moonlight-day",
    nameZh: "月光海报 · 日光版",
    description: "同一张海报的日光版：米白纸面、浅灰城市线稿、苔绿点睛，克制亮色。",
    pages: 1,
    accent: "#4F7D63",
    tags: ["单页", "海报", "亮色"],
    cssScope: "moonlight",
    css: MOONLIGHT_CSS + MOONLIGHT_DAY_CSS,
    render: (data) => <MoonlightPage data={data} day />,
  }),
  defineTemplate({
    id: "moonlight-day-duplex",
    nameZh: "月光海报 · 日光双页",
    description: "日光海报的跨页版本：第 1 页海报与履历，第 2 页项目档案与证书。",
    pages: 2,
    accent: "#4F7D63",
    tags: ["双页", "海报", "亮色"],
    cssScope: "moonlight",
    css: MOONLIGHT_CSS + MOONLIGHT_DAY_CSS,
    render: (data, page) => <MoonlightPage data={data} page={page} duplex day />,
  }),
  /* npm run tpl:new inserts new registrations above this line — do not remove */
];

export function getTemplate(id: string | undefined): TemplateDefinition {
  return templates.find((t) => t.id === id) ?? templates[0];
}

/** Unique CSS for every registered template (injected once). */
export const ALL_TEMPLATE_CSS: string = Array.from(new Set(templates.map((t) => t.css))).join("\n");

export function templateCssFor(id: string | undefined): string {
  return getTemplate(id).css;
}
