import { Img, staticFile, interpolate } from "remotion";
import { Body1, H3 } from "@nolli/ui";
import { CLAMP } from "../lib/timeline";
import type { ReelBuilding } from "../lib/config";
import { CARD_W, CARD_H } from "../lib/card-carousel";

// Caption text + scrim use the paper tokens, which are only defined on :root
// (not re-scoped under [data-theme='dark']). So in the forced-dark reel FG
// resolves to light cream and the scrim to near-black — light text on a dark
// scrim, which is what makes the overlay legible over any cover photo.
const FG = "rgb(var(--color-paper-background))";

const NAME_REVEAL_F = 6;
const CAPTION_INSET = 28;
const NAME_FONT_SIZE = 30;   // smaller than H3 default so long names fit/clamp
const NAME_RISE_PX = 8;      // name fades + rises in over NAME_REVEAL_F frames on hold

/**
 * One carousel card: cover photo with an optional bottom caption overlay
 * (summary-card style — bottom-up scrim + name + year·city). The overlay fades
 * in by `overlayOpacity` as the card approaches center; only the centered card
 * carries the name, which fades+rises in over NAME_REVEAL_F frames once it
 * settles (`revealFrame` = frames since center-crossing, 0 on approach). The
 * name wraps and clips at two lines so long names never overflow the card.
 * Non-centered cards render the cover only.
 */
export const CarouselCard: React.FC<{
  slug: string;
  building: ReelBuilding;
  overlayOpacity: number;
  revealFrame: number;
}> = ({ slug, building, overlayOpacity, revealFrame }) => {
  const showOverlay = overlayOpacity > 0.001;
  // Name reveal: fade + rise over NAME_REVEAL_F frames once the card settles (revealFrame 0 on approach).
  const nameT = interpolate(revealFrame, [0, NAME_REVEAL_F], [0, 1], CLAMP);
  const nameOpacity = overlayOpacity * nameT;
  const nameRise = interpolate(revealFrame, [0, NAME_REVEAL_F], [NAME_RISE_PX, 0], CLAMP);
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
            <H3
              style={{
                margin: 0,
                fontSize: NAME_FONT_SIZE,
                lineHeight: 1.2,
                color: FG,
                opacity: nameOpacity,
                transform: `translateY(${nameRise}px)`,
                // Block (not -webkit-box) so the name wraps normally; React strips
                // WebkitBoxOrient from inline styles, which breaks line-clamp. Clip
                // at two lines via max-height instead.
                display: "block",
                maxHeight: NAME_FONT_SIZE * 1.2 * 2,
                overflow: "hidden",
              }}
            >
              {building.name}
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
