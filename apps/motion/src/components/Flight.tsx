import { useContext, useEffect } from "react";
import { useCurrentFrame } from "remotion";
import { MapContext } from "./MapProvider";
import { useMapFrame } from "../lib/use-map-frame";
import { flightPath, FLIGHT_EASE } from "../lib/viewport";
import type { MapViewport } from "../lib/viewport";

/**
 * Moving camera segment: flies `from`→`to` over its duration. moving=true →
 * fast-release capture gate (tile holes mid-flight are imperceptible).
 * Publishes its destination `selectedSlug` at flight start (highlight moves to
 * the destination when the flight begins) via context from a useEffect.
 */
export const Flight: React.FC<{
  from: MapViewport;
  to: MapViewport;
  selectedSlug?: string;
  durationInFrames: number;
}> = ({ from, to, selectedSlug, durationInFrames }) => {
  const frame = useCurrentFrame();
  const ctx = useContext(MapContext);
  const setSegmentState = ctx?.setSegmentState;
  useEffect(() => {
    if (setSegmentState) setSegmentState({ selectedSlug });
  }, [selectedSlug, setSegmentState]);

  const t = durationInFrames > 0 ? frame / durationInFrames : 1;
  const fp = flightPath({
    from: { lng: from.center[0], lat: from.center[1] },
    to: { lng: to.center[0], lat: to.center[1] },
    startZoom: from.zoom,
    endZoom: to.zoom,
    t: FLIGHT_EASE(Math.min(1, Math.max(0, t))),
  });
  const vp: MapViewport = { center: [fp.center.lng, fp.center.lat], zoom: fp.zoom };
  useMapFrame(ctx?.map ?? null, vp, true);
  return null;
};
