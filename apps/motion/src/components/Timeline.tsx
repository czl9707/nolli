import { useMemo } from "react";
import { Img, staticFile } from "remotion";
import { Caption } from "@nolli/ui";
import type { ReelBuilding } from "../lib/config";
import { TIMELINE_WINDOW } from "../lib/timeline";

const COVER = 64;
const SLOT = 13; // slot width as % of container — tight pack; focused item centered at 50%
const HALF_WINDOW = TIMELINE_WINDOW / 2; // items beyond this many slots of center are dropped
export const TIMELINE_H = COVER + 88; // vertical chrome around the cover; ReelComposition reserves this much

/**
 * Clean cover-photo carousel. Every building sits on a horizontal track; the
 * track is translated so the focused one (continuous fractional `position`)
 * lands in the center slot. As `position` advances the items roll left like a
 * carousel. The center item is enlarged + accented; items fade out toward the
 * edges by distance from center (5 in view).
 */
export const Timeline: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  /** Continuous (fractional) focused index — drives the roll. */
  position: number;
}> = ({ slug, buildings, position }) => {
  // Thumb URLs are constant per (slug, building) — cache so the per-frame map
  // doesn't re-template + re-resolve ~5 paths every frame.
  const thumbs = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of buildings) m[b.slug] = staticFile(`capture/${slug}/images/${b.slug}-thumb.jpg`);
    return m;
  }, [slug, buildings]);

  return (
    <div style={{ position: "relative", width: "100%", height: TIMELINE_H, overflow: "hidden" }}>
      {buildings.map((b, i) => {
        const dist = Math.abs(i - position);
        if (dist > HALF_WINDOW) return null; // off the 5-wide window
        const left = 50 - SLOT / 2 + (i - position) * SLOT; // focused item pinned to center
        const focus = Math.max(0, 1 - dist / HALF_WINDOW); // 1 at center → 0 at window edge
        const scale = 1 + 0.4 * focus;
        const opacity = focus; // fades fully to 0 at the edge so exits don't pop
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
              justifyContent: "center",
              gap: 8,
              opacity,
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            <div
              style={{
                width: COVER,
                height: COVER,
                borderRadius: "var(--size-border-radius)",
                overflow: "hidden",
                outline: isCenter ? "2px solid rgb(var(--color-accent-foreground))" : "none",
              }}
            >
              <Img
                src={thumbs[b.slug]}
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
