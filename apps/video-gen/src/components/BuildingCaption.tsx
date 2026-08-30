import { SoftBlurIn, type Phase } from "./SoftBlurIn";
import { SLOT_FRAMES } from "../lib/timeline";
import { REEL_TYPE, type TypeRole } from "../lib/type";
import type { ReelBuilding } from "../lib/config";

const FG = "rgb(var(--color-primary-foreground))";

const CAPTION_LEFT = 64;
const CAPTION_BOTTOM = 96;
const CAPTION_MAX_W = "50%"; // wrap long names before they reach the card stack
const EXIT_F = 8; // blur-out-up length at slot end

const REVEAL_START = 0; // concurrent with the card slide
const META_START = 12; // meta trails the title so the two lines step in
const EXIT_START = SLOT_FRAMES - EXIT_F;
// Fixed ~20-frame cascade regardless of name length — long names resolve
// slightly faster than length-dependent timing; intentional.
const REVEAL_LAST = 20;
const META_REVEAL_LAST = 20 + META_START;

// Each line renders twice: a blurred dark halo copy behind the fg copy. A
// glyph-bound halo (not a div plate) travels with the letters and darkens only
// around the glyphs — white text stays legible over the dark map's light water
// with no rectangular pad.
const HALO_COLOR = "rgb(var(--color-primary-background))";
const HALO_BLUR_PX = 8;

export const CaptionLine: React.FC<{
  text: string;
  start: Phase;
  end: Phase;
  role: TypeRole;
  style?: React.CSSProperties;
  marginTop?: number;
}> = ({ text, start, end, role, style, marginTop }) => {
  const shared = { text, start, end };
  return (
    <div style={{ position: "relative", marginTop }}>
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
          style={{ ...role, color: HALO_COLOR, ...style }}
        />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <SoftBlurIn
          {...shared}
          style={{ ...role, color: FG, ...style }}
        />
      </div>
    </div>
  );
};

/** Bottom-left building caption for the WALK beat: name over year · location,
 *  per-char soft-blur reveal, glyph-bound halo for legibility over the map.
 *  Renders inside a per-building `<Series.Sequence>` — the frame is
 *  slot-relative and each building gets a fresh reveal via Sequence remount. */
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
        role={REEL_TYPE.captionTitle}
      />
      <CaptionLine
        text={meta}
        start={{ when: META_START, last: META_REVEAL_LAST, enabled: true }}
        end={end}
        role={REEL_TYPE.captionMeta}
        marginTop={10}
      />
    </div>
  );
};
