import { REEL_TYPE } from "../lib/type";

const FG = "rgb(var(--color-primary-foreground))";
const FG2 = "rgb(var(--color-secondary-foreground))";

/** Persistent corner brand through WALK on the right (bg) zone. `corner="top"`
 *  = the reel's descriptive title; `corner="bottom"` = the @nolli.map handle.
 *  Both are chrome labels — sans per the two-family rule. */
export const CornerBrand: React.FC<{
  corner: "top" | "bottom";
  title?: string; // top only; the bottom handle ignores it
  opacity: number;
}> = ({ corner, title, opacity }) => {
  if (corner === "top") {
    return (
      <span style={{ ...REEL_TYPE.cornerTitle, color: FG, lineHeight: 1, opacity }}>
        {title}
      </span>
    );
  }
  return (
    <span style={{ ...REEL_TYPE.cornerHandle, color: FG2, lineHeight: 1, opacity }}>
      @nolli.map
    </span>
  );
};
