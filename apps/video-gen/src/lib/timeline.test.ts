// apps/video-gen/src/lib/timeline.test.ts
import { describe, it, expect } from "vitest";
import {
  FPS, REEL_W, REEL_H, OPEN_S, INTRO_S, WALK_SLOT_S, END_S, OPEN_EXIT_S,
  OPEN_FRAMES, OPEN_EXIT_FRAMES, INTRO_FRAMES, END_FRAMES, SLOT_FRAMES,
  openExitEnd, walkStart, landFrame, endStart, totalFrames,
} from "./timeline";

describe("square reel timeline", () => {
  it("square canvas, 45fps", () => {
    expect(REEL_W).toBe(1080);
    expect(REEL_H).toBe(1080);
    expect(FPS).toBe(45);
  });

  it("phases: 1.6s open, 1.2s intro, 1.2s slots, 2.5s end", () => {
    expect(OPEN_S).toBe(1.6);
    expect(INTRO_S).toBe(1.2);
    expect(WALK_SLOT_S).toBe(1.2);
    expect(END_S).toBe(2.5);
    expect(SLOT_FRAMES).toBe(54); // 1.2 × 45
    expect(OPEN_FRAMES).toBe(72); // 1.6 × 45
    expect(INTRO_FRAMES).toBe(54);
    expect(END_FRAMES).toBe(113); // round(2.5 × 45) = 112.5 → 113
  });

  it("opening exit: 0.3s, overlaps the intro scaffold", () => {
    expect(OPEN_EXIT_S).toBe(0.3);
    expect(OPEN_EXIT_FRAMES).toBe(14); // round(0.3 × 45) = 13.5 → 14
    expect(openExitEnd()).toBe(OPEN_FRAMES + OPEN_EXIT_FRAMES);
    expect(walkStart()).toBe(openExitEnd() + INTRO_FRAMES);
  });

  it("landings, end start, total", () => {
    expect(landFrame(0)).toBe(walkStart());
    expect(landFrame(3)).toBe(walkStart() + 3 * SLOT_FRAMES);
    expect(endStart(8)).toBe(walkStart() + 8 * SLOT_FRAMES);
    expect(totalFrames(8)).toBe(endStart(8) + END_FRAMES);
  });
});
