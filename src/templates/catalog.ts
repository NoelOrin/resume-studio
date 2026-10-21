import type { TemplateMeta } from "./types";

/**
 * Template catalog — safe to import from server components (no JSX, no CSS).
 * Add a new template here + a renderer in ./registry.tsx.
 */
export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    id: "industrial",
    name: "INDUSTRIAL",
    nameZh: "工业标签",
    description: "模切贴纸 / 钴蓝条带 / 信号波形与套准标记，高信息密度单页。",
    pages: 1,
    accent: "#2F52E0",
    tags: ["单页", "标签风", "高密度"],
  },
  {
    id: "industrial-duplex",
    name: "INDUSTRIAL DUPLEX",
    nameZh: "工业标签 · 双页",
    description: "同一套工业语言的跨页版本：第 1 页履历与技能，第 2 页项目档案。",
    pages: 2,
    accent: "#2F52E0",
    tags: ["双页", "作品集", "标签风"],
  },
  {
    id: "minimal",
    name: "MINIMAL",
    nameZh: "极简档案",
    description: "无衬线 + 细规则线的编辑排版，扫描线式信息层级。",
    pages: 1,
    accent: "#111111",
    tags: ["单页", "极简", "编辑排版"],
  },
  {
    id: "moonlight",
    name: "MOONLIGHT",
    nameZh: "月光海报",
    description: "夜行海报式版面：巨月与城市剪影、彩纸碎屑、三行压缩巨字，Kiwi 绿点睛。",
    pages: 1,
    accent: "#97F11D",
    tags: ["单页", "海报", "高视觉"],
  },
  {
    id: "quiet",
    name: "QUIET SPEC",
    nameZh: "色卡规格表",
    description: "以色卡为母版的印刷规格表：纸白、严格网格、编号索引，Kiwi 只做线与编号。",
    pages: 1,
    accent: "#97F11D",
    tags: ["单页", "极简", "印刷"],
  },
];

export function catalogEntry(id: string | undefined): TemplateMeta {
  return TEMPLATE_CATALOG.find((t) => t.id === id) ?? TEMPLATE_CATALOG[0];
}
