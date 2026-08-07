import { THEME } from "../theme";

export const Caption: React.FC<{ name: string; year: number; city: string; countryCode: string }> = ({ name, year, city, countryCode }) => (
  <div style={{ padding: "12px 4px", color: THEME.fg }}>
    <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.1 }}>{name}</div>
    <div style={{ fontSize: 16, color: THEME.fgSecondary, marginTop: 4 }}>
      <span style={{ color: THEME.accent, fontWeight: 600 }}>{year}</span> · {city}{countryCode ? `, ${countryCode}` : ""}
    </div>
  </div>
);
