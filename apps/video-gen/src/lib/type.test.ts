import { describe, it, expect } from "vitest";
import { REEL_TYPE, PLAYFUL } from "./type";

describe("REEL_TYPE — the two-family rule, written down", () => {
  it("the handwriting family is exactly the brand moments (wordmark + CTA)", () => {
    const playful = Object.entries(REEL_TYPE).filter(([, r]) => r.fontFamily === PLAYFUL);
    expect(playful.map(([name]) => name)).toEqual(["ctaWordmark", "posterBrand"]);
  });

  it("every weight is a real variable-font weight (no synthetic bold)", () => {
    // 300–700 = Quicksand Variable's real wght range.
    for (const [name, role] of Object.entries(REEL_TYPE)) {
      expect(role.fontWeight, name).toBeGreaterThanOrEqual(300);
      expect(role.fontWeight, name).toBeLessThanOrEqual(700);
    }
  });

  it("ctaWordmark sits on Architects Daughter's only real weight (400)", () => {
    expect(REEL_TYPE.ctaWordmark.fontWeight).toBe(400);
  });
});
