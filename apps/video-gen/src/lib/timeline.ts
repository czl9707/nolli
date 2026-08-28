export const FPS = 45;

// Composition canvas (Root.tsx <Composition width/height>).
export const REEL_W = 1920;
export const REEL_H = 1080;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
export const WALK_SLOT_S = 2.3;     // per-building slot; total WALK = count × this
// HOOK: marquee opener — two counter-scrolling cover rows flanking the title.
export const HOOK_S = 1.8;
// CTA = "Explore more in" line reveal + Nolli mark/wordmark hold.
export const CTA_LINE_S = 1.5;
export const CTA_LOCKUP_S = 3.5;
export const CTA_S = CTA_LINE_S + CTA_LOCKUP_S;

export const BRAND_FADE_OUT_LEAD_S = 0.4; // map/chrome fade-out lead into CTA

// Card-carousel slide: a punchy 0.5s ease-out snap into center at each slot
// start (decoupled from the camera fly), then the card holds.
export const SNAP_S = 0.5;
export const SNAP_FRAC = SNAP_S / WALK_SLOT_S;

export const secToFrames = (s: number): number => Math.round(s * FPS);

export const SLOT_FRAMES = secToFrames(WALK_SLOT_S);

export const HOOK_FRAMES = secToFrames(HOOK_S);

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function ctaStart(count: number): number {
  return HOOK_FRAMES + count * SLOT_FRAMES;
}
export function totalFrames(count: number): number {
  return ctaStart(count) + secToFrames(CTA_S);
}
