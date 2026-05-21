# Migrate Next.js to Vite + React SPA

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Next.js with Vite + React as a static SPA, keeping all existing map functionality identical. Express backend wiring comes in a separate plan.

**Architecture:** Bootstrap a fresh Vite project in the same repo. Copy existing components, lib, and styles with minimal changes (remove `"use client"`, replace `next-themes` with a custom hook, replace Next.js font loading with fontsource, move pattern generation to build-time). Delete Next.js artifacts last.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, maplibre-gl, sharp (build-time only)

---

### Task 1: Bootstrap Vite project alongside Next.js

**Files:**
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `tsconfig.vite.json`
- Modify: `package.json`

**Step 1: Install Vite and React plugin**

```bash
npm install -D vite @vitejs/plugin-react
```

**Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/postcss"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
```

**Step 3: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Arch Map</title>
  </head>
  <body class="w-screen h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 4: Create `tsconfig.vite.json`** (separate from Next.js tsconfig so both can coexist during migration)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Step 5: Add Vite scripts to `package.json`**

Add to `"scripts"`:

```json
"dev:vite": "vite",
"build:vite": "vite build",
"preview:vite": "vite preview"
```

**Step 6: Verify Vite boots**

```bash
echo 'export default function App() { return <div>Vite works</div> }' > src/main-test.tsx
```

Temporarily point `index.html` script src to `/src/main-test.tsx`, run `npm run dev:vite`, confirm "Vite works" renders. Then delete `src/main-test.tsx` and restore the script src.

**Step 7: Commit**

```bash
git add vite.config.ts index.html tsconfig.vite.json package.json package-lock.json
git commit -m "chore: bootstrap vite alongside nextjs"
```

---

### Task 2: Create Vite entry point and theme provider

**Files:**
- Create: `src/main.tsx`
- Create: `src/hooks/use-theme.ts`
- Create: `src/vite-app.tsx` (temporary name to avoid collision with Next.js `src/app/page.tsx`)

**Step 1: Create theme hook `src/hooks/use-theme.ts`**

Replaces `next-themes` with a simple implementation that does the same thing: toggles `dark` class on `<html>`, persists to `localStorage`, respects system preference.

```ts
import { useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

function getSystemPreference(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getStoredTheme(): Theme {
  return (localStorage.getItem("theme") as Theme) ?? "system"
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemPreference() : theme
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredTheme())
  )

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem("theme", t)
    const resolved = resolveTheme(t)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        const resolved = getSystemPreference()
        setResolvedTheme(resolved)
        applyTheme(resolved)
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  return { theme, resolvedTheme, setTheme }
}
```

**Step 2: Create `src/main.tsx`**

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/index.css"
import { ViteApp } from "./vite-app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ViteApp />
  </StrictMode>,
)
```

**Step 3: Create `src/vite-app.tsx`**

This is the root layout. Equivalent to Next.js `layout.tsx` + `page.tsx` combined. For now just renders the map page.

```tsx
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MapPage } from "@/pages/map"

export function ViteApp() {
  return (
    <>
      <Header />
      <MapPage />
      <Footer />
    </>
  )
}
```

**Step 4: Commit**

```bash
git add src/main.tsx src/hooks/use-theme.ts src/vite-app.tsx
git commit -m "feat: vite entry point and custom theme hook"
```

---

### Task 3: Copy lib files (no changes needed)

**Files:**
- No modifications needed — these are pure TypeScript with no Next.js deps:
  - `src/lib/map-color.ts`
  - `src/lib/map-style.ts`
  - `src/lib/map-texture/constant.ts`
  - `src/lib/map-texture/water.ts`
  - `src/lib/map-texture/building.ts`
  - `src/lib/map-texture/grass.ts`
  - `src/lib/map-texture/forest.ts`
  - `src/lib/utils.ts`

**Step 1: Verify no Next.js imports exist in lib files**

```bash
grep -r "from \"next" src/lib/ || echo "No Next.js imports in lib — all clean"
```

Expected: "No Next.js imports in lib — all clean"

No action needed. These files are already framework-agnostic.

---

### Task 4: Migrate CSS

**Files:**
- Create: `src/index.css` (copy of `src/app/globals.css` with Next.js imports removed)

**Step 1: Create `src/index.css`**

Copy `src/app/globals.css` and make these changes:
1. Remove `@import "shadcn/tailwind.css";` — not needed with Tailwind v4 + Vite
2. Keep `@import "tailwindcss";` and `@import "tw-animate-css";`
3. Keep `@import "@fontsource/architects-daughter/400.css";`
4. Add `@import "@fontsource/geist-mono/400.css";` (install in Task 6)
5. Keep everything else (custom variant, theme inline, :root, .dark, @layer base)

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "chore: migrate globals.css to vite index.css"
```

---

### Task 5: Migrate components (remove Next.js deps)

**Files:**
- Modify: `src/components/header.tsx` — remove `"use client"`, use `useTheme` from `@/hooks/use-theme`
- Modify: `src/components/theme-provider.tsx` — rewrite using custom `useTheme` hook
- Modify: `src/components/theme-toggle.tsx` — use `useTheme` from `@/hooks/use-theme`
- Modify: `src/components/ui/map.tsx` — remove `"use client"`, remove `typeof document`/`typeof window` guards (Vite is client-only)
- Modify: `src/components/ui/button.tsx` — remove `"use client"` if present

**Step 1: Update `src/components/theme-provider.tsx`**

Replace entirely. Remove `next-themes` dependency. Use the custom hook from Task 2.

```tsx
import { createContext, useContext, type ReactNode } from "react"
import { useTheme, type Theme, type ResolvedTheme } from "@/hooks/use-theme"

