import { Img, staticFile, useCurrentFrame } from "remotion";
import { Easing, interpolate } from "remotion";
import { CLAMP, SLOT_FRAMES, SNAP_FRAC } from "../lib/timeline";
import type { ReelBuilding } from "../lib/config";

// --- Carousel geometry + math (1920×1080). Pure: no React/Remotion side effects. ---

/** Focused card size: 4:5 portrait. */
export const CARD_W = 608;
export const CARD_H = 760;
/** First offset step (2nd card) — 15% of card height. */
export const CARD_PITCH = Math.round(CARD_H * 0.15);
/** Each successive offset step multiplies by this → diminishing pitch
 *  (perspective compression) for a receding 3D feel. */
export const PITCH_DECAY = 0.5;
/** Outermost visible card |distance|; anything beyond is hard-culled — the
 *  VEIL_CAP darkness hides the pop at the cull edge (no dissolve needed). */
export const CARD_DEPTH = 2;
/** bg-veil opacity on the outermost card. Caps <1 so receding cards read as
 *  darkened photos, never solid black boxes. */
export const VEIL_CAP = 0.8;
export const CARD_SCALE_STEP = 0.12;
export const CARD_Z_BASE = 100;
export const CARD_Z_STEP = 10;

export type CarouselCardState = {
  index: number;
  /** Signed cyclic distance from the focused position (negative = above center). */
  distance: number;
  scale: number;
  offsetY: number;
  zIndex: number;
  visible: boolean;
  veilOpacity: number;
};

/** Shortest signed cyclic distance from `i` to `position` around a ring of `count`. */
export function cyclicDistance(i: number, position: number, count: number): number {
  if (count <= 0) return 0;
  let d = (((i - position) % count) + count) % count; // [0, count)
  if (d > count / 2) d -= count; // (-count/2, count/2]
  return d;
}

/** Diminishing offset magnitude for absolute distance `ad` (geometric series). */
function offsetMagnitude(ad: number): number {
  return (CARD_PITCH * (1 - Math.pow(PITCH_DECAY, ad))) / (1 - PITCH_DECAY);
}

/** Resolve one card's stack state given the fractional focused `position`. */
export function carouselCard(i: number, position: number, count: number): CarouselCardState {
  const d = cyclicDistance(i, position, count);
  const ad = Math.abs(d);
  return {
    index: i,
    distance: d,
    scale: 1 - CARD_SCALE_STEP * ad,
    offsetY: Math.round(Math.sign(d) * offsetMagnitude(ad)),
    zIndex: CARD_Z_BASE - Math.round(ad * CARD_Z_STEP),
    visible: ad <= CARD_DEPTH,
    veilOpacity: Math.min(VEIL_CAP, (ad / CARD_DEPTH) * VEIL_CAP),
  };
}

/** Power of the per-slot ease-out snap into center (1 - (1-t)^n). */
const SNAP_EASE = 10;
const SNAP_OUT = Easing.out(Easing.poly(SNAP_EASE));

/** Continuous carousel scroll position for a WALK-local frame: maps the frame
 *  to a fractional focused-building, ease-out snapping into center at each slot
 *  start (decoupled from the camera fly), then holding. */
export function carouselPosFromWalkFrame(walkFrame: number, count: number): number {
  const walkFrames = count * SLOT_FRAMES;
  const t = interpolate(walkFrame, [0, walkFrames], [0, 1], CLAMP);
  const scaled = t * count;
  const idx = Math.max(0, Math.min(count - 1, Math.floor(scaled)));
  const intra = scaled - idx;
  const rollT = SNAP_OUT(interpolate(intra, [0, SNAP_FRAC], [0, 1], CLAMP));
  return Math.max(0, idx - (1 - rollT));
}

// --- Components ---

// Large + soft so the floating cards read as stacked layers over the near-black bg.
const CARD_SHADOW = "0 36px 80px -20px rgba(0, 0, 0, 0.7)";

/** One carousel card: cover photo with a bg-color depth veil (0 on the focused
 *  card → VEIL_CAP on the outermost). */
const CarouselCard: React.FC<{
  slug: string;
  building: ReelBuilding;
  veilOpacity: number;
}> = ({ slug, building, veilOpacity }) => {
  const showVeil = veilOpacity > 0.001;
  return (
    <div
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        borderRadius: "var(--size-border-radius)",
        overflow: "hidden",
        boxShadow: CARD_SHADOW,
        lineHeight: 0,
        backgroundColor: "rgb(var(--color-secondary-background))",
      }}
    >
      <Img
        src={staticFile(`capture/${slug}/images/${building.slug}-hero.jpg`)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {showVeil ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgb(var(--color-primary-background))",
            opacity: veilOpacity,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};

/** Vertical cyclic carousel of building cards — a receding coverflow stack.
 *  Cards beyond CARD_DEPTH are hard-culled (the depth veil hides the pop, so no
 *  dissolve). Cover-only; captions live off-card in BuildingCaption. */
export const CardCarousel: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
}> = ({ slug, buildings }) => {
  const frame = useCurrentFrame();
  const count = buildings.length;
  const position = carouselPosFromWalkFrame(frame, count);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {buildings.map((b, i) => {
        const s = carouselCard(i, position, count);
        if (!s.visible) return null;
        return (
          <div
            key={b.slug}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translateY(${s.offsetY}px) scale(${s.scale})`,
              zIndex: s.zIndex,
            }}
          >
            <CarouselCard slug={slug} building={b} veilOpacity={s.veilOpacity} />
          </div>
        );
      })}
    </div>
  );
};
