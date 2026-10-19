import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MCP_SERVER_INFO } from "./config";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";
import { registerTools } from "./tools";

const INSTRUCTIONS = `Resume Studio 是一个多模板简历编辑器。你在这里可以读写真实简历文档并产出可直接分发的 HTML。

可用模板（templateId）：industrial（工业标签单页）、industrial-duplex（工业标签双页）、minimal（极简单页）。

推荐工作流：
1. list_resumes 找到目标文档（返回 id / 标题 / 更新时间 / 模板）。
2. get_resume 读取完整数据（ResumeData）。
3. 用 patch_resume 做最小必要修改；只有新建或整份替换时才用 save_resume。
4. render_resume_html 检查渲染结果与页数（工业标签模板一页内容有限，注意溢出）。
5. publish_resume 发布为 /p/<id> 分享页。

数据约定：
- 数字类指标在文案中用花括号包裹，例如 "日均 {1.2M} 单"，渲染时会变成高亮。
- 文档至少需要 header 与 experience 两个对象；其余字段缺省会用示例值补齐。
- id 只允许小写字母、数字和连字符。`;

/** Build a fully registered MCP server. Transport wiring lives in handler.ts. */
export function createMcpServer(): McpServer {
  const server = new McpServer(MCP_SERVER_INFO, { instructions: INSTRUCTIONS });
  registerTools(server);
  registerResources(server);
  registerPrompts(server);
  return server;
}
