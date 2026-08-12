import { SoftBlurIn } from "./SoftBlurIn";
import { WALK_START } from "../lib/timeline";

const FONT_SIZE = 104;
const FAMILY = "var(--font-playful)"; // match the CTA lockup
/** HOOK title blur-out exit length (frames). Exported so the HOOK `<Sequence>`'s
 *  duration tail stays in lockstep with this exit — tuning it can't silently
 *  desync the Sequence window. */
export const HOOK_EXIT_F = 8;

/** HOOK beat title — the reel's descriptive title (`"<architect>'s work over
 *  time"`), one SoftBlurIn block. Present from the HOOK Sequence's first frame
 *  (no entrance anim — `start.enabled = false`), vertically centered and
 *  right-aligned within the right (bg) zone by its parent flex container.
 *  Blur-out-up exits across `[WALK_START, WALK_START + HOOK_EXIT_F]` — synced to
 *  the slot-0 fly. minWidth:0 lets the block wrap at the zone edge. */
export const HookLockup: React.FC<{ title: string }> = ({ title }) => {
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <SoftBlurIn
      text={title}
      start={{ when: 0, last: 0, enabled: false }}
      end={{ when: WALK_START, last: WALK_START + HOOK_EXIT_F, enabled: true }}
      style={{
        textAlign: "right", maxWidth: "100%", minWidth: 0,
        fontSize: FONT_SIZE, fontFamily: FAMILY, color: FG,
      }}
    />
  );
};
