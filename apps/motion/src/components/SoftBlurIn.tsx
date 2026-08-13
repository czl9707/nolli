import { useCurrentFrame } from "remotion";
import { softBlurChar, type Phase } from "../lib/text-anim";

/** Per-character soft-blur reveal (entrance) with an optional blur-out-up exit.
 *  Reads its own `useCurrentFrame()` — every caller renders inside a `<Sequence>`,
 *  so the local frame is the right clock. Timing is two `Phase` objects
 *  (`start` = entrance, `end` = exit); typography (fontSize / fontWeight /
 *  fontFamily / color / textAlign / …) travels via `style`, merged last. */
export const SoftBlurIn: React.FC<{
  text: string;
  start: Phase;
  end: Phase;
  style?: React.CSSProperties;
}> = ({ text, start, end, style }) => {
  const frame = useCurrentFrame();

  // Group into word / whitespace tokens so the text wraps at word boundaries.
  // Each char-span is an atomic inline box; without word grouping a long word
  // could split mid-word when the layout wraps. Words render as nowrap groups of
  // char-spans; whitespace tokens are inline pre spacers that preserve width.
  const chars = [...text];
  const tokens: { kind: "word" | "space"; text: string; start: number }[] = [];
  let i = 0;
  while (i < chars.length) {
    const isSpace = /\s/.test(chars[i]);
    let j = i;
    while (j < chars.length && /\s/.test(chars[j]) === isSpace) j++;
    tokens.push({ kind: isSpace ? "space" : "word", text: chars.slice(i, j).join(""), start: i });
    i = j;
  }

  return (
    <span style={{ display: "inline-block", lineHeight: 1.1, ...style }}>
      {tokens.map((tok, ti) => {
        if (tok.kind === "space") {
          // Whitespace between words. Rendered as plain collapsible inline text
          // (NOT an inline-block box): an inline-block space is an atomic box
          // that CSS won't strip at a line-wrap boundary, so any wrap that
          // lands the space at the start of line 2 would show a visible leading
          // indent (e.g. "New Museum of Contemporary Art" → line 2 " Art").
          // The per-char animation only animates word chars, so the space needs
          // no char spans — a normal text node lets the browser collapse it at
          // line edges and preserve its full width between words.
          return (
            <span key={ti}>{tok.text}</span>
          );
        }
        return (
          <span key={ti} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {[...tok.text].map((ch, ci) => {
              const charIndex = tok.start + ci; // absolute index across the whole text
              const { opacity, blur: blurPx, translateY } = softBlurChar(frame, charIndex, chars.length, start, end);
              return (
                <span
                  key={ci}
                  style={{
                    display: "inline-block",
                    opacity,
                    // Snap transform + blur to whole pixels. Fractional-pixel
                    // translateY re-antialiases glyphs to different rows every
                    // frame → reads as a constant vertical "shake" during the
                    // reveal. Integer snapping keeps the motion stable.
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
