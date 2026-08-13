import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { softBlurChar, type Phase } from "../lib/text-anim";

/** Per-character soft-blur reveal (entrance) with an optional blur-out-up exit.
 *  `start`/`end` are the entrance/exit `Phase`s; typography travels via `style`. */
export const SoftBlurIn: React.FC<{
  text: string;
  start: Phase;
  end: Phase;
  style?: React.CSSProperties;
}> = ({ text, start, end, style }) => {
  const frame = useCurrentFrame();
  const chars = useMemo(() => [...text], [text]);

  // Group into word / whitespace tokens so text wraps at word boundaries rather
  // than mid-word. Whitespace tokens render as plain collapsible text nodes (an
  // inline-block space wouldn't strip at a wrap boundary → leading indent on
  // line 2).
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
                    // Snap to whole pixels — fractional-pixel translateY
                    // re-antialiases glyphs to different rows every frame → a
                    // constant vertical "shake" during the reveal.
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
