import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { H1 } from "@nolli/ui";
import { CTA_LINE_S, CTA_S, secToFrames, CLAMP } from "../lib/timeline";

const LINE_END = secToFrames(CTA_LINE_S);
const TOTAL = secToFrames(CTA_S);
const LINE_FADE = [secToFrames(0.2), secToFrames(0.6), LINE_END - secToFrames(0.3), LINE_END];
const LOCK_FADE: [number, number] = [LINE_END, LINE_END + secToFrames(0.4)];

/**
 * CTA beat. `ctaFrame` is frame-relative-to-CTA-start.
 * Beat 1 (CTA_LINE_S): "Explore more in" fades in then out.
 * Beat 2 (rest): favicon icon + "Nolli" wordmark, held to the end.
 *
 * The favicon renders cream via the document-level forced dark color-scheme
 * (see ReelComposition) — its @media (prefers-color-scheme: dark) branch applies.
 */
export const CtaLockup: React.FC<{ ctaFrame: number }> = ({ ctaFrame }) => {
  const lineOpacity = interpolate(ctaFrame, LINE_FADE, [0, 1, 1, 0], CLAMP);
  const lockOpacity = interpolate(ctaFrame, LOCK_FADE, [0, 1], CLAMP);
  return (
    <AbsoluteFill
      data-theme="dark"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <H1
        style={{
          position: "absolute",
          opacity: ctaFrame < TOTAL ? lineOpacity : 0,
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
