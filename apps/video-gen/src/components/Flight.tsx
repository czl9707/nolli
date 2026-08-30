import { useEffect } from "react";
import { continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { useMapContext, useSelectedSlug } from "./MapProvider";
import { FLIGHT_EASE, flightPath } from "../lib/viewport";
import { CLAMP } from "../lib/timeline";
import type { MapRef } from "@nolli/map";
import type { MapViewport } from "../lib/viewport";

/**
 * Capture primitive: drives the shared map instance to `viewport` and gates the
 * frame's screenshot release on tile-readiness. Called by `<Flight>` (moving=true,
 * fast release) and `<Hold>` (moving=false, wait for tiles).
 *
 * `moving` is a property of the calling segment (Flight vs Hold), NOT inferred
 * from the previous frame. This matters at the fly→hold boundary: the first held
 * frame differs from the last fly frame, yet is already settled — treating it as
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
 * EVERY frame re-runs the gate (frame is in the effect deps). With parallel
 * render workers each holding its own map instance, a once-per-hold gate let
 * a tab that released mid-load keep its stale canvas for all its interleaved
 * frames — visible as street/label blink after each landing.
 * (`map.stop()` is deliberately NOT called: it halts the render loop and
 * starves subsequent frames' tile loads.)
 */
/** Errored in-view tiles are invisible to `areTilesLoaded()` (errored counts
 *  as loaded) — the map then renders parent-tile fallback: streets but no
 *  labels. Collect them via the tile managers' in-view stores. Private API,
 *  guarded so a MapLibre upgrade degrades to "no errored tiles found". */
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
    // Yield a few rAFs after the gate passes so WebGL paint + page composite
    // land before Remotion screenshots (otherwise a tile mid-paint shows as a
    // cream tile-shaped hole).
    let n = 4;
    const settle = () => {
      if (cancelled) return;
      if (--n <= 0) release();
      else requestAnimationFrame(settle);
    };
    // Symbol placement is throttled (a new placement won't start until the
    // last one stops being "recent"), and `idle` CAN fire while the placement
    // is still stale from flight-time state — capturing then shows the
    // previous zoom's labels for one frame. Require a settled placement too.
    const placementSettled = () => {
      const placement = (m as any).style?.placement;
      return !placement || placement.stale !== true;
    };
    const onIdle = () => {
      if (cancelled) return;
      if (moving || (map.areTilesLoaded() && placementSettled())) {
        // Errored tiles pass areTilesLoaded yet render as label-less fallback.
        // Re-kick them (TileManager.reload() skips errored tiles) and wait for
        // the next idle; bounded so a hard-failing tile can't hang the frame.
        if (!moving && retries < 3 && retryErroredTiles(map) > 0) {
          retries++;
          map.once("idle", onIdle);
          return;
        }
        requestAnimationFrame(settle);
      } else {
        map.once("idle", onIdle);
      }
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
    // Watchdog (settled frames): a tile whose fetch hangs under multi-worker
    // tile traffic keeps the map not-idle forever — the gate below would spin
    // until the hard cap and screenshot parent-tile fallback. Re-kick stuck
    // loading tiles as errored (aborting best-effort); areTilesLoaded() then
    // passes, the idle gate fires, and retryErroredTiles reloads them fresh.
    const watchdog = moving ? null : setTimeout(() => {
      if (cancelled || released) return;
      const tms = (map as any).style?.tileManagers ?? {};
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
      if (stuck) map.triggerRepaint();
    }, 8000);
    // Safety net: moving frames release fast (a hole is fine), static frames
    // get a generous cap so a frame can never hang Remotion. The settled cap
    // stays under Remotion's delayRender timeout.
    const fallback = setTimeout(release, moving ? 1500 : 20000);

    return () => {
      cancelled = true;
      if (watchdog) clearTimeout(watchdog);
      clearTimeout(fallback);
      map.off("idle", onIdle);
      release();
    };

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      m.off("idle", onIdle);
      release();
    };
    // `frame` in deps: EVERY frame gates, not just the first of a hold.
    // A once-per-hold gate lets a worker tab that captured mid-load (or whose
    // glyphs arrived after its first settled frame) keep that stale canvas for
    // all its interleaved frames; per-frame re-gating self-corrects.
  }, [map, cx, cy, zoom, moving, absFrame]);
}

/** Moving camera segment: flies `from`→`to` over its duration. Publishes the
 *  destination `selectedSlug` at flight start so the highlight moves when the
 *  flight begins, not on arrival. */
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

/** Static camera segment: holds `at`, waiting for tiles to settle so the
 *  building never shows a sharpen-in flicker. Publishes `selectedSlug` while
 *  active (undefined = none). */
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
