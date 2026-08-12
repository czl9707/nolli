import { Series } from "remotion";
import { buildCameraSegments } from "../lib/camera-segments";
import { Flight } from "./Flight";
import { Hold } from "./Hold";
import { BUILDING_ZOOM, type MapViewport } from "../lib/viewport";
import type { ReelBuilding } from "../lib/config";

/**
 * The camera-segment chain as a <Series>. Sibling to the HOOK/WALK/CTA beat
 * Sequences — spans all beats (world→b0 flight crosses HOOK→WALK; last Hold
 * crosses into CTA). Each Flight/Hold drives the shared map instance (via
 * context) over its own local clock. Contiguity is by reference (builder).
 */
export const CameraSeries: React.FC<{
  buildings: ReelBuilding[];
  worldVP: MapViewport;
}> = ({ buildings, worldVP }) => {
  const segments = buildCameraSegments(buildings, worldVP, BUILDING_ZOOM);
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
