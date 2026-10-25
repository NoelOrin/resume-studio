import type { TemplateDefinition } from "./types";
import { defineTemplate } from "./factory";
import { IndustrialPage } from "./industrial/pages";
import { INDUSTRIAL_CSS } from "./industrial/styles";
import { MinimalPage } from "./minimal/MinimalPage";
import { MINIMAL_CSS } from "./minimal/styles";
import { MoonlightPage } from "./moonlight/MoonlightPage";
import { MOONLIGHT_CSS } from "./moonlight/styles";
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
    id: "proof",
    nameZh: "打样稿",
    description: "拼贴小报的安静版：勾线巨字、细规则线与 hairline 网格，无噪点无胶带，主色只做文字点缀。",
    pages: 1,
    accent: "#C2431F",
    tags: ["单页", "印刷", "低调"],
    css: PROOF_CSS,
    render: (data) => <ProofPage data={data} />,
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
