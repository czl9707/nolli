import { AbsoluteFill } from "remotion";
import { SoftBlurIn } from "./SoftBlurIn";
import { secToFrames } from "../lib/timeline";

const FONT_SIZE = 104;
const FAMILY = "var(--font-playful)"; // match the CTA lockup
const REVEAL_START = secToFrames(0.1);
const EXIT_F = 8; // standard SoftBlurIn exit (matches CTA + BuildingCaption)

/** HOOK beat title — the reel's descriptive title (`"<architect>'s work over
 *  time"`), one SoftBlurIn line, vertically centered, left-aligned within the
 *  right (bg) zone. Fills its absolutely-positioned parent (ReelComposition
 *  sizes/places the right zone). Reveals shortly after HOOK start, holds, then
 *  blur-out-up exits across `[exitStart, exitStart+EXIT_F]` — the standard exit,
 *  synced to the slot-0 fly. Sits on solid bg (not over the map) → no halo. */
export const HookLockup: React.FC<{
  title: string;
  /** Absolute frame (HOOK starts at frame 0). */
  frame: number;
  /** Frame the blur-out exit begins (= WALK_START). */
  exitStart: number;
}> = ({ title, frame, exitStart }) => {
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
      <div style={{ maxWidth: "100%" }}>
        <SoftBlurIn
          text={title}
          frame={frame}
          start={REVEAL_START}
          exitStart={exitStart}
          exitF={EXIT_F}
          fontSize={FONT_SIZE}
          fontFamily={FAMILY}
          color={FG}
          style={{ textAlign: "left" }}
        />
      </div>
    </AbsoluteFill>
  );
};
