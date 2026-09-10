// apps/video-gen/src/lib/variant.ts
/** Walk-poster variants. `grid` is the landed direction; new poster layouts
 *  join this array and ReelComposition's switch. */
export const WALK_VARIANTS = ["grid"] as const;
export type WalkVariant = (typeof WALK_VARIANTS)[number];

export const isWalkVariant = (v: string): v is WalkVariant =>
  (WALK_VARIANTS as readonly string[]).includes(v);

/** CLI `--variant` arg → validated WalkVariant; default "grid". */
export function parseVariantArg(v: string | undefined): WalkVariant {
  if (v === undefined) return "grid";
  if (!isWalkVariant(v)) throw new Error(`Unknown variant "${v}" — expected one of: ${WALK_VARIANTS.join(", ")}`);
  return v;
}
