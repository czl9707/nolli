import { describe, it, expect } from "vitest";
import { softBlurChar, SOFT_BLUR_DEFAULTS } from "./text-anim";

describe("softBlurChar", () => {
  it("is invisible + fully blurred before its start", () => {
    const s = softBlurChar(0, 0, { ...SOFT_BLUR_DEFAULTS, start: 5 });
    expect(s.opacity).toBe(0);
    expect(s.blur).toBe(SOFT_BLUR_DEFAULTS.blurPx);
    expect(s.translateY).toBe(SOFT_BLUR_DEFAULTS.risePx);
  });

  it("is fully revealed with no blur/rise once its reveal window closes", () => {
    const { start, revealF } = SOFT_BLUR_DEFAULTS;
    const s = softBlurChar(start + revealF, 0, SOFT_BLUR_DEFAULTS);
    expect(s.opacity).toBeCloseTo(1, 5);
    expect(s.blur).toBeCloseTo(0, 5);
    expect(s.translateY).toBeCloseTo(0, 5);
  });

  it("stagger: later chars lag earlier ones", () => {
    const { start, revealF } = SOFT_BLUR_DEFAULTS;
    const c0 = softBlurChar(start + revealF, 0, SOFT_BLUR_DEFAULTS);
    const c1 = softBlurChar(start + revealF, 1, SOFT_BLUR_DEFAULTS);
    expect(c0.opacity).toBeCloseTo(1, 5);
    expect(c1.opacity).toBeLessThan(1);
    expect(c1.opacity).toBeGreaterThan(0);
  });

  it("exit: opacity → 0, blur returns, and the char rises", () => {
    const opts = { ...SOFT_BLUR_DEFAULTS, exitStart: 20, exitF: 8 };
    const settled = softBlurChar(20, 0, opts); // exit just beginning
    expect(settled.opacity).toBeCloseTo(1, 5);
    const gone = softBlurChar(20 + 8, 0, opts);
    expect(gone.opacity).toBeCloseTo(0, 5);
    expect(gone.translateY).toBeLessThan(0); // risen up (negative)
    expect(gone.blur).toBeCloseTo(opts.blurPx, 5);
  });

  it("exitStart = Infinity ⇒ holds forever (no exit)", () => {
    const opts = { ...SOFT_BLUR_DEFAULTS, exitStart: Infinity };
    const far = softBlurChar(1000, 0, opts);
    expect(far.opacity).toBeCloseTo(1, 5);
    expect(far.blur).toBeCloseTo(0, 5);
  });
});
