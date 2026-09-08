import { describe, it, expect } from "vitest";
import { softBlurChar, type Phase } from "./soft-blur-in";

// CHAR_REVEAL_F is an internal constant (8) — the per-char resolve duration.
const REVEAL = 8;

describe("softBlurChar", () => {
  const start: Phase = { when: 5, last: 5 + 4 * 2 + REVEAL, enabled: true }; // 5 chars, stagger 2
  const holdEnd: Phase = { when: 0, last: 0, enabled: false };

  it("char 0: invisible + fully blurred before start.when", () => {
    const s = softBlurChar(0, 0, 5, start, holdEnd);
    expect(s.opacity).toBe(0);
    expect(s.blur).toBe(14);   // ENTRANCE_BLUR_PX
    expect(s.translateY).toBe(14); // ENTRANCE_RISE_PX
  });

  it("char 0 settles exactly at start.when + CHAR_REVEAL_F", () => {
    const s = softBlurChar(start.when + REVEAL, 0, 5, start, holdEnd);
    expect(s.opacity).toBeCloseTo(1, 5);
    expect(s.blur).toBeCloseTo(0, 5);
    expect(s.translateY).toBeCloseTo(0, 5);
  });

  it("KEY INVARIANT: last char (index N-1) settles exactly at start.last", () => {
    const N = 5;
    const before = softBlurChar(start.last - 1, N - 1, N, start, holdEnd);
    const at = softBlurChar(start.last, N - 1, N, start, holdEnd);
    expect(before.opacity).toBeLessThan(1);
    expect(at.opacity).toBeCloseTo(1, 5);
  });

  it("stagger: later chars lag earlier ones at a shared frame", () => {
    const f = start.when + REVEAL; // char 0 just settled
    const c0 = softBlurChar(f, 0, 5, start, holdEnd);
    const c1 = softBlurChar(f, 1, 5, start, holdEnd);
    expect(c0.opacity).toBeCloseTo(1, 5);
    expect(c1.opacity).toBeLessThan(1);
    expect(c1.opacity).toBeGreaterThan(0);
  });

  it("disabled entrance: settled from frame 0 (pIn = 1)", () => {
    const noStart: Phase = { when: 0, last: 0, enabled: false };
    const s = softBlurChar(0, 3, 5, noStart, holdEnd);
    expect(s.opacity).toBeCloseTo(1, 5);
    expect(s.blur).toBeCloseTo(0, 5);
  });

  it("disabled exit (end.enabled=false): holds forever", () => {
    const s = softBlurChar(1000, 0, 5, start, holdEnd);
    expect(s.opacity).toBeCloseTo(1, 5);
    expect(s.blur).toBeCloseTo(0, 5);
  });

  it("enabled exit: opacity→0, blur returns, char rises, over [end.when, end.last]", () => {
    const end: Phase = { when: 20, last: 28, enabled: true }; // 8-frame exit
    const beginning = softBlurChar(20, 0, 5, start, end);
    expect(beginning.opacity).toBeCloseTo(1, 5); // exit just starting
    const gone = softBlurChar(28, 0, 5, start, end);
    expect(gone.opacity).toBeCloseTo(0, 5);
    expect(gone.translateY).toBeLessThan(0); // risen up (negative)
    expect(gone.blur).toBeCloseTo(14, 5);     // ENTRANCE_BLUR_PX
  });

  it("single-char text (charCount=1): resolves over [when, when+CHAR_REVEAL_F], no NaN", () => {
    const s0 = softBlurChar(5, 0, 1, start, holdEnd);
    const sDone = softBlurChar(5 + REVEAL, 0, 1, start, holdEnd);
    expect(s0.opacity).toBe(0);
    expect(sDone.opacity).toBeCloseTo(1, 5);
    expect(Number.isNaN(sDone.opacity)).toBe(false);
  });

  it("too-short window clamps stagger ≥ 0 (chars resolve, not reverse)", () => {
    // last - when < CHAR_REVEAL_F would give negative stagger; clamp to 0.
    const cramped: Phase = { when: 5, last: 5, enabled: true }; // zero-width window
    const c0 = softBlurChar(5 + REVEAL, 0, 3, cramped, holdEnd);
    const c2 = softBlurChar(5 + REVEAL, 2, 3, cramped, holdEnd);
    // All chars share the same [when, when+REVEAL] window (stagger clamped to 0),
    // so char 0 and char 2 are at the same progress.
    expect(c0.opacity).toBeCloseTo(c2.opacity, 5);
    expect(c0.opacity).toBeCloseTo(1, 5);
  });
});
