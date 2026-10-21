export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.1;

export type ZoomMode = "fit" | "manual";

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

/** Clamp + round to a whole percent so the readout and slider stay in sync. */
export function snapZoom(value: number): number {
  return Math.round(clampZoom(value) * 100) / 100;
}

export function stepZoom(value: number, delta: number): number {
  return snapZoom(value + delta);
}

/** Exponential wheel mapping: trackpads send many small deltas, mice a few large ones. */
export function wheelZoom(value: number, deltaY: number): number {
  return snapZoom(value * Math.exp(-deltaY * 0.0015));
}

