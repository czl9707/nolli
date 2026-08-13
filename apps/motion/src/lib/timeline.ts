export const FPS = 45;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
export const WALK_SLOT_S = 4.5;     // per-building slot; total WALK = count × this
export const HOOK_S = 1.5;          // held world-map + title opener
// CTA = "Explore more in" line reveal (1.5s) + Nolli mark/wordmark hold (2.5s).
// The line/lockup split belongs to CtaLockup (the only consumer of the parts);
// only the total is shared with the beat Sequences + camera chain.
export const CTA_S = 1.5 + 2.5;

export const BRAND_FADE_OUT_LEAD_S = 0.4; // map/chrome fade-out lead into CTA

// Card-carousel slide: a punchy 0.5s ease-out snap into center at each slot
// start (decoupled from the camera fly), then the card holds.
export const SNAP_S = 0.5;
export const SNAP_FRAC = SNAP_S / WALK_SLOT_S;

export const secToFrames = (s: number): number => Math.round(s * FPS);

export const SLOT_FRAMES = secToFrames(WALK_SLOT_S);

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const WALK_START = secToFrames(HOOK_S);

export function ctaStart(count: number): number {
  return WALK_START + count * SLOT_FRAMES;
}
export function totalFrames(count: number): number {
  return ctaStart(count) + secToFrames(CTA_S);
}
