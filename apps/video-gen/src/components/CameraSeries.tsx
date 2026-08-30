import { useMemo } from "react";
import { Series, useCurrentFrame } from "remotion";
import { buildCameraSegments } from "../lib/camera-segments";
import { Flight, Hold } from "./Flight";
import { BUILDING_ZOOM, type MapViewport } from "../lib/viewport";
import type { ReelBuilding } from "../lib/config";

/** Camera-segment chain as a <Series>. Memoized: re-renders every frame as a
 *  MapProvider descendant, but depends only on stable reel inputs. */
export const CameraSeries: React.FC<{
  buildings: ReelBuilding[];
  worldVP: MapViewport;
}> = ({ buildings, worldVP }) => {
  const segments = useMemo(
    () => buildCameraSegments(buildings, worldVP, BUILDING_ZOOM),
    [buildings, worldVP],
  );
  // useCurrentFrame() inside a Series.Sequence is sequence-relative (constant
  // across a hold); the capture gate needs the absolute frame to re-run per frame.
  const absFrame = useCurrentFrame();
  return (
    <Series>
      {segments.map((s, i) => (
        <Series.Sequence key={i} durationInFrames={s.durationInFrames} layout="none">
          {s.kind === "hold" ? (
            <Hold at={s.at} selectedSlug={s.selectedSlug} absFrame={absFrame} />
          ) : (
            <Flight from={s.from} to={s.to} selectedSlug={s.selectedSlug} durationInFrames={s.durationInFrames} absFrame={absFrame} />
          )}
        </Series.Sequence>
      ))}
    </Series>
  );
};
