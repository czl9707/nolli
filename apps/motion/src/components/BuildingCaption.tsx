import { SoftBlurIn } from "./SoftBlurIn";
import { secToFrames, WALK_SLOT_S } from "../lib/timeline";
import type { ReelBuilding } from "../lib/config";

const FG = "rgb(var(--color-primary-foreground))";

const TITLE_SIZE = 64;
const META_SIZE = 28;
const CAPTION_LEFT = 64;
const CAPTION_BOTTOM = 64;
const CAPTION_MAX_W = "50%"; // wrap long names before they reach the card stack
const EXIT_F = 8; // blur-out-up length at slot end

// Soft dark plate behind the caption. The dark map paints water as light cream
// (≈ the white caption text), so over water the text needs a backing. The plate
// is a semi-transparent dark fill, feathered by a CSS blur — it only visibly
// darkens where the map behind is light (water); over dark land it blends away.
// Plain fill + filter:blur (not backdrop-filter) so it renders reliably under
// headless Chrome. Tunable: opacity = strength, pad/blur = feather reach.
const PLATE_OPACITY = 0.5;
const PLATE_PAD = 36;   // how far the plate extends past the text box before blur
const PLATE_BLUR = 28;  // edge feather

const SLOT_FRAMES = secToFrames(WALK_SLOT_S);
const REVEAL_START = 0; // begin the blur-in at slot start (concurrent with the slide)
const META_START = 12; // meta trails the title so the two lines step in, not stack
const EXIT_START = SLOT_FRAMES - EXIT_F; // both lines blur out at slot end
// Faster-than-default entrance so the caption settles quickly and leaves the
// slot for reading (defaults revealF=8/staggerF=2 are tuned for the CTA lockup).
const REVEAL_F = 6;
const STAGGER_F = 1;

/** Bottom-left building caption for the WALK beat: building name (big) over
 *  year · location, all foreground color, floating over the map on a soft dark
 *  plate (so white text stays legible over the dark map's light water). Reveals
 *  per slot with the same per-char soft-blur as the CTA, starting at slot start
 *  (a faster variant tuned for reading time), wraps at CAPTION_MAX_W, and blurs
 *  out at slot end. Remount per building (key={currentIndex} upstream) so each
 *  gets a fresh reveal. Fades with the shared chrome opacity. */
export const BuildingCaption: React.FC<{
  building: ReelBuilding;
  /** Frames elapsed in the current slot — drives the reveal/exit timing. */
  slotFrame: number;
  opacity: number;
}> = ({ building, slotFrame, opacity }) => {
  const meta = `${building.year} · ${building.city}${building.countryCode ? `, ${building.countryCode}` : ""}`;
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
      {/* Legibility plate — see PLATE_* docs above. Sits behind the text only. */}
      <div
        style={{
          position: "absolute",
          inset: -PLATE_PAD,
          backgroundColor: `rgb(var(--color-primary-background) / ${PLATE_OPACITY})`,
          filter: `blur(${PLATE_BLUR}px)`,
          borderRadius: 32,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, color: FG, lineHeight: 1.05 }}>
        <SoftBlurIn
          text={building.name}
          frame={slotFrame}
          start={REVEAL_START}
          exitStart={EXIT_START}
          exitF={EXIT_F}
          revealF={REVEAL_F}
          staggerF={STAGGER_F}
          fontSize={TITLE_SIZE}
          fontFamily="var(--font-playful)"
          fontWeight={700}
          color={FG}
        />
        <div style={{ marginTop: 10 }}>
          <SoftBlurIn
            text={meta}
            frame={slotFrame}
            start={META_START}
            exitStart={EXIT_START}
            exitF={EXIT_F}
            revealF={REVEAL_F}
            staggerF={STAGGER_F}
            fontSize={META_SIZE}
            fontFamily="var(--font-playful)"
            fontWeight={500}
            color={FG}
            style={{ opacity: 0.8, letterSpacing: "0.02em" }}
          />
        </div>
      </div>
    </div>
  );
};
