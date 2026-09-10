// apps/video-gen/src/lib/paper.test.ts
import { describe, it, expect } from "vitest";
import { hashId, jitter, paperClipPath } from "@nolli/ui/paper";

describe("paper primitives", () => {
  it("hashId is deterministic and sign-stable", () => {
    expect(hashId("sanaa-1")).toBe(hashId("sanaa-1"));
    expect(hashId("sanaa-1")).not.toBe(hashId("sanaa-2"));
    expect(Number.isInteger(hashId("sanaa-1"))).toBe(true);
  });

  it("jitter stays in [0, max) and is deterministic", () => {
    for (const seed of [0, 1, -7, 123456]) {
      const v = jitter(seed, 100);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(100);
      expect(v).toBe(jitter(seed, 100));
    }
  });

  it("paperClipPath is a 4-corner polygon with ≤5px insets", () => {
    const p = paperClipPath("sanaa-1");
    expect(p).toMatch(/^polygon\(/);
    expect(p.match(/calc\(100% -/g)).toHaveLength(4);
    for (const px of p.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      expect(Number(px[1])).toBeLessThanOrEqual(5);
    }
    expect(p).toBe(paperClipPath("sanaa-1"));
  });
});
