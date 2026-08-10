import { carouselCard, overlayOpacityForDistance } from "../lib/card-carousel";
import type { ReelBuilding } from "../lib/config";
import { CarouselCard } from "./CarouselCard";

/**
 * Vertical cyclic carousel of building cards. The fractional `position` is
 * dead-center; cards within CARD_WINDOW render stacked above/below, receding in
 * scale + opacity (0 at CARD_FALLOFF), and wrap cyclically. Only the card at
 * center carries the caption overlay (fading in over the last half-step of
 * approach); `centerRevealFrame` drives its name reveal.
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
        if (!s.visible || s.opacity <= 0.001) return null;
        // Overlay only as the card nears center; 1 at center, 0 by |distance| 0.5.
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
              opacity: s.opacity,
              zIndex: s.zIndex,
            }}
          >
            <CarouselCard
              slug={slug}
              building={b}
              overlayOpacity={overlayOpacity}
              revealFrame={revealFrame}
            />
          </div>
        );
      })}
    </div>
  );
};
