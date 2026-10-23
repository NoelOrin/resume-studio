import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WHEEL_LINE_HEIGHT,
  ZOOM_MAX,
  ZOOM_MIN,
  anchorScroll,
  clampZoom,
  normalizeWheelDelta,
  snapZoom,
  stepZoom,
  wheelZoom,
  zoomAnchor,
} from "../src/lib/zoom";

test("clampZoom keeps values inside 25%–400% and rejects NaN", () => {
  assert.equal(clampZoom(0.1), ZOOM_MIN);
  assert.equal(clampZoom(9), ZOOM_MAX);
  assert.equal(clampZoom(1.5), 1.5);
  assert.equal(clampZoom(Number.NaN), 1);
});

test("clampZoom keeps the direction of an exp() overflow", () => {
  assert.equal(clampZoom(Number.POSITIVE_INFINITY), ZOOM_MAX);
  assert.equal(clampZoom(Number.NEGATIVE_INFINITY), ZOOM_MIN);
  assert.equal(wheelZoom(2, -1e6), ZOOM_MAX);
  assert.equal(wheelZoom(2, 1e6), ZOOM_MIN);
});

test("snapZoom rounds to whole percent", () => {
  assert.equal(snapZoom(1.234), 1.23);
  assert.equal(snapZoom(0.2504), 0.25);
});

test("stepZoom adds deltas and clamps at the edges", () => {
  assert.equal(stepZoom(1, 0.1), 1.1);
  assert.equal(stepZoom(3.95, 0.1), 4);
  assert.equal(stepZoom(0.3, -0.1), 0.25);
});

test("wheelZoom is exponential, zoom in on negative deltaY, clamped", () => {
  assert.ok(wheelZoom(1, -100) > 1);
  assert.ok(wheelZoom(1, 100) < 1);
  assert.equal(wheelZoom(3.99, -10_000), 4);
  assert.equal(wheelZoom(0.3, 10_000), 0.25);
});

test("normalizeWheelDelta converts line and page modes to pixels", () => {
  assert.equal(normalizeWheelDelta(120, 0, 800), 120);
  assert.equal(normalizeWheelDelta(3, 1, 800), 3 * WHEEL_LINE_HEIGHT);
  assert.equal(normalizeWheelDelta(1, 2, 800), 800);
});

test("a single Firefox mouse notch still changes the scale", () => {
  // deltaMode 1 (lines) is what Firefox sends for a mouse wheel.
  const notch = normalizeWheelDelta(-3, 1, 800);
  assert.equal(notch, -48);
  assert.equal(wheelZoom(1, notch), 1.07);
  // Characterization of the bug this normalization fixes: the raw line delta is
  // ~0.45%, which snapZoom rounds straight back to 1.00 (a silent no-op).
  assert.equal(wheelZoom(1, -3), 1);
});

test("zoomAnchor stores the pointer position in unscaled sheet space", () => {
  const anchor = zoomAnchor(300, 200, { left: 100, top: 50 }, 2);
  assert.deepEqual(anchor, { screenX: 300, screenY: 200, sheetX: 100, sheetY: 75 });
});

test("anchorScroll keeps the anchored sheet point under the pointer", () => {
  const anchor = { screenX: 640, screenY: 360, sheetX: 200, sheetY: 500 };
  const rect = { left: 120, top: 40 };
  const scroll = { left: 30, top: 10 };
  const next = anchorScroll(anchor, rect, 2, scroll);
  // Scrolling by delta moves the canvas rect by -delta in the viewport.
  const deltaX = next.left - scroll.left;
  const deltaY = next.top - scroll.top;
  assert.equal(rect.left - deltaX + anchor.sheetX * 2, anchor.screenX);
  assert.equal(rect.top - deltaY + anchor.sheetY * 2, anchor.screenY);
});
