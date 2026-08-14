import { useMemo } from "react";
import { Series } from "remotion";
import { buildCameraSegments } from "../lib/camera-segments";
import { Flight, Hold } from "./Flight";
import { BUILDING_ZOOM, type MapViewport } from "../lib/viewport";
import type { ReelBuilding } from "../lib/config";

/** Camera-segment chain as a <Series>. Memoized — the chain depends only on
 *  buildings + worldVP (both stable for a reel), so the ~2N+1 allocations are
 *  built once though this re-renders every frame as a MapProvider descendant. */
export const CameraSeries: React.FC<{
  buildings: ReelBuilding[];
  worldVP: MapViewport;
}> = ({ buildings, worldVP }) => {
  const segments = useMemo(
    () => buildCameraSegments(buildings, worldVP, BUILDING_ZOOM),
    [buildings, worldVP],
  );
  return (
    <Series>
      {segments.map((s, i) => (
        <Series.Sequence key={i} durationInFrames={s.durationInFrames} layout="none">
          {s.kind === "hold" ? (
            <Hold at={s.at} selectedSlug={s.selectedSlug} />
          ) : (
            <Flight from={s.from} to={s.to} selectedSlug={s.selectedSlug} durationInFrames={s.durationInFrames} />
          )}
        </Series.Sequence>
      ))}
    </Series>
  );
};
