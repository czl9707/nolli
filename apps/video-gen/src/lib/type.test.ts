import { describe, it, expect } from "vitest";
import { REEL_TYPE, PLAYFUL, SANS, SERIF } from "./type";

describe("REEL_TYPE — the family rule, written down", () => {
  it("the handwriting family is exactly the brand moments (wordmark + brand row)", () => {
    const playful = Object.entries(REEL_TYPE).filter(([, r]) => r.fontFamily === PLAYFUL);
    expect(playful.map(([name]) => name)).toEqual(["ctaWordmark", "posterBrand"]);
  });

  it("every playful role carries Kalam's optical nudge", () => {
    for (const [name, role] of Object.entries(REEL_TYPE)) {
      if (role.fontFamily === PLAYFUL) {
        expect(role.position, name).toBe("relative");
        expect(role.top, name).toBeTruthy();
      }
    }
  });

  it("reading text rides the app's sans (--font-sans = Lato)", () => {
    const sans = Object.entries(REEL_TYPE).filter(([, r]) => r.fontFamily === SANS);
    expect(sans.map(([name]) => name)).toEqual(["posterRowNum", "posterRowName", "cornerWorkMeta"]);
  });

  it("every weight is a real shipped weight — Lato/Kalam 300/400/700, Instrument Serif 400", () => {
    for (const [name, role] of Object.entries(REEL_TYPE)) {
      if (role.fontFamily === SERIF) {
        expect(role.fontWeight, name).toBe(400);
      } else {
        expect([300, 400, 700], name).toContain(role.fontWeight);
      }
    }
  });
});
