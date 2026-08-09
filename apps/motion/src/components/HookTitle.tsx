import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { H1 } from "@nolli/ui";
import { FPS, HOOK_S } from "../lib/timeline";

/** HOOK beat: dark screen, just the architect name. */
export const HookTitle: React.FC<{ architect: string }> = ({ architect }) => {
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
      style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity }}
    >
      <H1 style={{ color: "rgb(var(--color-primary-foreground))", fontSize: 144, letterSpacing: -3, margin: 0 }}>
        {architect}
      </H1>
    </AbsoluteFill>
  );
};
