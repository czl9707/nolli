// apps/video-gen/src/components/grid/CardWalk.test.ts
import { describe, expect, it } from "vitest";
import { FPS, INTRO_FRAMES, SLOT_FRAMES, OPEN_FRAMES, OPEN_EXIT_FRAMES, openExitEnd, landFrame } from "@/lib/timeline";
import { LIFT_F, OPEN_SCALE, openingAnim, pinAnim, pinWindow } from "./CardWalk";

describe("pinWindow", () => {
  it("spans one slot, extended by the lift-out overlap", () => {
    expect(pinWindow(0, 10)).toEqual([landFrame(0), landFrame(1) + LIFT_F]);
  });
  it("last pin never exits", () => {
    expect(pinWindow(9, 10)[1]).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("openingAnim", () => {
  it("all-cards collage: steady through the hold, gone after the exit", () => {
    expect(openingAnim(0)).toEqual({ scale: OPEN_SCALE, opacity: 1 });
    expect(openingAnim(OPEN_FRAMES - 1)).toEqual({ scale: OPEN_SCALE, opacity: 1 });
    expect(openingAnim(openExitEnd()).opacity).toBe(0);
  });
  it("exit recedes slightly while fading", () => {
    const mid = OPEN_FRAMES + Math.round(OPEN_EXIT_FRAMES / 2);
    const a = openingAnim(mid);
    expect(a.opacity).toBeGreaterThan(0);
    expect(a.opacity).toBeLessThan(1);
    expect(a.scale).toBeLessThan(OPEN_SCALE);
  });
});

describe("pinAnim", () => {
  it("hidden before its slot and after its window", () => {
    expect(pinAnim(landFrame(0) - 1, 0, 10).opacity).toBe(0);
    expect(pinAnim(landFrame(1) + LIFT_F, 0, 10).opacity).toBe(0);
  });
  it("fully visible mid-slot", () => {
    const mid = landFrame(2) + Math.round(SLOT_FRAMES / 2);
    const a = pinAnim(mid, 2, 10);
    expect(a.opacity).toBe(1);
    expect(a.scale).toBeCloseTo(1, 2);
  });
  it("exits at the next boundary: scale recedes, opacity falls", () => {
    const b = landFrame(1);
    const early = pinAnim(b, 0, 10);
    const late = pinAnim(b + LIFT_F - 1, 0, 10);
    expect(late.scale).toBeLessThan(early.scale);
    expect(late.opacity).toBeLessThan(early.opacity);
  });
  it("drop-in starts small", () => {
    const a = pinAnim(landFrame(1), 1, 10);
    expect(a.scale).toBeLessThan(0.8);
    expect(a.opacity).toBeLessThanOrEqual(1);
  });
  it("frames are slot-scale sane", () => {
    expect(SLOT_FRAMES).toBe(Math.round(1.2 * FPS));
    expect(INTRO_FRAMES).toBe(Math.round(1.2 * FPS));
  });
});
