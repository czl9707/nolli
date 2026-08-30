// Mirrors the dark-theme token values in packages/ui/src/styles/global.css
// (`body[data-theme='dark']`). Remotion renders without a DOM, so the CSS
// custom properties can't be read at render time — the values are mirrored here
// as plain constants. If the design system changes, update both.
export const THEME = {
  bg: "#171717", // --color-primary-background (23 23 23)
  bgSecondary: "#262626", // --color-secondary-background (38 38 38)
  fg: "#ffffff", // --color-primary-foreground (255 255 255)
  fgSecondary: "#b9b9b9", // --color-secondary-foreground (185 185 185)
  accent: "#c0503a", // --color-accent-foreground (192 80 58)
} as const;
