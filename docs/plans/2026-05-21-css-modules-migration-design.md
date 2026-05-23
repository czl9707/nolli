# CSS Modules Migration Design

Migrate from Tailwind CSS + shadcn/ui to vanilla CSS modules, following the patterns established in zane-portfolio.

## 1. Package Changes

### Remove
- `tailwindcss`, `@tailwindcss/postcss` (dev)
- `tw-animate-css`
- `shadcn`
- `class-variance-authority` (CVA)
- `tailwind-merge`
- `clsx`
- `prettier-plugin-tailwindcss` (dev)

### Add (dev)
- `@csstools/postcss-global-data`
- `postcss-custom-media`
- `postcss-custom-properties`

### Remove (files/config)
- `components.json` (shadcn config)
- `src/index.css` (replaced by `src/styles/global.css`)
- `src/lib/utils.ts` (the `cn()` helper)

## 2. Build Config

### postcss.config.mjs
Rewrite to match zane-portfolio's PostCSS setup:
- `@csstools/postcss-global-data` pointing to `src/styles/global.css`
- `postcss-custom-properties` with `preserve: false`
- `postcss-custom-media` with `preserve: false`

### vite.config.ts
- Remove `@tailwindcss/postcss` import and the `css.postcss.plugins` config
- Vite handles CSS modules natively (`.module.css`) — no extra plugin needed

### index.html
- Remove `class="w-screen h-screen"` from `<body>`
- Move those base styles to global CSS

## 3. Global CSS & Design Tokens

Create `src/styles/global.css` following zane-portfolio's pattern.

### Reset
Standard CSS resets for `a`, `menu`, `ol`, `ul`, `blockquote`, `pre`, `code`, `p`, `h1`-`h6`, `span`.

### Spacing Tokens
```
--spacing-block: 12rem
--spacing-group: 4rem
--spacing-component: 2.5rem
--spacing-paragraph: 1rem
```

### Breakpoint Tokens
```
--breakpoint-xs: 450px
--breakpoint-sm: 720px
--breakpoint-md: 1080px
--breakpoint-lg: 1440px
```

### Typography Tokens
```
--typography-body1-* (Geist Mono, 400, 1rem, 1.5)
--typography-heading-* (Architects Daughter, 400, varies)
```

### Transition Tokens
```
--transition-short: .3s
--transition-long: .9s
```

### Color Tokens
Light (default) and dark (`body[data-theme='dark']`) overrides:
```
--color-primary-background
--color-secondary-background
--color-primary-foreground
--color-secondary-foreground
--color-accent-foreground
--color-accent-background
```

### Custom Media
```
@custom-media --smaller-than-xs (max-width: 450px)
@custom-media --larger-than-xs (min-width: 450px)
... etc
```

Color values adapted from current shadcn palette to the zane-portfolio naming scheme.

## 4. Theme System

### Switch from `.dark` class to `data-theme` attribute
- `use-theme.ts`: Change `applyTheme()` to set `document.body.dataset.theme = resolved` (and remove `light`/`dark` classes from `<html>`)
- `map.tsx` (UI component): Update `getDocumentTheme()` to check `document.body.dataset.theme`
- `map.tsx` (page component): Update MutationObserver to watch `body` attributes instead of `<html>` classes
- `theme-toggle.tsx`: Update dark mode CSS selectors from `dark:` to `body[data-theme='dark']` in the CSS module

## 5. Component CSS Modules

### Layout Components
- `src/components/layout/header.module.css`
- `src/components/layout/footer.module.css`
- `src/components/layout/portfolio-item.module.css`
- `src/components/layout/theme-toggle.module.css`

### Button Component
- `src/components/ui/button.module.css`
- Full variant/size support via `data-variant` and `data-size` CSS attribute selectors
- Example: `[data-variant='ghost'][data-size='icon'] { ... }`

### Map UI Component (split into 3 modules)
- `src/components/ui/map.module.css` — Map container, DefaultLoader, loading dots
- `src/components/ui/map-controls.module.css` — ControlGroup, ControlButton, CompassButton, position classes
- `src/components/ui/map-markers.module.css` — MarkerContent, MarkerPopup, MarkerTooltip, MarkerLabel, PopupCloseButton, DefaultMarkerIcon

### Page-Level
- `src/components/map.module.css` — MapWrapper layout (flex containers, borders, transitions)

### App-Level
- `src/vite-app.module.css` — AppContainer layout modes

## 6. Key Conversion Patterns

### className composition
```
// Before
className={cn("a b", condition && "c")}

// After
className={`${styles.a} ${condition ? styles.c : ""}`}
```

### Tailwind utilities → CSS custom properties
```
// Before: bg-background text-foreground
// After in CSS:
background-color: var(--color-primary-background);
color: var(--color-primary-foreground);
```

### Dark mode variants
```
// Before: dark:hover:bg-accent/40
// After in CSS:
body[data-theme='dark'] .controlButton:hover {
  background-color: rgb(var(--color-accent-background) / 0.4);
}
```

### Animations
```
// Before: animate-pulse, animate-spin, animate-in
// After: custom @keyframes in CSS modules
```

### Portal components
CSS module classes are imported and passed through `createPortal()` calls normally — the class names are just strings at runtime.

## 7. Execution Order

1. PostCSS & build config
2. Create `src/styles/global.css`, remove old `src/index.css`, update `main.tsx` import
3. Update `index.html`
4. Update `use-theme.ts` (data-theme on body)
5. Delete `src/lib/utils.ts`, remove all `cn()` imports
6. Migrate components in order:
   - Layout: header, footer, portfolio-item, theme-toggle
   - UI: button
   - UI: map (controls, markers, main map)
   - Page: map wrapper
   - App: vite-app
7. Uninstall old packages
8. Cleanup: delete `components.json`, verify no dangling imports

## 8. Risk Areas

- `map.tsx` UI uses `createPortal` — CSS module class names (strings) pass through portals fine
- `cn()` is used everywhere — must verify every call site is converted
- Tailwind `animate-*` classes need custom `@keyframes` replacements
- The map component's theme detection watches `<html>` class changes — must update to watch `body[data-theme]`
