export const FPS = 45;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
export const WALK_SLOT_S = 4.5;     // per-building slot; total WALK = count × this
export const HOOK_S = 1.5;          // held world-map + title opener
// CTA = "Explore more in" line reveal (1.5s) + Nolli mark/wordmark hold (2.5s).
// The line/lockup split belongs to CtaLockup (the only consumer of the parts);
// only the total is shared with the beat Sequences + camera chain.
export const CTA_S = 1.5 + 2.5;

// The reel opens on HOOK: world map (left) + descriptive title (right). Slot 0's
// world→building fly then bridges HOOK→WALK (the title overlays its exit across
// that fly). Corner branding (architect title + @handle) overlays through WALK.
export const BRAND_FADE_OUT_LEAD_S = 0.4; // map/chrome fade-out lead into CTA

// Card-carousel slide: a punchy 0.5s ease-out snap into center at each slot
// start (decoupled from the camera fly), then the card holds.
export const SNAP_S = 0.5;
export const SNAP_FRAC = SNAP_S / WALK_SLOT_S;

/** Seconds → frames. The single source of truth for the S→frame conversion. */
export const secToFrames = (s: number): number => Math.round(s * FPS);

/** Frames in one WALK slot. The single source of truth for per-slot length —
 *  ctaStart and the WALK span both derive from count * SLOT_FRAMES so the
 *  captions <Series> (count slots of SLOT_FRAMES) exactly fills the WALK
 *  <Sequence> with no rounding mismatch. */
export const SLOT_FRAMES = secToFrames(WALK_SLOT_S);

/** Shared clamp options for interpolate() — used wherever a value shouldn't
 *  extrapolate past its domain. */
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// HOOK opens the reel (world map + descriptive title); WALK begins after HOOK_S.
export const WALK_START = secToFrames(HOOK_S);

/** CTA start depends on building count (WALK length scales with it). */
export function ctaStart(count: number): number {
  return WALK_START + count * SLOT_FRAMES;
}
export function totalFrames(count: number): number {
  return ctaStart(count) + secToFrames(CTA_S);
}
