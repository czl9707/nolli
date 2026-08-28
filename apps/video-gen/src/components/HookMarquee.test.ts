import { describe, it, expect } from "vitest";
import {
  splitRows, tileRow, marqueeShift, stripCycles,
  ROW_H, HOOK_PITCH, HOOK_IMG_W, HOOK_GAP, TOP_SPEED, BOTTOM_SPEED,
} from "./HookMarquee";
import { REEL_W, REEL_H } from "../lib/timeline";

// Room the two-line hook title needs between the rows.
const MIN_TITLE_BAND_PX = 400;

describe("splitRows", () => {
  it("even indices -> top row, odd -> bottom, order preserved", () => {
    const [top, bottom] = splitRows(["a", "b", "c", "d", "e"]);
    expect(top).toEqual(["a", "c", "e"]);
    expect(bottom).toEqual(["b", "d"]);
  });
  it("handles a single item", () => {
    const [top, bottom] = splitRows(["a"]);
    expect(top).toEqual(["a"]);
    expect(bottom).toEqual([]);
  });
});

describe("tileRow", () => {
  it("length is cycles × row length", () => {
    expect(tileRow(["a", "b", "c"], 2)).toHaveLength(6);
    expect(tileRow(["a"], 4)).toHaveLength(4);
  });
  it("is plain cyclic repetition — the strip repeats with the row's period", () => {
    const row = ["a", "b", "c"];
    const out = tileRow(row, 4);
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBe(row[i % row.length]);
    }
  });
  it("never places identical items adjacent (source >= 2)", () => {
    const out = tileRow(["a", "b", "c"], 3);
    for (let i = 0; i < out.length - 1; i++) {
      expect(out[i]).not.toBe(out[i + 1]);
    }
  });
});

describe("marqueeShift", () => {
  it("is 0 at frame 0 and stays within [-pitch, 0]", () => {
    for (const speed of [TOP_SPEED, -BOTTOM_SPEED]) {
      expect(marqueeShift(0, HOOK_PITCH, speed)).toBe(0);
      for (let f = 0; f <= 200; f++) {
        const s = marqueeShift(f, HOOK_PITCH, speed);
        expect(s).toBeLessThanOrEqual(0);
        expect(s).toBeGreaterThanOrEqual(-HOOK_PITCH);
      }
    }
  });
  it("positive speed scrolls leftward over time", () => {
    const a = marqueeShift(10, HOOK_PITCH, TOP_SPEED);
    const b = marqueeShift(11, HOOK_PITCH, TOP_SPEED);
    expect(b).toBeLessThan(a);
  });
  it("negative speed scrolls rightward over time", () => {
    const a = marqueeShift(10, HOOK_PITCH, -BOTTOM_SPEED);
    const b = marqueeShift(11, HOOK_PITCH, -BOTTOM_SPEED);
    expect(b).toBeGreaterThan(a);
  });
  it("returns to 0 after exactly pitch/speed frames (seamless wrap)", () => {
    const period = HOOK_PITCH / TOP_SPEED;
    expect(marqueeShift(period, HOOK_PITCH, TOP_SPEED)).toBe(0);
  });
});

describe("marquee geometry", () => {
  it("two rows + center band fit the canvas", () => {
    expect(ROW_H * 2).toBeLessThanOrEqual(REEL_H);
    expect(REEL_H - ROW_H * 2).toBeGreaterThanOrEqual(MIN_TITLE_BAND_PX);
  });
  it("rows scroll at different speeds", () => {
    expect(TOP_SPEED).not.toBe(BOTTOM_SPEED);
  });
  it(`stripCycles covers ${REEL_W}px across the whole wrap range`, () => {
    for (const len of [3, 4, 5, 7, 8]) {
      const period = len * HOOK_PITCH;
      const stripW = stripCycles(len) * len * (HOOK_IMG_W + HOOK_GAP) - HOOK_GAP;
      // worst-case shift is a full period back
      expect(stripW - period).toBeGreaterThanOrEqual(REEL_W);
    }
  });
});
