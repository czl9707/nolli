import { describe, it, expect } from "vitest";
import {
  FPS, SLOT_FRAMES, CTA_S,
  HOOK_S, WALK_START, ctaStart, totalFrames,
} from "./timeline";

describe("timeline", () => {
  const COUNT = 9;
  it("opens on HOOK at frame 0, WALK after HOOK_S", () => {
    expect(WALK_START).toBe(Math.round(HOOK_S * FPS));
  });
  it("derives CTA + total from the HOOK + WALK length", () => {
    expect(ctaStart(COUNT)).toBe(WALK_START + COUNT * SLOT_FRAMES);
    expect(totalFrames(COUNT)).toBe(ctaStart(COUNT) + Math.round(CTA_S * FPS));
  });
  it("scales total length with building count", () => {
    expect(totalFrames(5)).toBeLessThan(totalFrames(9));
    expect(totalFrames(9) - totalFrames(5)).toBe(4 * SLOT_FRAMES);
  });
});
