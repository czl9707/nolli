import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CTA_LINE_S, secToFrames, CLAMP } from "../lib/timeline";
import { SoftBlurIn } from "./SoftBlurIn";

const FONT_SIZE = 104;
const FAMILY = "var(--font-playful)"; // match the H1 the lockup previously used
const LINE_END = secToFrames(CTA_LINE_S);
const EXIT_F = 8; // blur-out-up length (frames)
const LINE_REVEAL_START = secToFrames(0.1);
const LINE_EXIT_START = LINE_END - EXIT_F; // line fully gone exactly as the lockup begins
const LOCK_START = LINE_END; // "Nolli" + mark reveal right as the line exits
const MARK_IN: [number, number] = [LOCK_START, LOCK_START + secToFrames(0.3)];

/**
 * CTA beat. `useCurrentFrame()` is frame-relative-to-CTA-start (this component renders inside a CTA `<Sequence>`).
 * Beat 1 (CTA_LINE_S): "Explore more in" — soft-blur reveal, hold, blur-out-up exit.
 * Beat 2 (rest): favicon mark (scale+fade) + "Nolli" (soft-blur reveal), held to the end.
 *
 * The favicon renders cream via the document-level forced dark color-scheme
 * (see ReelComposition) — its @media (prefers-color-scheme: dark) branch applies.
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
          frame={ctaFrame}
          start={LINE_REVEAL_START}
          exitStart={LINE_EXIT_START}
          exitF={EXIT_F}
          fontSize={FONT_SIZE}
          fontFamily={FAMILY}
          color={FG}
        />
      </div>
      <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ transform: `scale(${markScale})`, opacity: markOpacity }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Img src={staticFile("favicon.svg")} style={{ width: 80, height: 80 }} />
        </div>
        <SoftBlurIn
          text="Nolli"
          frame={ctaFrame}
          start={LOCK_START}
          fontSize={FONT_SIZE}
          fontFamily={FAMILY}
          color={FG}
        />
      </div>
    </AbsoluteFill>
  );
};
