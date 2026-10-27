/**
 * Desktop-shell integration surface. Every call degrades to a no-op in the
 * plain browser — the same bundle runs in web, so callers never branch here.
 * Tauri modules are imported dynamically so the SSR/server graph never
 * touches them (see docs/superpowers/specs/2026-10-27-desktop-capabilities-design.md).
 */

/** Detects the Tauri webview (IPC capability grants `notification:default`). */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * System notifications are only for moments the user is not looking at the
 * app: desktop shell + notification-worthy operation + window unfocused.
 */
export function shouldUseSystemNotification(opts: {
  desktop: boolean;
  windowFocused: boolean;
  important: boolean;
}): boolean {
  return opts.desktop && opts.important && !opts.windowFocused;
}

type NotificationModule = typeof import("@tauri-apps/plugin-notification");

/**
 * Permission answers are cached module-wide: after one explicit denial we
 * never prompt again (falls back to toasts for the rest of the session).
 */
let permissionState: "unknown" | "granted" | "denied" = "unknown";

async function loadNotificationModule(): Promise<NotificationModule | null> {
  if (!isDesktop()) return null;
  try {
    return await import("@tauri-apps/plugin-notification");
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget OS notification. Resolves false when it could not be shown
 * (browser, IPC unavailable, permission denied) — callers already showed an
 * in-app toast, so failure just means "nothing extra happened".
 */
export async function sendSystemNotification(title: string, body: string): Promise<boolean> {
  const mod = await loadNotificationModule();
  if (!mod) return false;
  try {
    let granted =
      permissionState === "granted"
        ? true
        : permissionState === "denied"
          ? false
          : await mod.isPermissionGranted();
    if (!granted && permissionState !== "denied") {
      granted = (await mod.requestPermission()) === "granted";
    }
    permissionState = granted ? "granted" : "denied";
    if (!granted) return false;
    mod.sendNotification({ title, body });
    return true;
  } catch {
    return false;
  }
}
