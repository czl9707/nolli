import { SoftBlurIn } from "./SoftBlurIn";
import { secToFrames, WALK_SLOT_S } from "../lib/timeline";
import type { ReelBuilding } from "../lib/config";

const FG = "rgb(var(--color-primary-foreground))";

const TITLE_SIZE = 64;
const META_SIZE = 28;
const CAPTION_LEFT = 64;
const CAPTION_BOTTOM = 96;
const CAPTION_MAX_W = "50%"; // wrap long names before they reach the card stack
const EXIT_F = 8; // blur-out-up length at slot end

const SLOT_FRAMES = secToFrames(WALK_SLOT_S);
const REVEAL_START = 0; // begin the blur-in at slot start (concurrent with the slide)
const META_START = 12; // meta trails the title so the two lines step in, not stack
const EXIT_START = SLOT_FRAMES - EXIT_F; // both lines blur out at slot end
// Faster-than-default entrance so the caption settles quickly and leaves the
// slot for reading (defaults revealF=8/staggerF=2 are tuned for the CTA lockup).
const REVEAL_F = 6;
const STAGGER_F = 1;

// Glyph-bound halo: each line is rendered twice — a dark, heavier-weight copy
// blurred behind (the halo) and the fg copy on top. Unlike a div plate, the
// halo travels with the letters and only darkens the map right around the
// glyphs, so white text stays legible over the dark map's light water without a
// visible rectangular pad. Both copies share the same SoftBlurIn opts, so they
// reveal and move char-for-char in lockstep.
const HALO_COLOR = "rgb(var(--color-primary-background))"; // near-black in dark theme
const HALO_BLUR_PX = 8; // blur spread — the halo's soft reach
const HALO_WEIGHT_BOOST = 200; // extra weight so halo glyphs bleed past the fg

/** One caption line: a blurred dark halo copy stacked behind the fg copy. Both
 *  share the same per-char animation (same frame/opts) so they stay aligned. */
const CaptionLine: React.FC<{
  text: string;
  frame: number;
  start: number;
  exitStart: number;
  exitF: number;
  revealF: number;
  staggerF: number;
  fontSize: number;
  fontWeight: number;
  style?: React.CSSProperties;
  marginTop?: number;
}> = ({ text, frame, start, exitStart, exitF, revealF, staggerF, fontSize, fontWeight, style, marginTop }) => {
  const shared = {
    text, frame, start, exitStart, exitF, revealF, staggerF, fontSize,
    fontFamily: "var(--font-playful)" as const,
  };
  return (
    <div style={{ position: "relative", marginTop }}>
      {/* Halo: same text, dark, heavier, blurred — absolutely filled so it wraps
          identically to the fg line. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `blur(${HALO_BLUR_PX}px)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <SoftBlurIn {...shared} fontWeight={fontWeight + HALO_WEIGHT_BOOST} color={HALO_COLOR} style={style} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <SoftBlurIn {...shared} fontWeight={fontWeight} color={FG} style={style} />
      </div>
    </div>
  );
};

/** Bottom-left building caption for the WALK beat: building name (big) over
 *  year · location, all foreground color, floating over the map with a glyph-
 *  bound halo so it stays legible over the dark map's light water. Reveals per
 *  slot with the same per-char soft-blur as the CTA, starting at slot start (a
 *  faster variant tuned for reading time), wraps at CAPTION_MAX_W, and blurs out
 *  at slot end. Remount per building (key={currentIndex} upstream) so each gets a
 *  fresh reveal. Fades with the shared chrome opacity. */
export const BuildingCaption: React.FC<{
  building: ReelBuilding;
  /** Frames elapsed in the current slot — drives the reveal/exit timing. */
  slotFrame: number;
  opacity: number;
}> = ({ building, slotFrame, opacity }) => {
  const meta = `${building.year} · ${building.city}${building.countryCode ? `, ${building.countryCode}` : ""}`;
  const line = { frame: slotFrame, exitStart: EXIT_START, exitF: EXIT_F, revealF: REVEAL_F, staggerF: STAGGER_F };
  return (
    <div
      style={{
        position: "absolute",
        left: CAPTION_LEFT,
        bottom: CAPTION_BOTTOM,
        maxWidth: CAPTION_MAX_W,
        zIndex: 5,
        opacity,
      }}
    >
      <CaptionLine {...line} text={building.name} start={REVEAL_START} fontSize={TITLE_SIZE} fontWeight={700} />
      <CaptionLine
        {...line}
        text={meta}
        start={META_START}
        fontSize={META_SIZE}
        fontWeight={500}
        marginTop={10}
        style={{ opacity: 0.8, letterSpacing: "0.02em" }}
      />
    </div>
  );
};
