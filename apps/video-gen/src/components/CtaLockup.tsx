import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { secToFrames, CLAMP } from "../lib/timeline";
import { SoftBlurIn } from "./SoftBlurIn";

const FONT_SIZE = 104;
const FAMILY = "var(--font-playful)";
const CTA_LINE_S = 1.5;
const CTA_LOCKUP_S = 2.5;
const LINE_END = secToFrames(CTA_LINE_S);
const EXIT_F = 8;
const LINE_REVEAL_START = secToFrames(0.1);
const LINE_EXIT_START = LINE_END - EXIT_F;
const LOCK_START = LINE_END;
const MARK_IN: [number, number] = [LOCK_START, LOCK_START + secToFrames(0.3)];

/**
 * CTA beat. The favicon renders cream via the document-level forced dark
 * color-scheme (see MapProvider) — its @media (prefers-color-scheme: dark)
 * branch applies.
 */
export const CtaLockup: React.FC = () => {
  const ctaFrame = useCurrentFrame();
  const markScale = interpolate(ctaFrame, MARK_IN, [0.6, 1], CLAMP);
  const markOpacity = interpolate(ctaFrame, MARK_IN, [0, 1], CLAMP);
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute" }}>
        <SoftBlurIn
          text="Explore more in"
          start={{ when: LINE_REVEAL_START, last: LINE_REVEAL_START + 36, enabled: true }}
          end={{ when: LINE_EXIT_START, last: LINE_EXIT_START + EXIT_F, enabled: true }}
          style={{ fontSize: FONT_SIZE, fontFamily: FAMILY, color: FG }}
        />
      </div>
      <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ transform: `scale(${markScale})`, opacity: markOpacity }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Img src={staticFile("favicon.svg")} style={{ width: 80, height: 80 }} />
        </div>
        <SoftBlurIn
          text="Nolli"
          start={{ when: LOCK_START, last: LOCK_START + 16, enabled: true }}
          end={{ when: 0, last: 0, enabled: false }}
          style={{ fontSize: FONT_SIZE, fontFamily: FAMILY, color: FG }}
        />
      </div>
    </AbsoluteFill>
  );
};
