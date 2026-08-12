import { SoftBlurIn } from "./SoftBlurIn";
import { SLOT_FRAMES } from "../lib/timeline";
import type { ReelBuilding } from "../lib/config";
import type { Phase } from "../lib/text-anim";

const FG = "rgb(var(--color-primary-foreground))";

const TITLE_SIZE = 64;
const META_SIZE = 28;
const CAPTION_LEFT = 64;
const CAPTION_BOTTOM = 96;
const CAPTION_MAX_W = "50%"; // wrap long names before they reach the card stack
const EXIT_F = 8; // blur-out-up length at slot end

const REVEAL_START = 0; // begin the blur-in at slot start (concurrent with the slide)
const META_START = 12; // meta trails the title so the two lines step in, not stack
const EXIT_START = SLOT_FRAMES - EXIT_F; // both lines blur out at slot end
// Entrance window: a fixed ~20-frame cascade regardless of name length (long
// names resolve slightly faster than the old length-dependent timing — intentional).
const REVEAL_LAST = 20;
const META_REVEAL_LAST = 20 + META_START; // meta's window starts at META_START

// Glyph-bound halo: each line is rendered twice — a dark, heavier-weight copy
// blurred behind (the halo) and the fg copy on top. Unlike a div plate, the
// halo travels with the letters and only darkens the map right around the
// glyphs, so white text stays legible over the dark map's light water without a
// visible rectangular pad. Both copies share the same Phases, so they
// reveal and move char-for-char in lockstep.
const HALO_COLOR = "rgb(var(--color-primary-background))"; // near-black in dark theme
const HALO_BLUR_PX = 8; // blur spread — the halo's soft reach
const HALO_WEIGHT_BOOST = 200; // extra weight so halo glyphs bleed past the fg

/** One caption line: a blurred dark halo copy stacked behind the fg copy. Both
 *  share the same Phases so they reveal and move char-for-char in lockstep. */
const CaptionLine: React.FC<{
  text: string;
  start: Phase;
  end: Phase;
  fontSize: number;
  fontWeight: number;
  style?: React.CSSProperties;
  marginTop?: number;
}> = ({ text, start, end, fontSize, fontWeight, style, marginTop }) => {
  const shared = { text, start, end };
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
        <SoftBlurIn
          {...shared}
          style={{ fontSize, fontFamily: "var(--font-playful)", fontWeight: fontWeight + HALO_WEIGHT_BOOST, color: HALO_COLOR, ...style }}
        />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <SoftBlurIn
          {...shared}
          style={{ fontSize, fontFamily: "var(--font-playful)", fontWeight, color: FG, ...style }}
        />
      </div>
    </div>
  );
};

/** Bottom-left building caption for the WALK beat: building name (big) over
 *  year · location, all foreground color, floating over the map with a glyph-
 *  bound halo so it stays legible over the dark map's light water. Reveals per
 *  slot with the same per-char soft-blur as the CTA (a fixed ~20-frame entrance
 *  window regardless of name length), wraps at CAPTION_MAX_W, and blurs out at
 *  slot end. Renders inside a per-building `<Series.Sequence>`, so SoftBlurIn's
 *  `useCurrentFrame()` is slot-relative (0 at each slot start) and each building
 *  gets a fresh reveal via natural Sequence remount. Fades with the shared chrome
 *  opacity. */
export const BuildingCaption: React.FC<{
  building: ReelBuilding;
  opacity: number;
}> = ({ building, opacity }) => {
  const meta = `${building.year} · ${building.city}${building.countryCode ? `, ${building.countryCode}` : ""}`;
  const end: Phase = { when: EXIT_START, last: EXIT_START + EXIT_F, enabled: true };
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
      <CaptionLine
        text={building.name}
        start={{ when: REVEAL_START, last: REVEAL_LAST, enabled: true }}
        end={end}
        fontSize={TITLE_SIZE}
        fontWeight={700}
      />
      <CaptionLine
        text={meta}
        start={{ when: META_START, last: META_REVEAL_LAST, enabled: true }}
        end={end}
        fontSize={META_SIZE}
        fontWeight={500}
        marginTop={10}
        style={{ opacity: 0.8, letterSpacing: "0.02em" }}
      />
    </div>
  );
};
