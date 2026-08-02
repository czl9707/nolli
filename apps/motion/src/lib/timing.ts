import { outroDuration } from "./outro";

export const FPS = 30;
/** Frames per still in Scene 1 (0.5s + margin) */
export const STILL_FRAMES = 18;
/** Fixed budget for Scene 2 */
export const scene2Duration = 150; // 5s — b-roll map interaction + morph window

export const scene1Duration = (stillCount: number) => STILL_FRAMES * stillCount;

// Outro total (name + count + now + logo) — sourced from lib/outro.ts so the
// segment consts live in one place. Kept as `scene3Duration` for the existing
// totalDuration signature.
export const scene3Duration = outroDuration;

export const totalDuration = (stillCount: number, hasMorph = true) =>
  scene1Duration(stillCount) + (hasMorph ? scene2Duration : 0) + scene3Duration;
