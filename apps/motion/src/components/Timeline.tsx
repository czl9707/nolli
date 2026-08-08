import { Img, staticFile } from "remotion";
import { Caption } from "@nolli/ui";
import type { ReelBuilding } from "../lib/config";

/** Sliding window of `windowSize` building indices, active centered. */
export function visibleWindow(args: {
  currentIndex: number;
  count: number;
  windowSize: number;
}): number[] {
  const { currentIndex, count, windowSize } = args;
  if (count <= windowSize) return Array.from({ length: count }, (_, i) => i);
  const half = Math.floor(windowSize / 2);
  let start = currentIndex - half;
  if (start < 0) start = 0;
  if (start + windowSize > count) start = count - windowSize;
  return Array.from({ length: windowSize }, (_, i) => start + i);
}

type Variant = "establish" | "walk";

const SIZES: Record<Variant, { active: number; idle: number }> = {
  establish: { active: 132, idle: 84 },
  walk: { active: 76, idle: 48 },
};

/**
 * Dot baseline + square cover thumbnail + year, sliding window (active centered
 * & enlarged). `variant="establish"` renders large/centered (an AbsoluteFill
 * overlay); `variant="walk"` renders compact for the bottom-left column slot.
 */
export const Timeline: React.FC<{
  slug: string;
  buildings: ReelBuilding[];
  currentIndex: number;
  windowSize: number;
  variant: Variant;
}> = ({ slug, buildings, currentIndex, windowSize, variant }) => {
  const idxs = visibleWindow({ currentIndex, count: buildings.length, windowSize });
  const sizes = SIZES[variant];
  const wrapper: React.CSSProperties =
    variant === "establish"
      ? {
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }
      : { width: "100%" };

  return (
    <div style={wrapper}>
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: variant === "establish" ? 28 : 16 }}>
          {idxs.map((i) => {
            const b = buildings[i];
            const isCurrent = i === currentIndex;
            const size = isCurrent ? sizes.active : sizes.idle;
            return (
              <div
                key={b.slug}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: isCurrent ? 1 : 0.5 }}
              >
                {/* dot on the baseline */}
                <div
                  style={{
                    width: isCurrent ? 12 : 8,
                    height: isCurrent ? 12 : 8,
                    borderRadius: "50%",
                    background: isCurrent ? "rgb(var(--color-accent-foreground))" : "rgb(var(--color-secondary-foreground))",
                  }}
                />
                {/* square cover */}
                <div
                  style={{
                    width: size,
                    height: size,
                    borderRadius: "var(--size-border-radius)",
                    overflow: "hidden",
                    outline: isCurrent ? "2px solid rgb(var(--color-accent-foreground))" : "none",
                  }}
                >
                  <Img
                    src={staticFile(`capture/${slug}/images/${b.slug}-thumb.jpg`)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <Caption style={{ color: isCurrent ? "rgb(var(--color-accent-foreground))" : "rgb(var(--color-secondary-foreground))" }}>
                  {b.year}
                </Caption>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
