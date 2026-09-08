import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";

/** A timed phase of the soft-blur animation (entrance or exit): begins at
 *  `when`, completes at `last`; `enabled: false` skips the phase. */
export type Phase = {
  when: number;
  last: number;
  enabled: boolean;
};

export const NO_ANIM: Phase = { when: 0, last: 0, enabled: false };

export type CharStyle = { opacity: number; blur: number; translateY: number };

// Fixed physics — internal, not call-tunable.
const CHAR_REVEAL_F = 8;
const ENTRANCE_BLUR_PX = 14;
const ENTRANCE_RISE_PX = 14;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Per-char stagger is DERIVED from the entrance window so the last char
 *  settles exactly at `start.last`. Exit is synchronous. */
export function softBlurChar(
  frame: number,
  charIndex: number,
  charCount: number,
  start: Phase,
  end: Phase,
): CharStyle {
  const staggerF = charCount > 1
    ? Math.max(0, (start.last - start.when - CHAR_REVEAL_F) / (charCount - 1))
    : 0;
  const pIn = start.enabled
    ? interpolate(
        frame,
        [start.when + charIndex * staggerF, start.when + charIndex * staggerF + CHAR_REVEAL_F],
        [0, 1],
        CLAMP,
      )
    : 1;
  const pOut = end.enabled
    ? interpolate(frame, [end.when, end.last], [0, 1], CLAMP)
    : 0;

  return {
    opacity: pIn * (1 - pOut),
    blur: ENTRANCE_BLUR_PX * (1 - pIn + pOut),
    translateY: ENTRANCE_RISE_PX * (1 - pIn - pOut),
  };
}

/** Per-character soft-blur reveal (entrance) with optional blur-out-up exit.
 *  Typography travels via `style`. */
export const SoftBlurIn: React.FC<{
  text: string;
  start: Phase;
  end: Phase;
  style?: React.CSSProperties;
}> = ({ text, start, end, style }) => {
  const frame = useCurrentFrame();
  const chars = useMemo(() => [...text], [text]);

  // Word/whitespace tokens so text wraps at word boundaries. Whitespace renders
  // as plain collapsible text nodes — an inline-block space wouldn't strip at
  // a wrap boundary → leading indent on line 2.
  const tokens = useMemo(() => {
    const toks: { kind: "word" | "space"; text: string; start: number }[] = [];
    let i = 0;
    while (i < chars.length) {
      const isSpace = /\s/.test(chars[i]);
      let j = i;
      while (j < chars.length && /\s/.test(chars[j]) === isSpace) j++;
      toks.push({ kind: isSpace ? "space" : "word", text: chars.slice(i, j).join(""), start: i });
      i = j;
    }
    return toks;
  }, [chars]);

  if (!start.enabled && !end.enabled) {
    return <span style={{ display: "inline-block", lineHeight: 1.1, ...style }}>{text}</span>;
  }

  return (
    <span style={{ display: "inline-block", lineHeight: 1.1, ...style }}>
      {tokens.map((tok, ti) => {
        if (tok.kind === "space") {
          return (
            <span key={ti}>{tok.text}</span>
          );
        }
        return (
          <span key={ti} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {[...tok.text].map((ch, ci) => {
              const charIndex = tok.start + ci;
              const { opacity, blur: blurPx, translateY } = softBlurChar(frame, charIndex, chars.length, start, end);
              return (
                <span
                  key={ci}
                  style={{
                    display: "inline-block",
                    opacity,
                    // Whole pixels only — fractional translateY re-antialiases
                    // glyphs to different rows each frame → vertical "shake".
                    filter: blurPx > 0.01 ? `blur(${Math.round(blurPx)}px)` : undefined,
                    transform: `translateY(${Math.round(translateY)}px)`,
                    whiteSpace: "pre",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
};
