import type { ReactNode } from "react";

/**
 * Shared template kit — small helpers every template tends to need.
 * Keep it free of styling: templates own their look; this is behaviour only.
 */

/**
 * Rich text convention shared by every template: `{1.2M}` / `{60%}` braced
 * tokens become <b> (templates style `b` as their mono/accent emphasis).
 */
export function rich(text: string): ReactNode[] {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  const nodes: ReactNode[] = [];
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) nodes.push(<br key={`br-${lineIndex}`} />);
    line.split(/(\{[^{}]+\})/).forEach((part, i) => {
      const key = `${lineIndex}-${i}`;
      nodes.push(
        part.startsWith("{") && part.endsWith("}") ? <b key={key}>{part.slice(1, -1)}</b> : <span key={key}>{part}</span>,
      );
    });
  });
  return nodes;
}

/** "PROFILE / 个人简介" → ["PROFILE", "个人简介"] (kicker EN/ZH split on first slash). */
export function splitKicker(kicker: string): [string, string] {
  const [en, ...rest] = kicker.split("/");
  return [en.trim(), rest.join("/").trim()];
}
