import { carouselCard, overlayOpacityForDistance } from "../lib/card-carousel";
import type { ReelBuilding } from "../lib/config";
import { CarouselCard } from "./CarouselCard";

/**
 * Vertical cyclic carousel of building cards — a receding coverflow stack. The
 * fractional `position` is dead-center; cards within CARD_DEPTH render stacked
 * above/below with diminishing pitch (perspective compression) and a bg-color
 * veil that darkens with depth (capping at VEIL_CAP) for a 3D feel. Beyond
 * CARD_DEPTH cards are hard-culled — the veil darkness hides the pop, so no
 * dissolve is needed. Only the centered card carries the caption overlay
 * (fading in over the last half-step of approach); `centerRevealFrame` drives
 * its name reveal.
 */
export const CardCarousel: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  position: number;
  centerRevealFrame: number;
}> = ({ slug, buildings, position, centerRevealFrame }) => {
  const count = buildings.length;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {buildings.map((b, i) => {
        const s = carouselCard(i, position, count);
        // Hard cull beyond CARD_DEPTH — the VEIL_CAP darkness hides the pop at
        // the edge, so no fade/dissolve is needed.
        if (!s.visible) return null;
        // Caption overlay only as the card nears center; 1 at center, 0 by |distance| 0.5.
        const overlayOpacity = overlayOpacityForDistance(s.distance);
        const revealFrame = overlayOpacity >= 0.999 ? centerRevealFrame : 0;
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
            <CarouselCard
              slug={slug}
              building={b}
              overlayOpacity={overlayOpacity}
              revealFrame={revealFrame}
              veilOpacity={s.veilOpacity}
            />
          </div>
        );
      })}
    </div>
  );
};
