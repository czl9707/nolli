import { Img, staticFile } from "remotion";
import type { ReelBuilding } from "../lib/config";
import { CARD_W, CARD_H } from "../lib/card-carousel";

// Large + soft so the floating cards read as stacked layers over the near-black bg.
const CARD_SHADOW = "0 36px 80px -20px rgba(0, 0, 0, 0.7)";

/** One carousel card: cover photo with a bg-color depth veil (0 on the focused
 *  card → VEIL_CAP on the outermost). */
export const CarouselCard: React.FC<{
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
