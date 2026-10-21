import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ZOOM_MAX,
  ZOOM_MIN,
  clampZoom,
  snapZoom,
  stepZoom,
  wheelZoom,
} from "../src/lib/zoom";

test("clampZoom keeps values inside 25%–400% and rejects NaN", () => {
  assert.equal(clampZoom(0.1), ZOOM_MIN);
  assert.equal(clampZoom(9), ZOOM_MAX);
  assert.equal(clampZoom(1.5), 1.5);
  assert.equal(clampZoom(Number.NaN), 1);
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

