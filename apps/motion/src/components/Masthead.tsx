import { THEME } from "../theme";

export const Masthead: React.FC<{ episode: number }> = ({ episode }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "16px 32px", color: THEME.fg }}>
    <span style={{ fontWeight: 700, letterSpacing: "0.04em", fontSize: 22 }}>NOLLI — ON ARCHITECTS</span>
    <span style={{ color: THEME.fgSecondary, fontSize: 14 }}>no. {String(episode).padStart(2, "0")}</span>
  </div>
);
