import { Img, staticFile } from "remotion";
import { Body1, H3 } from "@nolli/ui";
import { SoftBlurIn } from "./SoftBlurIn";
import type { ReelBuilding } from "../lib/config";
import { CARD_W, CARD_H } from "../lib/card-carousel";

const FG = "rgb(var(--color-paper-background))"; // caption text over scrim (dark reel → near-black on light scrim)

const NAME_REVEAL_F = 6;
const NAME_STAGGER_F = 1;
const CAPTION_INSET = 28;

/**
 * One carousel card: cover photo with an optional bottom caption overlay
 * (summary-card style — bottom-up scrim + name + year·city). The overlay fades
 * in by `overlayOpacity` as the card approaches center; only the centered card
 * carries the name, revealed via SoftBlurIn using `revealFrame` (frames since
 * center-crossing). Non-centered cards render the cover only.
 */
export const CarouselCard: React.FC<{
  slug: string;
  building: ReelBuilding;
  overlayOpacity: number;
  revealFrame: number;
}> = ({ slug, building, overlayOpacity, revealFrame }) => {
  const showOverlay = overlayOpacity > 0.001;
  return (
    <div
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        borderRadius: "var(--size-border-radius)",
        overflow: "hidden",
        lineHeight: 0,
        backgroundColor: "rgb(var(--color-secondary-background))",
      }}
    >
      <Img
        src={staticFile(`capture/${slug}/images/${building.slug}-hero.jpg`)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {showOverlay ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: overlayOpacity,
              background:
                "linear-gradient(to top, rgb(var(--color-paper-foreground) / 0.6) 0%, transparent 75%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: CAPTION_INSET,
              right: CAPTION_INSET,
              bottom: CAPTION_INSET,
              color: FG,
              opacity: overlayOpacity,
              pointerEvents: "none",
              lineHeight: 1.1,
            }}
          >
            <H3 style={{ margin: 0 }}>
              <SoftBlurIn
                text={building.name}
                frame={revealFrame}
                revealF={NAME_REVEAL_F}
                staggerF={NAME_STAGGER_F}
                color={FG}
              />
            </H3>
            <Body1 style={{ marginTop: 6, color: FG }}>
              <span style={{ color: "rgb(var(--color-accent-foreground))" }}>{building.year}</span>
              {" · "}
              {building.city}
              {building.countryCode ? `, ${building.countryCode}` : ""}
            </Body1>
          </div>
        </>
      ) : null}
    </div>
  );
};
