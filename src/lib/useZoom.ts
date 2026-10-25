"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { snapZoom, stepZoom as stepValue, type ZoomMode } from "./zoom";
import { fetchPrefs, savePrefs, type ZoomPref } from "./backend";

type Stored = ZoomPref;

type StoredJson = { mode?: ZoomMode; value?: number };

function parseStored(raw: string): Stored | null {
  try {
    const parsed = JSON.parse(raw) as StoredJson;
    if (parsed.mode === "manual" && typeof parsed.value === "number") {
      return { mode: "manual", value: snapZoom(parsed.value) };
    }
    if (parsed.mode === "fit") return { mode: "fit" };
    return null;
  } catch {
    return null;
  }
}

/**
 * Canvas zoom state: either follow the viewport ("fit") or a manual 25%–400%
 * ratio. The preference is local UI state only — never written into the resume;
 * it lives in the embedded database (`ui:zoom` kv) via /api/prefs.
 */
export function useZoom(fit: number) {
  const [mode, setMode] = useState<ZoomMode>("fit");
  const [value, setValue] = useState(1);
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<Stored | null>(null);

  // Restore after mount so the SSR markup and first client render agree.
  useEffect(() => {
    let alive = true;
    void fetchPrefs()
      .then((prefs) => {
        if (!alive || !prefs.zoom) return;
        setMode(prefs.zoom.mode);
        if (prefs.zoom.mode === "manual") setValue(prefs.zoom.value);
      })
      .catch(() => {
        /* server unreachable: stay on defaults */
      });
    return () => {
      alive = false;
    };
  }, []);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const next = pending.current;
    pending.current = null;
    if (!next) return;
    void savePrefs({ zoom: next }).catch(() => {
      /* offline: keep in-memory only */
    });
  }, []);

  const persist = useCallback(
    (next: Stored) => {
      pending.current = next;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 150);
    },
    [flush],
  );

  // Flush on unmount: a zoom in the last 150ms would otherwise be dropped.
  useEffect(() => flush, [flush]);

  const scale = mode === "fit" ? fit : value;

  const setManual = useCallback(
    (next: number) => {
      const snapped = snapZoom(next);
      setMode("manual");
      setValue(snapped);
      persist({ mode: "manual", value: snapped });
    },
    [persist],
  );

  const setFit = useCallback(() => {
    setMode("fit");
    persist({ mode: "fit" });
  }, [persist]);

  const zoomBy = useCallback(
    (delta: number) => {
      setManual(stepValue(scale, delta));
    },
    [scale, setManual],
  );

  return { mode, scale, setManual, setFit, zoomBy };
}
