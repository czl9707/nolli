import { AbsoluteFill } from "remotion";
import { THEME } from "./theme";

export const ReelComposition: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ color: THEME.fg, fontSize: 64 }}>Nolli</div>
    </AbsoluteFill>
  );
};
