import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Prompts teach the client *how* to use the tools well: read first, patch surgically,
 * keep the `{metric}` convention, then render/publish. They produce user messages only.
 */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "tailor_resume_to_job",
    {
      title: "按招聘 JD 定制简历",
      description:
        "根据一段职位描述调整简历内容：先读现有文档，再用 patch_resume 做针对性修改，最后渲染或发布。",
      argsSchema: {
        jobDescription: z.string().describe("目标职位的 JD 原文（含职责与要求）"),
        resumeId: z.string().optional().describe("要修改的文档 id；省略时先列出现有文档供选择"),
      },
    },
    ({ jobDescription, resumeId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "你是资深简历顾问。请按下面的职位描述调整这份简历：",
              "",
              "## 职位描述",
              jobDescription,
              "",
              "## 步骤",
              resumeId
                ? `1. 调用 get_resume 读取文档 "${resumeId}"。`
                : "1. 调用 list_resumes 列出现有文档，再对最匹配的一份调用 get_resume。",
              "2. 对比 JD 找出 3–5 个差距：缺失关键词、弱化的成果、不相关的经历。",
              "3. 用 patch_resume 做最小必要修改：只改相关字段（profile.text、experience.jobs[].bullets、stack.skills 等），不要重写整份文档。",
              "4. 保留原有 `{指标}` 花括号写法（例如 `日均 {1.2M} 单`），新增量化成果也沿用该格式。",
              "5. 完成后调用 render_resume_html 检查页数是否溢出；必要时再精简。",
              "6. 最后用 publish_resume 或 render_resume_html 交付，并说明改了哪些地方、为什么。",
              "",
              "约束：不要编造不存在的经历；不确定的信息先问我。",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "polish_resume",
    {
      title: "润色简历文案",
      description:
        "在不改变事实的前提下润色简历：动词开头、量化成果、去掉空话。先读文档，再用 patch_resume 增量修改。",
      argsSchema: {
        resumeId: z.string().optional().describe("要润色的文档 id；省略时先列出现有文档"),
        focus: z.string().optional().describe("润色重点，例如「工作经历」「项目描述」「整体语气」"),
      },
    },
    ({ resumeId, focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "你是中文技术简历编辑。请润色这份简历的文案。",
              focus ? `润色重点：${focus}` : "润色重点：整体表达与量化程度。",
              "",
              "## 要求",
              "- 每条要点以动词开头，突出结果与规模，删掉「负责」「参与」这类弱动词。",
              "- 保留 `{指标}` 花括号格式；缺失的数字不要编造，标注为待补充。",
              "- 保持原有信息密度：工业标签模板一页内容有限，宁可精简不要注水。",
              "",
              "## 步骤",
              resumeId
                ? `1. 调用 get_resume 读取文档 "${resumeId}"。`
                : "1. 调用 list_resumes 选择目标文档，再 get_resume。",
              "2. 列出要改的字段和原句 → 新句的对照。",
              "3. 用 patch_resume 逐字段应用修改（patch 只包含被改动的部分）。",
              "4. 调用 render_resume_html 确认页数没有溢出，然后告诉我改动清单。",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
