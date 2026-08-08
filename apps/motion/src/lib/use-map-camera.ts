import { useEffect } from "react";
import { delayRender, continueRender } from "remotion";
import type { MapRef } from "@nolli/map";
import type { MapViewport } from "./viewport";

/**
 * Drives the map camera to `viewport` every frame (Remotion renders frames in a
 * discrete clock, so we set the exact viewport for each frame rather than start
 * a maplibre animation).
 *
 * Each frame must gate capture on maplibre actually loading AND painting every
 * visible tile. We wait for `idle`, then require `areTilesLoaded()` (stricter
 * than `loaded()`), then yield one animation frame so the WebGL canvas is
 * composited before Remotion screenshots — otherwise moving frames capture a
 * tile-shaped hole. (`map.stop()` is deliberately NOT called: it halts the
 * render loop and starves subsequent frames' tile loads.)
 */
export function useMapCamera(map: MapRef | null, viewport: MapViewport): void {
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
    const onIdle = () => {
      if (cancelled) return;
      if (map.areTilesLoaded()) {
        // Tiles report loaded, but decode + WebGL paint + page composite lag by
        // a few frames. Settle across several rAFs so the captured frame can't
        // catch a tile mid-paint (which shows as a cream tile-shaped hole).
        let n = 4;
        const tick = () => {
          if (cancelled) return;
          if (--n <= 0) release();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } else {
        map.once("idle", onIdle);
      }
    };

    map.jumpTo({ center: [cx, cy], zoom });
    map.once("idle", onIdle);
    // Safety net so a frame can never hang Remotion.
    const fallback = setTimeout(release, 6000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      map.off("idle", onIdle);
      release();
    };
  }, [map, cx, cy, zoom]);
}
