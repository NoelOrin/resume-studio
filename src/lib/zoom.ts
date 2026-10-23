export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.1;

export type ZoomMode = "fit" | "manual";

export function clampZoom(value: number): number {
  // Keep the direction of an overflow: exp() can blow past ZOOM_MAX and a
  // fallback to 100% would look like a random zoom-out.
  if (value === Number.POSITIVE_INFINITY) return ZOOM_MAX;
  if (value === Number.NEGATIVE_INFINITY) return ZOOM_MIN;
  if (Number.isNaN(value)) return 1;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

/** Clamp + round to a whole percent so the readout and slider stay in sync. */
export function snapZoom(value: number): number {
  return Math.round(clampZoom(value) * 100) / 100;
}

export function stepZoom(value: number, delta: number): number {
  return snapZoom(value + delta);
}

/** Approximate px per wheel line; Firefox reports mouse wheels in lines. */
export const WHEEL_LINE_HEIGHT = 16;

/**
 * Normalize a wheel delta to pixels. Firefox mice send DOM_DELTA_LINE (3 lines
 * per notch = 0.45% zoom, which snapZoom rounds away), page mode is only sent
 * by legacy engines. Without this, ctrl+wheel does nothing on Firefox.
 */
export function normalizeWheelDelta(deltaY: number, deltaMode: number, pageHeight: number): number {
  if (deltaMode === 1) return deltaY * WHEEL_LINE_HEIGHT;
  if (deltaMode === 2) return deltaY * pageHeight;
  return deltaY;
}

/** Exponential wheel mapping: trackpads send many small deltas, mice a few large ones. */
export function wheelZoom(value: number, deltaY: number): number {
  return snapZoom(value * Math.exp(-deltaY * 0.0015));
}

export type ZoomAnchor = {
  /** Pointer position in viewport coordinates. */
  screenX: number;
  screenY: number;
  /** Same point in unscaled sheet coordinates. */
  sheetX: number;
  sheetY: number;
};

type Rect = { left: number; top: number };
type Scroll = { left: number; top: number };

/** Remember where the pointer sits on the unscaled sheet before a zoom. */
export function zoomAnchor(clientX: number, clientY: number, rect: Rect, scale: number): ZoomAnchor {
  return {
    screenX: clientX,
    screenY: clientY,
    sheetX: (clientX - rect.left) / scale,
    sheetY: (clientY - rect.top) / scale,
  };
}

/**
 * Scroll offset that puts the anchored sheet point back under the pointer.
 * `rect` must be the canvas rect measured *after* the new scale was applied,
 * while `scroll` is the offset from before the scroll adjustment.
 */
export function anchorScroll(anchor: ZoomAnchor, rect: Rect, scale: number, scroll: Scroll): Scroll {
  return {
    left: scroll.left + rect.left + anchor.sheetX * scale - anchor.screenX,
    top: scroll.top + rect.top + anchor.sheetY * scale - anchor.screenY,
  };
}
