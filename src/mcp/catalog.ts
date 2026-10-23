/**
 * Single source of truth for what this app exposes over MCP.
 *
 * Plain data only — no SDK imports — so the settings page can render the same
 * catalog the server registers. `tests/mcp-catalog.test.ts` connects a real MCP
 * client and fails if this list ever drifts from `registerTools`/`registerResources`/
 * `registerPrompts`.
 *
 * `{endpoint}` and `{token}` in snippets are filled in by `app/api/mcp/info/route.ts`,
 * because the desktop shell serves on a random loopback port.
 */

export type McpToolDoc = {
  name: string;
  title: string;
  description: string;
  whenToUse: string;
  /** Ready-to-paste 调用词 for an AI client. */
  example: string;
};

export type McpResourceDoc = {
  uri: string;
  title: string;
  description: string;
  example: string;
};

export type McpPromptArgDoc = { name: string; description: string; required: boolean };

export type McpPromptDoc = {
  name: string;
  title: string;
  description: string;
  args: McpPromptArgDoc[];
  example: string;
};

export type McpClientDoc = { label: string; note: string; snippet: string };

export const MCP_ENDPOINT_PATH = "/api/mcp";

export const MCP_TRANSPORT_NOTE =
  "无状态 Streamable HTTP：用 POST 发 JSON-RPC 请求，没有 SSE 长连接；GET 返回 405（这是规范行为，不是故障）。";

/** Kept in sync with the registered tool descriptions; shown in the settings page. */
export const MCP_WORKFLOW: string[] = [
  "list_resumes 找到目标文档（返回 id / 标题 / 更新时间 / 模板）。",
  "get_resume 读取完整数据（ResumeData）。",
  "用 patch_resume 做最小必要修改；只有新建或整份替换时才用 save_resume。",
  "render_resume_html 检查渲染结果与页数（工业标签模板一页内容有限，注意溢出）。",
  "publish_resume 发布为 /p/<id> 分享页。",
];

/** Sent to every MCP client as the server `instructions`. */
export const MCP_INSTRUCTIONS = `Resume Studio 是一个多模板简历编辑器。你在这里可以读写真实简历文档并产出可直接分发的 HTML。

可用模板（templateId）：industrial（工业标签单页）、industrial-duplex（工业标签双页）、minimal（极简单页）、moonlight（月光海报单页，暗底 + Kiwi 绿）、quiet（色卡规格表单页，纸白印刷风）。

推荐工作流：
${MCP_WORKFLOW.map((step, index) => `${index + 1}. ${step}`).join("\n")}

数据约定：
- 数字类指标在文案中用花括号包裹，例如 "日均 {1.2M} 单"，渲染时会变成高亮。
- 文档至少需要 header 与 experience 两个对象；其余字段缺省会用示例值补齐。
- id 只允许小写字母、数字和连字符。`;

export const MCP_TOOLS: McpToolDoc[] = [
  {
    name: "list_resumes",
    title: "列出简历",
    description: "列出服务器上所有简历文档（id、标题、更新时间、模板）。只读，返回 JSON。编辑前先用它找到目标文档 id。",
    whenToUse: "不知道有哪些文档、或要先找到目标 id 时，第一步就用它。",
    example: "列出我保存的所有简历，按更新时间排序",
  },
  {
    name: "get_resume",
    title: "读取简历",
    description: "读取一份简历的完整数据（ResumeData）和模板信息。返回 JSON；文档不存在时返回错误并提示先 list_resumes。",
    whenToUse: "任何修改之前先读全量数据，避免覆盖时丢掉没提到的字段。",
    example: "读取 lin-zhiyuan 这份简历，告诉我它用了哪个模板、总共几页",
  },
  {
    name: "save_resume",
    title: "保存简历",
    description: "新建或整份覆盖一份简历。data 必须是完整 ResumeData（至少 header 与 experience）。省略 id 时按标题自动生成新 id。写入前会归一化校验，返回 id 与更新时间。",
    whenToUse: "新建文档，或整份替换；只改一两个字段请用 patch_resume。",
    example: "用这份 JSON 新建一份简历，标题叫 林知远 · 全栈开发工程师",
  },
  {
    name: "patch_resume",
    title: "局部修改简历",
    description: "用 RFC 7386 JSON Merge Patch 局部修改已有简历：对象递归合并，null 删除字段，其余值直接替换。适合只改一两个字段。返回修改后的完整数据。",
    whenToUse: "只改一两个字段时的默认选择，改动最小、最不容易误伤。",
    example: "把 lin-zhiyuan 的工作经历第一条要点改成：日均 {1.2M} 单",
  },
  {
    name: "delete_resume",
    title: "删除简历",
    description: "删除一份简历文档。文档不存在时返回 deleted: false，不视为失败。",
    whenToUse: "清理草稿或废弃文档。",
    example: "删掉标题是「测试草稿」的那份简历",
  },
  {
    name: "render_resume_html",
    title: "渲染简历 HTML",
    description: "把简历渲染成自包含的多页 HTML（内联全部 CSS，不依赖本站 JS），可直接保存或分发。用 id 渲染已存文档，或用 data 渲染临时内容，二选一。返回 JSON，其中 html 字段是完整文件。",
    whenToUse: "要成品文件、或想确认页数有没有溢出时。",
    example: "把 lin-zhiyuan 渲染成自包含 HTML，并告诉我总页数有没有超过一页",
  },
  {
    name: "publish_resume",
    title: "发布简历",
    description: "渲染已存文档并写入 .data/published/<id>.html，返回可分享的 /p/<id> 路径（设置了 RESUME_PUBLIC_URL 时返回绝对地址）。",
    whenToUse: "需要一个可以直接发给别人的链接时。",
    example: "发布 lin-zhiyuan，把分享链接发我",
  },
];

