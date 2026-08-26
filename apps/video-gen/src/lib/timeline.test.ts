import { describe, it, expect } from "vitest";
import {
  FPS, INTRO_COUNT, INTRO_IMG_FRAMES, INTRO_FRAMES, WALK_START,
  HOOK_S, SLOT_FRAMES, CTA_S, totalFrames,
} from "./timeline";

describe("timeline", () => {
  it("intro is 5 hard-cut stills of 18 frames", () => {
    expect(INTRO_IMG_FRAMES).toBe(Math.round(0.4 * FPS));
    expect(INTRO_FRAMES).toBe(INTRO_COUNT * INTRO_IMG_FRAMES);
    expect(INTRO_FRAMES).toBe(90);
  });

  it("WALK starts after intro + hook", () => {
    expect(WALK_START).toBe(INTRO_FRAMES + Math.round(HOOK_S * FPS));
  });

  it("total = intro + hook + walk + cta", () => {
    const count = 10;
    expect(totalFrames(count)).toBe(
      INTRO_FRAMES + Math.round(HOOK_S * FPS) + count * SLOT_FRAMES + Math.round(CTA_S * FPS),
    );
  });
});
