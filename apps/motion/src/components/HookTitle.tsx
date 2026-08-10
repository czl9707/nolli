import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { H1 } from "@nolli/ui";
import { HOOK_S, secToFrames, CLAMP } from "../lib/timeline";

const TOTAL = secToFrames(HOOK_S);
const FADE_IN = secToFrames(0.3);
const FADE_OUT_START = TOTAL - secToFrames(0.4);
const OPACITY_RANGE: [number, number, number, number] = [0, FADE_IN, FADE_OUT_START, TOTAL];

/** HOOK beat: dark screen, just the architect name. */
export const HookTitle: React.FC<{ architect: string }> = ({ architect }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, OPACITY_RANGE, [0, 1, 1, 0], CLAMP);
  return (
    <AbsoluteFill
      style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity }}
    >
      <H1 style={{ color: "rgb(var(--color-primary-foreground))", fontSize: 144, letterSpacing: -3, margin: 0 }}>
        {architect}
      </H1>
    </AbsoluteFill>
  );
};