const ThemeContext = createContext<{
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (t: Theme) => void
}>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
})

export function useThemeContext() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <ThemeHotkey resolvedTheme={resolvedTheme} setTheme={setTheme} />
      {children}
    </ThemeContext.Provider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey({
  resolvedTheme,
  setTheme,
}: {
  resolvedTheme: ResolvedTheme
  setTheme: (t: Theme) => void
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])

  return null
}
```

Note: Add `import { useEffect } from "react"` to the imports.

**Step 2: Update `src/components/theme-toggle.tsx`**

Replace `useTheme` from `next-themes` with `useThemeContext` from the new provider.

```tsx
import { Moon, Sun } from "lucide-react"
import { useThemeContext } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeContext()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

**Step 3: Update `src/components/header.tsx`**

No changes needed beyond removing `"use client"` if present. It already only imports from `@/components/theme-toggle`.

**Step 4: Update `src/components/ui/map.tsx`**

1. Remove `"use client";` line
2. Remove all `typeof document === "undefined"` and `typeof window === "undefined"` guards — they always return `false` in a SPA
3. In `getDocumentTheme()`: remove the `if (typeof document === "undefined") return null;` check
4. In `getSystemTheme()`: remove the `if (typeof window === "undefined") return "light";` check

**Step 5: Commit**

```bash
git add src/components/
git commit -m "chore: migrate components from nextjs to vite"
```

---

### Task 6: Install remaining fontsource package

**Files:**
- Modify: `package.json` (new devDependency)

**Step 1: Install geist-mono fontsource**

```bash
npm install @fontsource/geist-mono
```

This replaces `next/font/google` → `Geist_Mono` that was in the old `layout.tsx`.

**Step 2: Verify the import works**

Add `@import "@fontsource/geist-mono/400.css";` to `src/index.css` (done in Task 4).

---

### Task 7: Create map page component

**Files:**
- Create: `src/pages/map.tsx`

**Step 1: Create `src/pages/map.tsx`**

