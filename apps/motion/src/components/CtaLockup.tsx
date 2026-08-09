import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { H1 } from "@nolli/ui";
import { FPS, CTA_LINE_S, CTA_S } from "../lib/timeline";

/**
 * CTA beat. `ctaFrame` is frame-relative-to-CTA-start.
 * Beat 1 (CTA_LINE_S): "Explore more in" fades in then out.
 * Beat 2 (rest): favicon icon + "Nolli" wordmark, held to the end.
 */
export const CtaLockup: React.FC<{ ctaFrame: number }> = ({ ctaFrame }) => {
  const lineEnd = Math.round(CTA_LINE_S * FPS);
  const total = Math.round(CTA_S * FPS);
  const lineOpacity = interpolate(
    ctaFrame,
    [Math.round(0.2 * FPS), Math.round(0.6 * FPS), lineEnd - Math.round(0.3 * FPS), lineEnd],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const lockOpacity = interpolate(
    ctaFrame,
    [lineEnd, lineEnd + Math.round(0.4 * FPS)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      data-theme="dark"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <H1
        style={{
          position: "absolute",
          opacity: ctaFrame < total ? lineOpacity : 0,
          color: "rgb(var(--color-primary-foreground))",
          fontSize: 104,
          margin: 0,
        }}
      >
        Explore more in
      </H1>
      <div
        style={{
          position: "absolute",
          opacity: lockOpacity,
          display: "flex",
          alignItems: "center",
          gap: 22,
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Img src={staticFile("favicon.svg")} style={{ width: 80, height: 80 }} />
        <H1 style={{ color: "rgb(var(--color-primary-foreground))", fontSize: 104, margin: 0 }}>Nolli</H1>
      </div>
    </AbsoluteFill>
  );
};
