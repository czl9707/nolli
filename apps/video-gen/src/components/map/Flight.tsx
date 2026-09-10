// apps/video-gen/src/components/map/Flight.tsx
// Moving camera segment — the Flight/Hold pair for per-slot camera flights.
// The static walk renders holds only (buildStaticSegments); wire this up
// alongside buildCameraSegments when a variant wants flying again.
import { interpolate, useCurrentFrame } from "remotion";
import { useMapContext, useSelectedSlug } from "./MapProvider";
import { useMapFrame } from "./Hold";
import { FLIGHT_EASE, flightPath } from "@/lib/viewport";
import type { MapViewport } from "@/lib/viewport";

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
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
