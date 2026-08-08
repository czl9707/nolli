import { useEffect, useRef } from "react";
import { delayRender, continueRender } from "remotion";
import type { MapRef } from "@nolli/map";
import type { MapViewport } from "./viewport";

/**
 * Drives the map camera to `viewport` every frame (Remotion renders frames in a
 * discrete clock, so we set the exact viewport for each frame rather than start
 * a maplibre animation).
 *
 * Capture gate, tuned per frame:
 *  - STATIC frames (viewport unchanged from the last): wait for tiles to fully
 *    load (`areTilesLoaded()`) so a held building never shows a hole.
 *  - MOVING frames (mid-flight): release as soon as the map renders once. At
 *    low zoom a long hop may never reach areTilesLoaded() (global tiles keep
 *    streaming); waiting for them would cost seconds per frame. A transient
 *    tile hole mid-flight is imperceptible.
 * (`map.stop()` is deliberately NOT called: it halts the render loop and
 * starves subsequent frames' tile loads.)
 */
export function useMapCamera(map: MapRef | null, viewport: MapViewport): void {
  const cx = viewport.center[0];
  const cy = viewport.center[1];
  const zoom = viewport.zoom;
  const prev = useRef({ cx, cy, zoom });

  useEffect(() => {
    if (!map) return;
    const moving =
      prev.current.cx !== cx || prev.current.cy !== cy || prev.current.zoom !== zoom;
    prev.current = { cx, cy, zoom };

    const handle = delayRender("archmap-frame");
    let released = false;
    let cancelled = false;
    const release = () => {
      if (!released) {
        released = true;
        continueRender(handle);
      }
    };
    // Yield a few rAFs after the gate passes so WebGL paint + page composite
    // land before Remotion screenshots (otherwise a tile mid-paint shows as a
    // cream tile-shaped hole).
    let n = 4;
    const settle = () => {
      if (cancelled) return;
      if (--n <= 0) release();
      else requestAnimationFrame(settle);
    };
    const onIdle = () => {
      if (cancelled) return;
      if (moving || map.areTilesLoaded()) requestAnimationFrame(settle);
      else map.once("idle", onIdle);
    };

    map.jumpTo({ center: [cx, cy], zoom });
    map.once("idle", onIdle);
    // Safety net: moving frames release fast (a hole is fine), static frames
    // get a generous cap so a frame can never hang Remotion.
    const fallback = setTimeout(release, moving ? 1500 : 6000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      map.off("idle", onIdle);
      release();
    };
  }, [map, cx, cy, zoom]);
}
