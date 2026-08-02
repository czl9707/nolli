export const FPS = 30;
/** Frames per still in Scene 1 (0.5s + margin) */
export const STILL_FRAMES = 18;
/** Fixed budgets for Scenes 2 and 3 */
export const scene2Duration = 150; // 5s — b-roll map interaction + morph window
export const scene3Duration = 120; // 4s

export const scene1Duration = (stillCount: number) => STILL_FRAMES * stillCount;
export const totalDuration = (stillCount: number, hasMorph = true) =>
  scene1Duration(stillCount) + (hasMorph ? scene2Duration : 0) + scene3Duration;
