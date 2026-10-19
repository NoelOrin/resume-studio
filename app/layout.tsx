import type { Metadata } from "next";
import "../src/styles/editor.css";

export const metadata: Metadata = {
  title: "RESUME STUDIO · 全栈可视化简历编辑器",
  description: "vinext 全栈 · 多模板 / 多页简历编辑器：工业标签、双页档案、极简排版。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
