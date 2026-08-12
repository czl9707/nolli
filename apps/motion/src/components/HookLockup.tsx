import { useCurrentFrame } from "remotion";
import { SoftBlurIn } from "./SoftBlurIn";
import { WALK_START } from "../lib/timeline";

const FONT_SIZE = 104;
const FAMILY = "var(--font-playful)"; // match the CTA lockup
// Title is present from the HOOK Sequence's first frame (no blur-in entrance)
// — only the exit plays. start is far enough negative that every char's
// softBlurChar entrance is fully settled before local frame 0 (max char offset
// is charIndex * staggerF; -100 covers any realistic title length), so the text
// reads as statically settled, then blur-out-up exits at WALK_START.
const SETTLED_START = -100;
const EXIT_F = 8; // standard SoftBlurIn exit (matches CTA + BuildingCaption)

/** HOOK beat title — the reel's descriptive title (`"<architect>'s work over
 *  time"`), one SoftBlurIn block. Present from the HOOK Sequence's first frame
 *  (no entrance anim), vertically centered and right-aligned within the right
 *  (bg) zone by its parent flex container. Blur-out-up exits across
 *  `[WALK_START, WALK_START + EXIT_F]` — the standard exit, synced to the slot-0
 *  fly. `useCurrentFrame()` is HOOK-local (0 at HOOK start). minWidth:0 lets the
 *  block wrap at the zone edge. */
export const HookLockup: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <SoftBlurIn
      text={title}
      frame={frame}
      start={SETTLED_START}
      exitStart={WALK_START}
      exitF={EXIT_F}
      fontSize={FONT_SIZE}
      fontFamily={FAMILY}
      color={FG}
      style={{ textAlign: "right", maxWidth: "100%", minWidth: 0 }}
    />
  );
};
