import type { CSSProperties } from "react";

/** The reel's type scale — one entry per text role, consumed by the text
 *  components so no component keeps local font constants. Mirrors the app's
 *  two-family rule (#105): Quicksand (sans) for reading text, Architects
 *  Daughter (playful) for the single display moment — the CTA wordmark. */
export type TypeRole = Pick<CSSProperties, "fontFamily" | "fontSize" | "fontWeight" | "letterSpacing">;

const SANS = "var(--font-sans)";
export const PLAYFUL = "var(--font-playful)";

/** Quicksand Variable's real wght range — weights outside it render as
 *  synthetic bold (the class of bug the test guards against). */
export const MIN_WEIGHT = 300;
export const MAX_WEIGHT = 700;

export const REEL_TYPE = {
  hookName: { fontFamily: SANS, fontSize: 108, fontWeight: 700 },
  hookYears: { fontFamily: SANS, fontSize: 48, fontWeight: 300, letterSpacing: "0.05em" },
  captionTitle: { fontFamily: SANS, fontSize: 64, fontWeight: 700 },
  captionMeta: { fontFamily: SANS, fontSize: 28, fontWeight: 500, letterSpacing: "0.02em" },
  walkTitle: { fontFamily: SANS, fontSize: 40, fontWeight: 600 },
  cornerTitle: { fontFamily: SANS, fontSize: 22, fontWeight: 500 },
  cornerHandle: { fontFamily: SANS, fontSize: 16, fontWeight: 500, letterSpacing: "0.04em" },
  ctaLead: { fontFamily: SANS, fontSize: 96, fontWeight: 500 },
  ctaWordmark: { fontFamily: PLAYFUL, fontSize: 96, fontWeight: 400 },
} as const satisfies Record<string, TypeRole>;
