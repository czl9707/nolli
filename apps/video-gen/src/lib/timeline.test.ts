import { describe, it, expect } from "vitest";
import {
  FPS, WALK_START, HOOK_FRAMES, HOOK_S,
  SLOT_FRAMES, CTA_S, totalFrames,
} from "./timeline";

describe("timeline", () => {
  it("hook marquee runs 1.8s", () => {
    expect(HOOK_S).toBe(1.8);
    expect(HOOK_FRAMES).toBe(Math.round(1.8 * FPS));
    expect(HOOK_FRAMES).toBe(81);
  });

  it("WALK starts when the hook ends", () => {
    expect(WALK_START).toBe(HOOK_FRAMES);
  });

  it("CTA runs 5s (1.5s line + 3.5s lockup hold)", () => {
    expect(CTA_S).toBe(5);
  });

  it("total = hook + walk + cta", () => {
    const count = 10;
    expect(totalFrames(count)).toBe(
      HOOK_FRAMES + count * SLOT_FRAMES + Math.round(CTA_S * FPS),
    );
  });
});
