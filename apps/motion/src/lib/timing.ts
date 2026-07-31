export const FPS = 30;
/** Frames per still in Scene 1 (0.5s + margin) */
export const STILL_FRAMES = 18;
/** Fixed budgets for Scenes 2 and 3 */
export const scene2Duration = 180; // 6s
export const scene3Duration = 120; // 4s

export const scene1Duration = (stillCount: number) => STILL_FRAMES * stillCount;
export const totalDuration = (stillCount: number) =>
  scene1Duration(stillCount) + scene2Duration + scene3Duration;
