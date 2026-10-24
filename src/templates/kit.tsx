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
  return text.split(/(\{[^{}]+\})/).map((part, i) =>
    part.startsWith("{") && part.endsWith("}") ? <b key={i}>{part.slice(1, -1)}</b> : <span key={i}>{part}</span>,
  );
}

/** "PROFILE / 个人简介" → ["PROFILE", "个人简介"] (kicker EN/ZH split on first slash). */
export function splitKicker(kicker: string): [string, string] {
  const [en, ...rest] = kicker.split("/");
  return [en.trim(), rest.join("/").trim()];
}
