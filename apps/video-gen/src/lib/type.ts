import type { CSSProperties } from "react";
import { KALAM_NUDGE, NOLLI_WORDMARK_NUDGE, PLAYFUL, SANS, SERIF } from "@nolli/remotion";

/** The reel's type scale — single font authority, no component-local constants.
 *  Poster set: Instrument Serif display (architect name, corner lockup, quote)
 *  over Lato reading text (the app's --font-sans); Kalam for the brand
 *  moments (wordmark + CTA). Every weight is a real shipped weight: Lato and
 *  Kalam load 300/400/700, Instrument Serif only 400 — no role asks for one
 *  a family doesn't have. Font tokens + optical nudges live in @nolli/remotion. */
export type TypeRole = Pick<
  CSSProperties,
  "fontFamily" | "fontSize" | "fontWeight" | "letterSpacing" | "fontStyle" | "position" | "top"
>;

export { SANS, SERIF, PLAYFUL };

/** Poster accent: the landing hero gold. Light reels deepen it for the light
 *  paper ground (4.8:1 on rgb(242 240 235)); dark reels use the landing hero's
 *  own gold on ink (9.4:1 on rgb(21 21 21)). Both set --reel-accent on the
 *  composition root per theme; ACCENT references the var. */
export const ACCENT_LIGHT = "rgb(139 98 14)";
export const ACCENT_DARK = "rgb(227 182 77)";
export const ACCENT = "var(--reel-accent)";

export const REEL_TYPE = {
  ctaLead: { fontFamily: SERIF, fontSize: 60, fontWeight: 400, fontStyle: "italic" },
  // "Nolli" has no descenders, so its ink rides less high than Kalam's
  // em-box average — ink-centroid vs the favicon mark measured 0.08em.
  ctaWordmark: { fontFamily: PLAYFUL, fontSize: 96, fontWeight: 400, ...NOLLI_WORDMARK_NUDGE },
  posterName: { fontFamily: SERIF, fontSize: 56, fontWeight: 400 },
  posterQuote: { fontFamily: SERIF, fontSize: 20, fontWeight: 400, fontStyle: "italic" },
  posterRowNum: { fontFamily: SANS, fontSize: 17, fontWeight: 400 },
  posterRowName: { fontFamily: SANS, fontSize: 20, fontWeight: 400, letterSpacing: "0.01em" },
  posterBrand: { fontFamily: PLAYFUL, fontSize: 34, fontWeight: 400, ...KALAM_NUDGE },
  cornerWorkName: { fontFamily: SERIF, fontSize: 26, fontWeight: 400, fontStyle: "italic" },
  cornerWorkMeta: { fontFamily: SANS, fontSize: 13, fontWeight: 400, letterSpacing: "0.22em" },
  cornerHandle: { fontFamily: SERIF, fontSize: 20, fontWeight: 400, letterSpacing: "0.05em", fontStyle: "italic" },
} as const satisfies Record<string, TypeRole>;
