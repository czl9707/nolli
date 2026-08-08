import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { H1, Body1 } from "@nolli/ui";
import { FPS, HOOK_S } from "../lib/timeline";

/** HOOK beat: dark screen, big title (architect · fromYear–toYear), accent rule. */
export const HookTitle: React.FC<{ architect: string; fromYear: number; toYear: number }> = ({
  architect,
  fromYear,
  toYear,
}) => {
  const frame = useCurrentFrame();
  const total = Math.round(HOOK_S * FPS);
  const fadeIn = Math.round(0.3 * FPS);
  const fadeOutStart = total - Math.round(0.4 * FPS);
  const opacity = interpolate(
    frame,
    [0, fadeIn, fadeOutStart, total],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      data-theme="dark"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <H1 style={{ color: "rgb(var(--color-primary-foreground))", fontSize: 128, letterSpacing: -3, margin: 0 }}>
          {architect}
        </H1>
        <div
          style={{
            width: 140,
            height: 3,
            background: "rgb(var(--color-accent-foreground))",
            margin: "28px auto",
          }}
        />
        <Body1 style={{ color: "rgb(var(--color-secondary-foreground))", fontSize: 34, margin: 0 }}>
          {fromYear} – {toYear}
        </Body1>
      </div>
    </AbsoluteFill>
  );
};
