import { carouselCard } from "../lib/card-carousel";
import type { ReelBuilding } from "../lib/config";
import { CarouselCard } from "./CarouselCard";

/**
 * Vertical cyclic carousel of building cards — a receding coverflow stack. The
 * fractional `position` is dead-center; cards within CARD_DEPTH render stacked
 * above/below with diminishing pitch (perspective compression) and a bg-color
 * veil that darkens with depth (capping at VEIL_CAP) for a 3D feel. Beyond
 * CARD_DEPTH cards are hard-culled — the veil darkness hides the pop, so no
 * dissolve is needed. Cards are cover-only; the caption lives off-card.
 */
export const CardCarousel: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  position: number;
}> = ({ slug, buildings, position }) => {
  const count = buildings.length;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {buildings.map((b, i) => {
        const s = carouselCard(i, position, count);
        // Hard cull beyond CARD_DEPTH — the VEIL_CAP darkness hides the pop at
        // the edge, so no fade/dissolve is needed.
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
