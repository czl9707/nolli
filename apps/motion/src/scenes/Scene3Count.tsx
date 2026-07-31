import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PLAYFUL_FAMILY, INTER_FAMILY } from "../fonts";
import type { Manifest } from "../lib/manifest";

export const Scene3Count: React.FC<{ manifest: Manifest; variant: "inter" | "playful" }> = ({
  manifest,
  variant,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const labelFamily = variant === "inter" ? INTER_FAMILY : PLAYFUL_FAMILY;

  const shownCount = Math.round(
    interpolate(frame, [0, 30], [0, manifest.count], { extrapolateRight: "clamp" }),
  );
  const countScale = interpolate(frame, [0, 30], [0.6, 1], { extrapolateRight: "clamp" });
  const labelOpacity = interpolate(frame, [24, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitOpacity = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0b0b",
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div
          style={{
            fontFamily: INTER_FAMILY,
            fontWeight: 700,
            fontSize: 320,
            color: "#fafafa",
            lineHeight: 1,
            transform: `scale(${countScale})`,
          }}
        >
          {shownCount}
        </div>
        <div
          style={{
            fontFamily: labelFamily,
            fontSize: 44,
            color: "#e5e5e5",
            opacity: labelOpacity,
            letterSpacing: 0.5,
          }}
        >
          architectures by {manifest.architect}
        </div>
        <div
          style={{
            fontFamily: INTER_FAMILY,
            fontSize: 28,
            color: "#9a9a9a",
            opacity: taglineOpacity,
            marginTop: 24,
          }}
        >
          added to Nolli
        </div>
      </div>
    </AbsoluteFill>
  );
};
