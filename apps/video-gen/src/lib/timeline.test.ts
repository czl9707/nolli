import { describe, it, expect } from "vitest";
import {
  HOOK_FRAMES, HOOK_S, SLOT_FRAMES, CTA_S, secToFrames, totalFrames,
} from "./timeline";

describe("timeline", () => {
  it("hook frames derive from seconds", () => {
    expect(HOOK_FRAMES).toBe(secToFrames(HOOK_S));
  });

  it("total = hook + walk + cta", () => {
    const count = 10;
    expect(totalFrames(count)).toBe(
      HOOK_FRAMES + count * SLOT_FRAMES + secToFrames(CTA_S),
    );
  });
});
