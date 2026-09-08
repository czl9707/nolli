import { NO_ANIM } from "@nolli/remotion";
import { CaptionLine } from "./BuildingCaption";
import { REEL_TYPE } from "../lib/type";

/** Persistent top-left title through WALK. Rides the shared chrome opacity;
 *  halo keeps it legible over the map. */
export const WalkTitle: React.FC<{ lines: [string, string]; opacity: number }> = ({
  lines,
  opacity,
}) => (
  <div style={{ opacity }}>
    {lines.map((text, i) => (
      <CaptionLine key={i} text={text} start={NO_ANIM} end={NO_ANIM} role={REEL_TYPE.walkTitle} />
    ))}
  </div>
);
