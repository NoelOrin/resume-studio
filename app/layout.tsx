import type { Metadata } from "next";
import "../src/styles/editor.css";

export const metadata: Metadata = {
  title: "RESUME STUDIO · 全栈可视化简历编辑器",
  description: "vinext 全栈 · 多模板 / 多页简历编辑器：工业标签、双页档案、极简排版。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {/* 桌面壳的 WKWebView 右键只会弹 Reload 等系统菜单，全站禁掉；
            输入类元素除外，保留系统复制/粘贴。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener("contextmenu",function(e){
  var t=e.target;
  var editable=t&&t.closest&&t.closest("input,textarea,select,[contenteditable],[contenteditable] *");
  if(!editable)e.preventDefault();
},true);`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
