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
  "check_resume 确认页数与数据问题；需要成品文件时用 render_resume_html，或直接产出 PDF / PNG（render_resume_pdf / render_resume_png，自动入存档库）。",
  "publish_resume 发布为 /p/<id> 分享页。",
];

/** Sent to every MCP client as the server `instructions`. */
export const MCP_INSTRUCTIONS = `Resume Studio 是一个多模板简历编辑器。你在这里可以读写真实简历文档并产出可直接分发的 HTML。

可用模板（templateId）：industrial（工业标签单页）、industrial-duplex（工业标签双页）、industrial-day（工业标签日光单页，亮色）、industrial-day-duplex（工业标签日光双页，亮色）、minimal（极简单页）、moonlight（月光海报单页，暗底 + Kiwi 绿）、moonlight-day（月光海报日光版，米白纸面 + 苔绿）、quiet（色卡规格表单页，纸白印刷风）。

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
    description:
      "列出服务器上的简历文档（id、标题、更新时间、模板），支持按模板过滤、按标题搜索与排序。只读，返回 JSON。编辑前先用它找到目标文档 id。",
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
    name: "check_resume",
    title: "预检简历",
    description:
      "把简历渲染成多页 HTML 但只返回元数据（模板、页数、字节、数据问题清单），不返回 html 正文。用 id 检查已存文档，或用 data 检查临时内容，二选一。适合发布或导出前确认页数与数据完整度。",
    whenToUse: "只想确认页数、溢出或数据问题时，避免把整份 HTML 拉进对话。",
    example: "检查 lin-zhiyuan 的页数和数据问题清单，不要把 HTML 发我",
  },
  {
    name: "duplicate_resume",
    title: "复制简历",
    description:
      "复制一份简历为新文档：保留全部内容并写入新 id，返回新文档信息。目标 id 已存在时报错，不会覆盖；缺省标题为「原标题 · 副本」。",
    whenToUse: "要为不同岗位做内容变体、又不想动原文档时。",
    example: "把 lin-zhiyuan 复制一份，标题改成 lin-zhiyuan · 后端方向",
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
    name: "render_resume_pdf",
    title: "渲染简历 PDF",
    description:
      "用服务端无头浏览器把简历渲染成 A4 PDF 并存入存档库（.data/archive/），返回 archiveId、下载路径 /api/archive/<id>、页数与文件名。用 id 渲染已存文档，或用 data 渲染临时内容，二选一。需要服务器装有 Edge / Chrome / Chromium（可用 EDGE_BIN 指定）。",
    whenToUse: "要直接可投递的 PDF 文件、或要验证打印分页时。",
    example: "把 lin-zhiyuan 渲染成 PDF，存入存档库并给我下载路径",
  },
  {
    name: "render_resume_png",
    title: "渲染简历 PNG 长图",
    description:
      "用服务端无头浏览器把简历渲染成 2 倍分辨率的整页 PNG 长图（全部页面纵向拼接）并存入存档库，返回 archiveId 与下载路径 /api/archive/<id>。用 id 渲染已存文档，或用 data 渲染临时内容，二选一。需要服务器装有 Edge / Chrome / Chromium（可用 EDGE_BIN 指定）。",
    whenToUse: "要发社交 / 内嵌文档的整页图片时。",
    example: "把 lin-zhiyuan 渲染成 PNG 长图，告诉我文件大小",
  },
  {
    name: "list_archives",
    title: "列出存档",
    description:
      "列出存档库中全部导出产物（JSON / HTML / PDF / PNG）：id、文件名、格式、字节数与创建时间，按时间倒序。产物下载路径为 /api/archive/<id>。",
    whenToUse: "想找回之前的导出产物、或盘点存档时。",
    example: "列出现在存档库里都有哪些导出文件",
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
  "先检查这份简历有没有缺段落、会不会超页，然后再发布",
  "把这份简历渲染成 HTML 发我，并说明有没有溢出到第二页",
  "把这份简历渲染成 PDF 和 PNG 长图存入存档库，给我下载路径",
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
