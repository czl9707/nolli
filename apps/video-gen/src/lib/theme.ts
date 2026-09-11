// apps/video-gen/src/lib/theme.ts
/** Reel theme — flips the page (@nolli/ui tokens) and the basemap between the
 *  app's existing light and dark themes. No reel-specific colors. */
export const REEL_THEMES = ["light", "dark"] as const;
export type ReelTheme = (typeof REEL_THEMES)[number];

export const isReelTheme = (v: string): v is ReelTheme =>
  (REEL_THEMES as readonly string[]).includes(v);

/** CLI `--theme` arg → validated ReelTheme; default "light". */
export function parseThemeArg(v: string | undefined): ReelTheme {
  if (v === undefined) return "light";
  if (!isReelTheme(v)) throw new Error(`Unknown theme "${v}" — expected one of: ${REEL_THEMES.join(", ")}`);
  return v;
}
