import { useEffect } from "react";
import { continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { useMapContext, useSelectedSlug } from "./MapProvider";
import { FLIGHT_EASE, flightPath } from "../lib/viewport";
import { CLAMP } from "../lib/timeline";
import type { MapRef } from "@nolli/map";
import type { MapViewport } from "../lib/viewport";

/** Capture primitive: drives the shared map to `viewport` and gates the frame's
 *  screenshot release on tile-readiness. Moving frames release after one render
 *  (a long low-zoom hop may never reach areTilesLoaded); settled frames wait
 *  for all tiles so a hold never shows a sharpen-in flicker. `map.stop()` is
 *  deliberately not called — it halts the render loop and starves later
 *  frames' tile loads. */
/** areTilesLoaded() counts errored tiles as loaded, and TileManager.reload()
 *  skips them — the map then renders label-less parent-tile fallback. Re-kick
 *  via the tile managers' in-view stores; private API, guarded so a MapLibre
 *  upgrade degrades to "no errored tiles found". */
function retryErroredTiles(m: MapRef): number {
  const tms = (m as any).style?.tileManagers;
  if (!tms) return 0;
  let retried = 0;
  for (const tm of Object.values<any>(tms)) {
    const tiles: any[] = tm?._inViewTiles?.getAllTiles?.() ?? [];
    for (const t of tiles) {
      if (t.state === "errored") {
        tm._reloadTile?.(t.tileID.key, "reloading");
        retried++;
      }
    }
  }
  return retried;
}

function useMapFrame(map: MapRef | null, viewport: MapViewport, moving: boolean, absFrame: number): void {
  const cx = viewport.center[0];
  const cy = viewport.center[1];
  const zoom = viewport.zoom;

  useEffect(() => {
    if (!map) return;
    const m = map; // non-null alias — TS doesn't carry param narrowing into closures

    const handle = delayRender("archmap-frame");
    let released = false;
    let cancelled = false;
    let retries = 0;
    const release = () => {
      if (!released) {
        released = true;
        continueRender(handle);
      }
    };
    // A few rAFs past the gate so WebGL paint + composite land before the
    // screenshot, else a tile mid-paint shows as a cream tile-shaped hole.
    let n = 4;
    const settle = () => {
      if (cancelled) return;
      if (--n <= 0) release();
      else requestAnimationFrame(settle);
    };
    // Symbol placement is throttled and `idle` can fire while it is still
    // stale from flight state — that frame would show the previous zoom's labels.
    const placementSettled = () => {
      const placement = (m as any).style?.placement;
      return !placement || placement.stale !== true;
    };
    const onIdle = () => {
      if (cancelled) return;
      if (moving || (m.areTilesLoaded() && placementSettled())) {
        // Bounded so a hard-failing tile can't hang the frame.
        if (!moving && retries < 3 && retryErroredTiles(m) > 0) {
          retries++;
          m.once("idle", onIdle);
          return;
        }
        requestAnimationFrame(settle);
      } else {
        m.once("idle", onIdle);
      }
    };

    m.jumpTo({ center: [cx, cy], zoom });
    // Sub-threshold transform deltas (the asymptotic tail of a fly-in) don't
    // dirty the canvas; force a repaint so the idle gate waits on THIS frame.
    m.triggerRepaint();
    m.once("idle", onIdle);
    // A tile fetch hung under tile traffic keeps the map not-idle forever —
    // re-kick stuck tiles as errored so they reload fresh via the retry above.
    const watchdog = moving ? null : setTimeout(() => {
      if (cancelled || released) return;
      const tms = (m as any).style?.tileManagers ?? {};
      let stuck = 0;
      for (const tm of Object.values<any>(tms)) {
        for (const t of tm?._inViewTiles?.getAllTiles?.() ?? []) {
          if (t.state === "loading" || t.state === "reloading") {
            t.abortController?.abort?.();
            tm._source?.abortTile?.(t);
            t.state = "errored";
            stuck++;
          }
        }
      }
      if (stuck) m.triggerRepaint();
    }, 8000);
    // Cap stays under Remotion's delayRender timeout so a frame can never hang.
    const fallback = setTimeout(release, moving ? 1500 : 20000);

    return () => {
      cancelled = true;
      if (watchdog) clearTimeout(watchdog);
      clearTimeout(fallback);
      m.off("idle", onIdle);
      release();
    };
    // Re-gate EVERY frame: a once-per-hold gate lets a worker tab that released
    // mid-settle keep that stale canvas for all its interleaved frames.
  }, [map, cx, cy, zoom, moving, absFrame]);
}

/** Moving segment: flies `from`→`to`. Publishes the destination `selectedSlug`
 *  at flight start so the highlight moves when the flight begins. */
export const Flight: React.FC<{
  from: MapViewport;
  to: MapViewport;
  selectedSlug?: string;
  durationInFrames: number;
  absFrame: number;
}> = ({ from, to, selectedSlug, durationInFrames, absFrame }) => {
  const frame = useCurrentFrame();
  const { map } = useMapContext();
  useSelectedSlug(selectedSlug);

  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    ...CLAMP,
    easing: FLIGHT_EASE,
  });
  const fp = flightPath({
    from: { lng: from.center[0], lat: from.center[1] },
    to: { lng: to.center[0], lat: to.center[1] },
    startZoom: from.zoom,
    endZoom: to.zoom,
    t,
  });
  const vp: MapViewport = { center: [fp.center.lng, fp.center.lat], zoom: fp.zoom };
  useMapFrame(map, vp, true, absFrame);
  return null;
};

/** Static segment: holds `at`, gated on tile settle. */
export const Hold: React.FC<{
  at: MapViewport;
  selectedSlug?: string;
  absFrame: number;
}> = ({ at, selectedSlug, absFrame }) => {
  const { map } = useMapContext();
  useSelectedSlug(selectedSlug);
  useMapFrame(map, at, false, absFrame);
  return null;
};
