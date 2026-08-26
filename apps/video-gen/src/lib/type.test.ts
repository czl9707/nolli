import { describe, it, expect } from "vitest";
import { REEL_TYPE, PLAYFUL, MIN_WEIGHT, MAX_WEIGHT } from "./type";

describe("REEL_TYPE — the two-family rule, written down", () => {
  it("the handwriting family is exactly the display roles", () => {
    const playful = Object.entries(REEL_TYPE).filter(([, r]) => r.fontFamily === PLAYFUL);
    expect(playful.map(([name]) => name)).toEqual(["hookName", "hookYears", "walkTitle", "ctaWordmark"]);
  });

  it("every weight is a real variable-font weight (no synthetic bold)", () => {
    for (const [name, role] of Object.entries(REEL_TYPE)) {
      expect(role.fontWeight, name).toBeGreaterThanOrEqual(MIN_WEIGHT);
      expect(role.fontWeight, name).toBeLessThanOrEqual(MAX_WEIGHT);
    }
  });

  it("ctaWordmark sits on Architects Daughter's only real weight (400)", () => {
    expect(REEL_TYPE.ctaWordmark.fontWeight).toBe(400);
  });
});
