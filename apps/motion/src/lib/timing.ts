import { outroDuration } from "./outro";

export const FPS = 30;
/** Frames per still in Scene 1 (0.5s + margin) */
export const STILL_FRAMES = 18;
/** Fixed fallback budget for Scene 2 (used when no captured clip frame count is known). */
export const scene2Duration = 150;

// The captured morph clip is sped up this much in the final cut. The clip itself
// is recorded at real-time app pace; this only affects playback, so the Sequence
// length (and totalDuration) is the native frame count divided by this rate.
export const MORPH_PLAYBACK_RATE = 2;

/** Effective Scene 2 length: the clip's frame count / playback rate if known, else fallback. */
export const scene2Frames = (frames?: number): number =>
  Math.ceil((frames ?? scene2Duration) / MORPH_PLAYBACK_RATE);

export const scene1Duration = (stillCount: number) => STILL_FRAMES * stillCount;

// Outro length depends on content (architect name length, count digits), so
// scene3Duration is a function of the manifest's name+count.
type OutroShape = { architect: string; count: number };
export const scene3Duration = (manifest: OutroShape) => outroDuration(manifest);

export const totalDuration = (
  stillCount: number,
  hasMorph: boolean,
  manifest: OutroShape & { mapClipFrames?: number },
) =>
  scene1Duration(stillCount) +
  (hasMorph ? scene2Frames(manifest.mapClipFrames) : 0) +
  scene3Duration(manifest);
