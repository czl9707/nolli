import type { Phase } from "./SoftBlurIn";
import { CaptionLine } from "./BuildingCaption";
import { REEL_TYPE } from "../lib/type";

const NO_ANIM: Phase = { when: 0, last: 0, enabled: false };

/** The persistent top-left title through WALK. Rides the shared chrome
 *  opacity; halo keeps it legible over the map. */
export const WalkTitle: React.FC<{ title: string; opacity: number }> = ({
  title,
  opacity,
}) => (
  <div style={{ opacity }}>
    <CaptionLine text={title} start={NO_ANIM} end={NO_ANIM} role={REEL_TYPE.walkTitle} />
  </div>
);
