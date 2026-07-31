import { interpolate } from "remotion";

const FADE = 6; // frames
const MAX_SCALE = 1.08;

export function kenBurns(frame: number, durationInFrames: number) {
  const scale = interpolate(frame, [0, durationInFrames], [1, MAX_SCALE], { extrapolateRight: "clamp" });
  const x = interpolate(frame, [0, durationInFrames], [0, -16]);
  const y = interpolate(frame, [0, durationInFrames], [0, -10]);
  const opacity = interpolate(
    frame,
    [0, FADE, durationInFrames - FADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return { scale, x, y, opacity };
}
