import { useEffect } from "react";
import { delayRender, continueRender } from "remotion";
import type { MapRef } from "@nolli/map";
import type { MapViewport } from "./viewport";

/**
 * Sets the map camera to `viewport` ONCE when the map is ready and gates the
 * first frame on tile load. The camera is then stable for the whole reel —
 * markers are maplibre-projected, so only `selectedSlug` (handled by ArchMap)
 * changes per frame. (Per-frame flying was removed: the figure-ground map is
 * illegible at building zoom, so a stable footprint fit reads far better.)
 */
export function useMapFit(map: MapRef | null, viewport: MapViewport): void {
  useEffect(() => {
    if (!map) return;
    const handle = delayRender("archmap-fit");
    let done = false;
    const release = () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
    const onIdle = () => {
      if (map.loaded()) release();
    };
    map.jumpTo({ center: viewport.center, zoom: viewport.zoom });
    if (map.loaded()) release();
    else map.once("idle", onIdle);
    return () => {
      map.off("idle", onIdle);
      release();
    };
  }, [map, viewport.center[0], viewport.center[1], viewport.zoom]);
}
