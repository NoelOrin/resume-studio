"use client";

import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type ZoomMode } from "../lib/zoom";

/**
 * Continuous zoom control: fit · − · slider · + · percentage.
 * The percentage doubles as a "fit" button, matching the double-click gesture.
 */
export function ZoomControl({
  mode,
  scale,
  onFit,
  onStep,
  onSlide,
}: {
  mode: ZoomMode;
  scale: number;
  onFit: () => void;
  onStep: (delta: number) => void;
  onSlide: (next: number) => void;
}) {
  const percent = Math.round(scale * 100);
  const stepPercent = Math.round(ZOOM_STEP * 100);
  const minPercent = Math.round(ZOOM_MIN * 100);
  const maxPercent = Math.round(ZOOM_MAX * 100);
  return (
    <div className="ed-group ed-zoomgroup" role="group" aria-label="缩放">
      <button
        type="button"
        className={`ed-zoombtn${mode === "fit" ? " is-active" : ""}`}
        onClick={onFit}
        title="适应窗口"
      >
        适应
      </button>
      <div className="ed-zoomctl">
        <button
          type="button"
          className="ed-zoomstep"
          onClick={() => onStep(-ZOOM_STEP)}
          aria-label="缩小"
          title={`缩小 ${stepPercent}%`}
        >
          −
        </button>
        <input
          className="ed-zoomslider"
          type="range"
          min={Math.round(ZOOM_MIN * 100)}
          max={Math.round(ZOOM_MAX * 100)}
          step={1}
          value={percent}
          onChange={(event) => onSlide(Number(event.target.value) / 100)}
          aria-label="缩放比例"
          title={`缩放比例 ${percent}%（${minPercent}–${maxPercent}%）`}
        />
        <button
          type="button"
          className="ed-zoomstep"
          onClick={() => onStep(ZOOM_STEP)}
          aria-label="放大"
          title={`放大 ${stepPercent}%`}
        >
          +
        </button>
        <button
          type="button"
          className={`ed-zoompct${mode === "fit" ? " is-fit" : ""}`}
          onClick={onFit}
          title="点击回到适应窗口"
        >
          {percent}%
        </button>
      </div>
    </div>
  );
}
