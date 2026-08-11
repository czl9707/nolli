import { SoftBlurIn } from "./SoftBlurIn";
import { secToFrames } from "../lib/timeline";

const FONT_SIZE = 104;
const FAMILY = "var(--font-playful)"; // match the CTA lockup
// Title is present from frame 0 (no blur-in entrance) — only the exit plays. A
// far-negative start means every char's entrance is already complete at frame 0,
// so the text reads as statically settled, then blur-out-up exits at exitStart.
const PRE_SETTLED_START = -9999;
const EXIT_F = 8; // standard SoftBlurIn exit (matches CTA + BuildingCaption)

/** HOOK beat title — the reel's descriptive title (`"<architect>'s work over
 *  time"`), one SoftBlurIn block. Present from the first frame (no entrance
 *  anim), vertically centered and right-aligned within the right (bg) zone by
 *  its parent flex container. Blur-out-up exits across `[exitStart,
 *  exitStart+EXIT_F]` — the standard exit, synced to the slot-0 fly. minWidth:0
 *  lets the block wrap at the zone edge. */
export const HookLockup: React.FC<{
  title: string;
  /** Absolute frame (HOOK starts at frame 0). */
  frame: number;
  /** Frame the blur-out exit begins (= WALK_START). */
  exitStart: number;
}> = ({ title, frame, exitStart }) => {
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <SoftBlurIn
      text={title}
      frame={frame}
      start={PRE_SETTLED_START}
      exitStart={exitStart}
      exitF={EXIT_F}
      fontSize={FONT_SIZE}
      fontFamily={FAMILY}
      color={FG}
      style={{ textAlign: "right", maxWidth: "100%", minWidth: 0 }}
    />
  );
};
