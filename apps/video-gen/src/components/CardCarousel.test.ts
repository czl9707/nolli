import { describe, it, expect } from "vitest";
import {
  cyclicDistance, carouselCard, carouselPosFromWalkFrame,
  CARD_W, CARD_H, CARD_PITCH, CARD_DEPTH, VEIL_CAP,
} from "./CardCarousel";
import { SLOT_FRAMES, WALK_SLOT_S } from "../lib/timeline";

const COUNT = 9;
const WALK_FRAMES = COUNT * SLOT_FRAMES;

describe("cyclicDistance", () => {
  it("is 0 at the focused index", () => {
    expect(cyclicDistance(3, 3, COUNT)).toBe(0);
  });
  it("is positive for an index below the focus (upcoming, enters from bottom)", () => {
    expect(cyclicDistance(2, 0, COUNT)).toBeCloseTo(2, 5);
  });
  it("wraps the last card to just below the first (cyclic)", () => {
    // focus on last (8): card 0 is one step forward → +1
    expect(cyclicDistance(0, 8, COUNT)).toBeCloseTo(1, 5);
  });
  it("wraps the first card's predecessor to just above (negative)", () => {
    // focus on 1: card 8 is two steps back → -2
    expect(cyclicDistance(8, 1, COUNT)).toBeCloseTo(-2, 5);
  });
  it("handles a fractional focused position (the continuous-slide path)", () => {
    expect(cyclicDistance(0, 0.5, COUNT)).toBeCloseTo(-0.5, 5);
  });
});

describe("carouselCard", () => {
  it("centered card is full scale, no offset, top z-index, no veil", () => {
    const s = carouselCard(3, 3, COUNT);
    expect(s.scale).toBe(1);
    expect(s.offsetY).toBe(0);
    expect(s.zIndex).toBe(100);
    expect(s.visible).toBe(true);
    expect(s.veilOpacity).toBe(0);
  });
  it("veil darkens with depth, capping at VEIL_CAP on the outermost card", () => {
    expect(carouselCard(4, 3, COUNT).veilOpacity).toBeCloseTo(VEIL_CAP / 2, 5); // |d|=1 → half cap
    expect(carouselCard(5, 3, COUNT).veilOpacity).toBeCloseTo(VEIL_CAP, 5);     // |d|=2 → cap
  });
  it("offset uses diminishing pitch: 2nd card one step, 3rd card only half a step more", () => {
    const first = carouselCard(4, 3, COUNT);  // |d|=1 → one CARD_PITCH step
    const second = carouselCard(5, 3, COUNT); // |d|=2 → 1.5× CARD_PITCH (half step more)
    expect(first.offsetY).toBe(CARD_PITCH);
    expect(second.offsetY).toBe(CARD_PITCH * 1.5);
  });
  it("offsetY is negative above center, positive below", () => {
    expect(carouselCard(2, 3, COUNT).offsetY).toBe(-CARD_PITCH); // d=-1
    expect(carouselCard(4, 3, COUNT).offsetY).toBe(CARD_PITCH);  // d=+1
  });
  it("is visible up to CARD_DEPTH, culled beyond (no dissolve)", () => {
    expect(carouselCard(5, 3, COUNT).visible).toBe(true);  // |d|=2 = outermost
    expect(carouselCard(6, 3, COUNT).visible).toBe(false); // |d|=3 → culled
  });
  it("exposes the 4:5 card geometry at ~70% canvas height", () => {
    expect(CARD_W).toBe(608);
    expect(CARD_H).toBe(760);
    expect(CARD_W / CARD_H).toBeCloseTo(4 / 5, 3);
    expect(CARD_H / 1080).toBeGreaterThanOrEqual(0.7);
    expect(CARD_DEPTH).toBe(2);
  });
});

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
