// Shrink a text card so long strings fit one line: measured against the real
// face via canvas (call after fonts-ready so metrics are final) and clamped to
// the given width. Short strings measure under the cap and keep their size.
let measureCtx: CanvasRenderingContext2D | null = null;

/** Resolve a `var(--…)` reference to its computed value. The font vars are
 *  declared on body (packages/ui global.css), not :root. */
export const cssFontVar = (varRef: string): string =>
  typeof document === "undefined" || !document.body
    ? ""
    : getComputedStyle(document.body).getPropertyValue(varRef.slice(4, -1)).trim();

export const fitTextSize = (
  text: string,
  size: number,
  cssFontFamily: string,
  maxWidth: number,
  minSize: number,
): number => {
  if (typeof document === "undefined") return size;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return size;
  measureCtx.font = `400 ${size}px ${cssFontFamily}`;
  const width = measureCtx.measureText(text).width;
  return width > maxWidth
    ? Math.max(minSize, Math.floor((size * maxWidth) / width))
    : size;
};
