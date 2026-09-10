import type { CSSProperties } from "react";

/** The reel's type scale — single font authority, no component-local constants.
 *  Poster set: Instrument Serif display (architect name, corner lockup, quote)
 *  over Open Sans reading text; Architects Daughter for the brand moments
 *  (wordmark + CTA). Serif role weights stay at 500 — Instrument Serif ships
 *  only 400 and clamps to it (below 600, so no synthetic bold). */
export type TypeRole = Pick<CSSProperties, "fontFamily" | "fontSize" | "fontWeight" | "letterSpacing" | "fontStyle">;

const SANS = '"Open Sans Variable", sans-serif';
const SERIF = '"Instrument Serif", serif';

export const PLAYFUL = "var(--font-playful)";

/** Poster accent: the landing hero gold, deepened for the light paper ground
 *  (4.8:1 on rgb(242 240 235), AA for the 15px list rows). */
export const ACCENT = "rgb(139 98 14)";

export const REEL_TYPE = {
  ctaLead: { fontFamily: SERIF, fontSize: 60, fontWeight: 400, fontStyle: "italic" },
  ctaWordmark: { fontFamily: PLAYFUL, fontSize: 96, fontWeight: 400 },
  posterName: { fontFamily: SERIF, fontSize: 56, fontWeight: 400 },
  posterQuote: { fontFamily: SERIF, fontSize: 20, fontWeight: 500, fontStyle: "italic" },
  posterRowNum: { fontFamily: SANS, fontSize: 17, fontWeight: 500 },
  posterRowName: { fontFamily: SANS, fontSize: 20, fontWeight: 500, letterSpacing: "0.01em" },
  posterBrand: { fontFamily: PLAYFUL, fontSize: 34, fontWeight: 400 },
  cornerWorkName: { fontFamily: SERIF, fontSize: 26, fontWeight: 500, fontStyle: "italic" },
  cornerWorkMeta: { fontFamily: SANS, fontSize: 13, fontWeight: 500, letterSpacing: "0.22em" },
  cornerHandle: { fontFamily: SERIF, fontSize: 20, fontWeight: 500, letterSpacing: "0.05em", fontStyle: "italic" },
} as const satisfies Record<string, TypeRole>;
