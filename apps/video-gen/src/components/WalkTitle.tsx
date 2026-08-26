import type { Phase } from "./SoftBlurIn";
import { CaptionLine } from "./BuildingCaption";
import { REEL_TYPE } from "../lib/type";

const NO_ANIM: Phase = { when: 0, last: 0, enabled: false };

/** The reel's persistent top-left title through WALK — the architect's name,
 *  always on so the frame always says what we're showing. Sits below the
 *  caption scale (subtitle-tier, not caption-tier), same glyph-bound halo as
 *  the building captions for legibility over the map. No entrance/exit anim:
 *  it rides the shared chrome opacity and holds for the whole beat. */
export const WalkTitle: React.FC<{ title: string; opacity: number }> = ({
  title,
  opacity,
}) => (
  <div style={{ opacity }}>
    <CaptionLine text={title} start={NO_ANIM} end={NO_ANIM} role={REEL_TYPE.walkTitle} />
  </div>
);
