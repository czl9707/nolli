import { useCurrentFrame } from "remotion";
import { carouselCard } from "../lib/card-carousel";
import { carouselPosFromWalkFrame } from "../lib/carousel";
import type { ReelBuilding } from "../lib/config";
import { CarouselCard } from "./CarouselCard";

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
