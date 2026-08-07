import { Body1, H3 } from "@nolli/ui";

export const Caption: React.FC<{ name: string; year: number; city: string; countryCode: string }> = ({ name, year, city, countryCode }) => (
  <div style={{ padding: "12px 4px", color: "rgb(var(--color-primary-foreground))" }}>
    <H3>{name}</H3>
    <Body1 style={{ color: "rgb(var(--color-secondary-foreground))", marginTop: 4 }}>
      <span style={{ color: "rgb(var(--color-accent-foreground))" }}>{year}</span> · {city}{countryCode ? `, ${countryCode}` : ""}
    </Body1>
  </div>
);
