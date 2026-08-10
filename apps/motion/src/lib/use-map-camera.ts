import { useEffect } from "react";
import { delayRender, continueRender } from "remotion";
import type { MapRef } from "@nolli/map";
import type { MapViewport } from "./viewport";

/**
 * Drives the map camera to `viewport` every frame (Remotion renders frames in a
 * discrete clock, so we set the exact viewport for each frame rather than start
 * a maplibre animation).
 *
 * `moving` is timeline-derived (mid-flight vs settled), NOT inferred from the
 * previous frame. This matters at the fly→hold boundary: the first held frame
 * differs from the last fly frame, yet is already settled — treating it as
 * `moving` would skip the tile-wait and capture the z15 detail tiles mid-load,
 * which shows up as a several-frame scale flicker as they sharpen in. So on a
 * settled frame we gate the release on `areTilesLoaded()`.
 *
 * Capture gate, tuned per frame:
 *  - SETTLED frames (`moving` false): wait for tiles to fully load
 *    (`areTilesLoaded()`) so a held building never shows a sharpen-in flicker.
 *  - MOVING frames (mid-flight): release as soon as the map renders once. At
 *    low zoom a long hop may never reach areTilesLoaded() (global tiles keep
 *    streaming); waiting for them would cost seconds per frame. A transient
 *    tile hole mid-flight is imperceptible.
 * Because held frames share an identical viewport, the effect deps skip
 * re-runs across the hold — only the first settled frame pays the tile-wait,
 * and the rest screenshot the now-fully-loaded map.
 * (`map.stop()` is deliberately NOT called: it halts the render loop and
 * starves subsequent frames' tile loads.)
 */
export function useMapCamera(map: MapRef | null, viewport: MapViewport, moving: boolean): void {
  const cx = viewport.center[0];
  const cy = viewport.center[1];
  const zoom = viewport.zoom;

  useEffect(() => {
    if (!map) return;

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
    // Force a render even when the transform delta is sub-threshold (the
    // asymptotic tail of a fly-in barely moves the camera). Without this,
    // maplibre stays "idle" on the previous frame's render and the `idle`
    // gate below resolves on a stale canvas — the held frame then differs
    // from the next (which captures the belatedly-redrawn one), a 1-frame
    // scale/label pop. triggerRepaint guarantees the gate waits on THIS
    // frame's draw.
    map.triggerRepaint();
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
  }, [map, cx, cy, zoom, moving]);
}
