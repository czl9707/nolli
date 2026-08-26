import { REEL_TYPE } from "../lib/type";

const FG = "rgb(var(--color-primary-foreground))";
const FG2 = "rgb(var(--color-secondary-foreground))";

/** Corner chrome through WALK: top = architect name, bottom = @nolli.map. */
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