export const MCP_RESOURCES: McpResourceDoc[] = [
  {
    uri: "resume://docs",
    title: "简历文档列表",
    description: "所有已保存简历的 id、标题、更新时间与模板。JSON。",
    example: "读一下 resume://docs，看看我现在有几份简历",
  },
  {
    uri: "resume://docs/{id}",
    title: "单份简历文档",
    description: "按 id 读取一份完整简历（数据 + 模板元数据）。JSON。",
    example: "读一下 resume://docs/lin-zhiyuan，把内容原样发我",
  },
  {
    uri: "resume://templates",
    title: "模板目录",
    description: "所有可用简历模板的 id、名称、页数、默认主色与标签。JSON。",
    example: "resume://templates 里有哪些模板？各自的默认主色和页数是多少？",
  },
];

export const MCP_PROMPTS: McpPromptDoc[] = [
  {
    name: "tailor_resume_to_job",
    title: "按招聘 JD 定制简历",
    description: "根据一段职位描述调整简历内容：先读现有文档，再用 patch_resume 做针对性修改，最后渲染或发布。",
    args: [
      { name: "jobDescription", description: "目标职位的 JD 原文（含职责与要求）", required: true },
      { name: "resumeId", description: "要修改的文档 id；省略时先列出现有文档供选择", required: false },
    ],
    example: "用 tailor_resume_to_job 按这份 JD 调整我的简历：<粘贴 JD 原文>",
  },
  {
    name: "polish_resume",
    title: "润色简历文案",
    description: "在不改变事实的前提下润色简历：动词开头、量化成果、去掉空话。先读文档，再用 patch_resume 增量修改。",
    args: [
      { name: "resumeId", description: "要润色的文档 id；省略时先列出现有文档", required: false },
      { name: "focus", description: "润色重点，例如「工作经历」「项目描述」「整体语气」", required: false },
    ],
    example: "用 polish_resume 润色 lin-zhiyuan 的工作经历，动词开头、结果量化",
  },
];

/** Ready-to-paste client configuration. `{endpoint}` / `{token}` are substituted by the route. */
export const MCP_CLIENTS: McpClientDoc[] = [
  {
    label: "Claude Code（命令行）",
    note: "在终端执行一次即可注册；下面的地址已自动填入当前端点。",
    snippet: "claude mcp add --transport http resume-studio {endpoint}",
  },
  {
    label: "通用 HTTP 客户端（.mcp.json / Cursor / Claude Desktop 等）",
    note: "本地免鉴权时用这一份。",
    snippet: `{
  "mcpServers": {
    "resume-studio": {
      "type": "http",
      "url": "{endpoint}"
    }
  }
}`,
  },
  {
    label: "带 Bearer Token（设置了 RESUME_MCP_TOKEN 时）",
    note: "服务端设了 RESUME_MCP_TOKEN 就必须带 Authorization 头。",
    snippet: `{
  "mcpServers": {
    "resume-studio": {
      "type": "http",
      "url": "{endpoint}",
      "headers": { "Authorization": "Bearer {token}" }
    }
  }
}`,
  },
  {
    label: "自带冒烟脚本",
    note: "不改任何客户端配置，直接用仓库脚本打一次端点。",
    snippet: "MCP_URL={endpoint} npm run mcp:smoke",
  },
];

/** Generic 调用词 shown as a starting point. */
export const MCP_EXAMPLES: string[] = [
  "列出我保存的简历，并告诉我每份用的模板",
  "读一下我的简历，找出它和这份 JD 之间的 3 个差距",
  "把项目经历里第三条要点改得更量化，保留 {指标} 写法",
  "把这份简历渲染成 HTML 发我，并说明有没有溢出到第二页",
  "发布这份简历，把分享链接发我",
];

/** Every tool must ship a 调用词, and every prompt/resource too — the UI promises it. */
export function mcpCatalogSummary() {
  return {
    tools: MCP_TOOLS.length,
    resources: MCP_RESOURCES.length,
    prompts: MCP_PROMPTS.length,
  };
}
