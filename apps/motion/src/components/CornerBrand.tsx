const FG = "rgb(var(--color-primary-foreground))";
const FG2 = "rgb(var(--color-secondary-foreground))";

/** Persistent corner branding overlaid through WALK: architect name top-left,
 *  "@nolli.map" handle top-right. Fades with the shared chrome opacity. The
 *  parent positions this row (top strip, PAD-inset). */
export const CornerBrand: React.FC<{ architect: string; opacity: number }> = ({ architect, opacity }) => (
  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity }}>
    <span style={{ fontFamily: "var(--font-playful)", fontWeight: 500, fontSize: 22, color: FG, lineHeight: 1 }}>
      {architect}
    </span>
    <span style={{ fontSize: 16, letterSpacing: "0.04em", color: FG2, lineHeight: 1 }}>
      @nolli.map
    </span>
  </div>
);
