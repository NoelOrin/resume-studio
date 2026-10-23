"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

/**
 * Keeps one failing template render from taking down the whole editor.
 *
 * A template render is a pure function of the document, so a single unexpected
 * value used to throw during render and — with no boundary in the tree — unmount
 * every component at once: blank page, no explanation, unsaved work gone. This
 * boundary is intentionally narrow: it wraps only the rendered template, so the
 * sidebar, toolbar, autosave and JSON export keep working and the user can fix
 * the offending field (or switch template) and recover.
 *
 * `resetKey` is a cheap primitive; when it changes the boundary retries once, so
 * the preview comes back on its own after the document is repaired.
 */
export class TemplateBoundary extends Component<
  { children: ReactNode; label?: string; resetKey?: string | number; compact?: boolean },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`TemplateBoundary(${this.props.label ?? "template"}) render failed:`, error, info.componentStack);
  }

  componentDidUpdate(previous: { resetKey?: string | number }) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const compact = this.props.compact ?? false;
    return (
      <div
        role="alert"
        style={{
          boxSizing: "border-box",
          width: "100%",
          height: compact ? "100%" : "auto",
          minHeight: compact ? 0 : 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: compact ? 8 : 24,
          border: "1px dashed rgba(191,59,43,.65)",
          borderRadius: 3,
          background: "#fff7f5",
          color: "#7a2418",
          textAlign: "center",
        }}
      >
        <b style={{ fontSize: compact ? 10 : 13, letterSpacing: ".06em" }}>
          {compact ? "渲染失败" : "此模板渲染失败 / TEMPLATE RENDER FAILED"}
        </b>
        {!compact && (
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, maxWidth: 420, color: "#5c4038" }}>
            编辑区仍然可用，自动保存与 JSON 导出不受影响。请检查出错字段，或切换到其他模板。
          </p>
        )}
        <code
          style={{
            display: "block",
            maxWidth: "100%",
            padding: compact ? "4px 6px" : "8px 10px",
            background: "#fff",
            border: "1px solid rgba(191,59,43,.3)",
            borderRadius: 3,
            fontSize: compact ? 8 : 11,
            lineHeight: 1.6,
            wordBreak: "break-word",
            maxHeight: compact ? 60 : 140,
            overflow: "auto",
          }}
        >
          {error.message || error.name}
        </code>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          style={{
            padding: compact ? "3px 8px" : "7px 14px",
            border: "1px solid rgba(191,59,43,.55)",
            background: "#fff",
            color: "#7a2418",
            borderRadius: 3,
            fontSize: compact ? 9 : 12,
            cursor: "pointer",
          }}
        >
          重试
        </button>
      </div>
    );
  }
}
