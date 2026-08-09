import { Img, staticFile } from "remotion";
import { Caption } from "@nolli/ui";
import type { ReelBuilding } from "../lib/config";

type Variant = "establish" | "walk";

const COVER: Record<Variant, number> = { establish: 104, walk: 60 };
const SLOT = 20; // each slot is 20% of the container width → 5 visible

/**
 * Full-width carousel timeline. Every building is laid out on a horizontal
 * track; the track is translated so the focused one (continuous `position`,
 * fractional during a fly) sits in the center slot. As `position` advances the
 * items roll left like a carousel. The center item is enlarged + accented; edge
 * items fade out. A dot sits on a baseline above each square cover + year.
 */
export const Timeline: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  /** Continuous (fractional) focused index — drives the roll. */
  position: number;
  variant: Variant;
}> = ({ slug, buildings, position, variant }) => {
  const cover = COVER[variant];
  return (
    <div style={{ position: "relative", width: "100%", height: cover + 56, overflow: "hidden" }}>
      {/* baseline the dots rest on */}
      <div
        style={{
          position: "absolute",
          top: 5,
          left: "10%",
          right: "10%",
          height: 1,
          background: "rgb(var(--color-secondary-foreground))",
          opacity: 0.35,
        }}
      />
      {buildings.map((b, i) => {
        const dist = Math.abs(i - position);
        if (dist > 3) return null; // off-screen
        const left = (i - position + 2) * SLOT; // center slot = 40%..60%
        const focus = Math.max(0, 1 - dist); // 1 at center → 0 at edges
        const scale = 1 + 0.45 * focus;
        const opacity = 0.3 + 0.7 * focus;
        const isCenter = dist < 0.5;
        return (
          <div
            key={b.slug}
            style={{
              position: "absolute",
              top: 0,
              height: "100%",
              width: `${SLOT}%`,
              left: `${left}%`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <div
              style={{
                width: isCenter ? 12 : 8,
                height: isCenter ? 12 : 8,
                borderRadius: "50%",
                background: isCenter
                  ? "rgb(var(--color-accent-foreground))"
                  : "rgb(var(--color-secondary-foreground))",
              }}
            />
            <div
              style={{
                width: cover,
                height: cover,
                borderRadius: "var(--size-border-radius)",
                overflow: "hidden",
                outline: isCenter ? "2px solid rgb(var(--color-accent-foreground))" : "none",
              }}
            >
              <Img
                src={staticFile(`capture/${slug}/images/${b.slug}-thumb.jpg`)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <Caption
              style={{
                color: isCenter
                  ? "rgb(var(--color-accent-foreground))"
                  : "rgb(var(--color-secondary-foreground))",
              }}
            >
              {b.year}
            </Caption>
          </div>
        );
      })}
    </div>
  );
};
