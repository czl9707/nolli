import { outroDuration } from "./outro";

export const FPS = 30;
/** Frames per still in Scene 1 (0.5s + margin) */
export const STILL_FRAMES = 18;
/** Fixed budget for Scene 2 */
export const scene2Duration = 150; // 5s — b-roll map interaction + morph window

export const scene1Duration = (stillCount: number) => STILL_FRAMES * stillCount;

// Outro length depends on content (architect name length, count digits), so
// scene3Duration is a function of the manifest's name+count.
type OutroShape = { architect: string; count: number };
export const scene3Duration = (manifest: OutroShape) => outroDuration(manifest);

export const totalDuration = (stillCount: number, hasMorph: boolean, manifest: OutroShape) =>
  scene1Duration(stillCount) + (hasMorph ? scene2Duration : 0) + scene3Duration(manifest);
