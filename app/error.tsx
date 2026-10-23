"use client";

import { useEffect, useState } from "react";

/**
 * App Router error boundary.
 *
 * Without one, any throw during render unmounts the whole editor: the user gets
 * a blank page, no explanation, and loses whatever was not saved yet (that is
 * exactly how a wrong-typed document field used to "crash the page").
 * `migrateDocument` now stops malformed documents at the boundary, and this is
 * the safety net for everything else.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("Resume Studio render failed:", error);
  }, [error]);

  const copy = async () => {
    const text = `${error.name}: ${error.message}${error.digest ? ` (digest ${error.digest})` : ""}\n${error.stack ?? ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        background: "#f2f2f0",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        color: "#111",
      }}
    >
      <div style={{ maxWidth: 620, width: "100%", background: "#fff", border: "1px solid rgba(0,0,0,.28)", borderRadius: 4, padding: "28px 30px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", color: "#666", marginBottom: 10 }}>
          RESUME STUDIO · RENDER ERROR
        </div>
        <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>编辑器渲染失败</h1>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", color: "#333" }}>
          页面没有崩溃成白屏：你的内容仍在浏览器本地存储里（<code>resume-studio:doc</code>）。 可以点「重试」重新渲染；
          若反复失败，请复制下面的错误信息，并在刷新前先用工具栏的「JSON」导出一份备份。
        </p>
        <pre
          style={{
            margin: "0 0 18px",
            padding: "12px 14px",
            background: "#f7f7f5",
            border: "1px solid rgba(0,0,0,.12)",
            borderRadius: 3,
            fontSize: 12,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 220,
            overflow: "auto",
          }}
        >
          {error.name}: {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "9px 16px", border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 3, fontSize: 13, cursor: "pointer" }}
          >
            重试
          </button>
          <button
            type="button"
            onClick={copy}
            style={{ padding: "9px 16px", border: "1px solid rgba(0,0,0,.3)", background: "#fff", color: "#111", borderRadius: 3, fontSize: 13, cursor: "pointer" }}
          >
            {copied ? "已复制" : "复制错误信息"}
          </button>
        </div>
      </div>
    </main>
  );
}
