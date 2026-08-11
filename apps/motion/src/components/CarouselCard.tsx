import { Img, staticFile } from "remotion";
import type { ReelBuilding } from "../lib/config";
import { CARD_W, CARD_H } from "../lib/card-carousel";

// Soft drop shadow so the cover-photo cards lift off the bg and read as stacked
// layers (it shows most where cards overlap and at the lower edge). Large + soft
// because the cards float over a near-black bg, where a tight shadow would vanish.
const CARD_SHADOW = "0 36px 80px -20px rgba(0, 0, 0, 0.7)";

/**
 * One carousel card: cover photo with a bg-color veil that grows with distance
 * from center (depth darkening for the coverflow stack; 0 on the focused card,
 * capping at VEIL_CAP on the outermost). Caption text lives off-card now, in the
 * bottom-left BuildingCaption — so non-focused cards are just photos, and the
 * focused card shows its cover unobstructed.
 */
export const CarouselCard: React.FC<{
  slug: string;
  building: ReelBuilding;
  /** bg-color veil over the image, 0 at the focused card → VEIL_CAP at the
   *  outermost. Depth darkening so receding cards read as photos in depth, never
   *  solid black boxes. */
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
