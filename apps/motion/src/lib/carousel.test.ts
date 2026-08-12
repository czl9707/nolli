import { describe, it, expect } from "vitest";
import { carouselPosFromWalkFrame } from "./carousel";
import { SLOT_FRAMES, WALK_SLOT_S } from "./timeline";

const COUNT = 9;
const WALK_FRAMES = COUNT * SLOT_FRAMES;

describe("carouselPosFromWalkFrame", () => {
  it("starts at 0 (building 0) at WALK-local frame 0", () => {
    expect(carouselPosFromWalkFrame(0, COUNT)).toBeCloseTo(0, 5);
  });

  it("snaps into center over SNAP_S with ease-out, then holds", () => {
    // SNAP_FRAC is a fraction of a slot; SNAP window in frames = SNAP_FRAC * SLOT_FRAMES.
    // secToFrames(0.5) is the historical snap duration (SNAP_S=0.5s). Confirm SNAP_FRAMES below.
    const slotStart = 2 * SLOT_FRAMES; // entering building index 2
    const entering = carouselPosFromWalkFrame(slotStart, COUNT);
    expect(entering).toBeGreaterThanOrEqual(1);
    expect(entering).toBeLessThan(2);

    const snapFrames = Math.round(0.5 / WALK_SLOT_S * SLOT_FRAMES); // SNAP window in frames
    const snapped = carouselPosFromWalkFrame(slotStart + snapFrames, COUNT);
    expect(snapped).toBeCloseTo(2, 5); // snap done → centered

    // then holds: well past the snap window, still centered on 2
    const held = carouselPosFromWalkFrame(slotStart + snapFrames + 30, COUNT);
    expect(held).toBeCloseTo(2, 5);

    // ease-out front-loaded: at half-snap, past halfway
    const midSnap = carouselPosFromWalkFrame(slotStart + Math.round(snapFrames / 2), COUNT);
    expect(midSnap).toBeGreaterThan(1.5);
    expect(midSnap).toBeLessThan(2);
  });

  it("reaches the last building by end of WALK", () => {
    const end = carouselPosFromWalkFrame(WALK_FRAMES - 1, COUNT);
    expect(end).toBeCloseTo(COUNT - 1, 0);
  });

  it("never goes negative", () => {
    for (let f = 0; f < WALK_FRAMES; f += Math.round(SLOT_FRAMES / 4)) {
      expect(carouselPosFromWalkFrame(f, COUNT)).toBeGreaterThanOrEqual(0);
    }
  });
});