Copy the content of `src/app/page.tsx` with these changes:
1. Remove `"use client"` — not needed in Vite
2. Change `export default function Page()` → `export function MapPage()`
3. Change `import { Theme } from "@/lib/map-texture/constant"` — keep as-is (it's already framework-agnostic)
4. Update `patternUrl` function to point to static files instead of API route:

```ts
function patternUrl(pattern: string, theme: Theme) {
  return `/patterns/${theme}/${pattern}.png`
}
```

Everything else in the map page (pattern loading, caching, theme observer, Map component usage) stays identical.

**Step 2: Commit**

```bash
git add src/pages/map.tsx
git commit -m "feat: map page component for vite spa"
```

---

### Task 8: Build-time pattern generation script

**Files:**
- Create: `scripts/generate-patterns.ts`

**Step 1: Create the script**

This replaces the Next.js API route `src/app/api/pattern/[theme]/[pattern]/route.ts`. It reads the same pattern functions, generates PNGs with sharp, writes them to `public/patterns/{theme}/{pattern}.png`.

```ts
import sharp from "sharp"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { THEMES, type Theme } from "../src/lib/map-texture/constant"
import { waterPattern } from "../src/lib/map-texture/water"
import { grassPattern } from "../src/lib/map-texture/grass"
import { forestPattern } from "../src/lib/map-texture/forest"
import { buildingPattern, landusePattern } from "../src/lib/map-texture/building"

const patterns: Record<string, (theme: Theme) => string> = {
  water: waterPattern,
  grass: grassPattern,
  forest: forestPattern,
  building: buildingPattern,
  landuse: landusePattern,
}

const OUT_DIR = join(import.meta.dirname, "..", "public", "patterns")

async function main() {
  for (const theme of THEMES) {
    for (const [name, fn] of Object.entries(patterns)) {
      const svg = fn(theme)
      const png = await sharp(Buffer.from(svg)).png().toBuffer()

      const dir = join(OUT_DIR, theme)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, `${name}.png`), png)
      console.log(`  generated: patterns/${theme}/${name}.png`)
    }
  }
}

main()
```

Note: If `import.meta.dirname` is not available (Node < 20.11), use `path.dirname(fileURLToPath(import.meta.url))` instead.

**Step 2: Add script to `package.json`**

```json
"generate:patterns": "npx tsx scripts/generate-patterns.ts"
```

**Step 3: Install tsx if not present**

```bash
npm install -D tsx
```

**Step 4: Run and verify**

```bash
npm run generate:patterns
```

Expected: 10 PNG files created in `public/patterns/` (5 patterns x 2 themes).

Verify files exist:
```bash
ls -la public/patterns/light/ public/patterns/dark/
```

**Step 5: Add `public/patterns/` to `.gitignore`**

These are build artifacts. Add to `.gitignore`:
```
public/patterns/
```

**Step 6: Commit**

```bash
git add scripts/generate-patterns.ts package.json package-lock.json .gitignore
git commit -m "feat: build-time pattern generation script"
```

---

### Task 9: Wire everything together and verify

**Files:**
- Modify: `src/vite-app.tsx` — add ThemeProvider
- Modify: `src/index.css` — ensure all imports are correct
- Modify: `vite.config.ts` — ensure CSS config is correct

**Step 1: Update `src/vite-app.tsx` to wrap with ThemeProvider**

```tsx
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MapPage } from "@/pages/map"

export function ViteApp() {
  return (
    <ThemeProvider>
      <Header />
      <MapPage />
      <Footer />
    </ThemeProvider>
  )
}
```

**Step 2: Ensure `src/index.css` has correct imports**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@fontsource/architects-daughter/400.css";
@import "@fontsource/geist-mono/400.css";

/* ... rest of existing globals.css content, minus the shadcn import ... */
```

**Step 3: Generate patterns and run Vite dev server**

```bash
npm run generate:patterns && npm run dev:vite
```

**Step 4: Verify in browser**

- Map renders with patterns (water, grass, forest, building, landuse textures visible)
- Theme toggle works (light/dark switch)
- Keyboard shortcut `d` toggles theme
- Header and footer render
- Map controls work (zoom, compass, locate)

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: vite spa fully wired and working"
```

---

### Task 10: Update shadcn config for Vite

**Files:**
- Modify: `components.json`

**Step 1: Update `components.json`**

Change `"rsc": true` to `"rsc": false` and update CSS path:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "menuColor": "default",
  "menuAccent": "subtle",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@mapcn": "https://mapcn.dev/r/{name}.json"
  }
}
```

**Step 2: Commit**

```bash
git add components.json
git commit -m "chore: update shadcn config for vite"
```

---

### Task 11: Clean up Next.js

**Files:**
- Delete: `src/app/` (entire directory — layout.tsx, page.tsx, globals.css, api/)
- Delete: `next.config.mjs`
- Delete: `next-env.d.ts`
- Delete: `.next/` (build cache)
- Modify: `package.json` — remove Next.js deps and scripts
- Modify: `tsconfig.json` — replace with `tsconfig.vite.json` content

**Step 1: Remove Next.js dependencies from `package.json`**

Remove from `dependencies`:
- `next`
- `next-themes`

Remove from `devDependencies`:
- `eslint-config-next`

Remove from `scripts`:
- `"dev"` (or repoint to `"dev": "vite"`)
- `"build"` (or repoint to `"build": "npm run generate:patterns && vite build"`)
- `"start"` (or repoint to `"start": "vite preview"`)

**Step 2: Rename `tsconfig.vite.json` → `tsconfig.json`**

Replace the existing `tsconfig.json` with the content of `tsconfig.vite.json` from Task 1.

**Step 3: Delete Next.js files**

```bash
rm -rf src/app/ .next/ next.config.mjs next-env.d.ts tsconfig.tsbuildinfo
rm tsconfig.vite.json
```

**Step 4: Final cleanup in `package.json` scripts**

```json
{
  "dev": "vite",
  "build": "npm run generate:patterns && vite build",
  "start": "vite preview",
  "generate:patterns": "tsx scripts/generate-patterns.ts",
  "lint": "eslint",
  "format": "prettier --write \"**/*.{ts,tsx}\"",
  "typecheck": "tsc --noEmit"
}
```

**Step 5: Run full verification**

```bash
npm run generate:patterns && npm run dev
```

Verify everything works in browser one final time.

```bash
npm run typecheck
npm run lint
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove nextjs, vite is now the only framework"
```

---

## Summary of changes

| What | Before (Next.js) | After (Vite) |
|---|---|---|
| Entry point | `src/app/layout.tsx` + `src/app/page.tsx` | `src/main.tsx` + `src/vite-app.tsx` + `src/pages/map.tsx` |
| CSS | `src/app/globals.css` | `src/index.css` (same content, no `shadcn/tailwind.css` import) |
| Theme | `next-themes` package | Custom `useTheme` hook (50 lines) |
| Fonts | `next/font/google` (Geist Mono) | `@fontsource/geist-mono` CSS import |
| Pattern images | API route (`/api/pattern/[theme]/[pattern]`) | Build-time script → `public/patterns/` |
| `"use client"` | Required on every component | Not needed, removed everywhere |
| SSR guards | `typeof document === "undefined"` checks | Removed (SPA is always client) |
| Routing | Next.js file-based | Single page (react-router added later with arch detail pages) |
