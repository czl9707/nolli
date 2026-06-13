# SEO Basics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light SEO infrastructure to the SPA — per-route meta tags, social sharing previews, robots.txt, and sitemap.xml.

**Architecture:** Install `react-helmet-async` and create a `<Seo>` component. A new `SeoSync` component (following the existing `*Sync` pattern) watches the current route and renders the appropriate `<Seo>` tags. `<HelmetProvider>` wraps the app at the root. Static files go in `public/`.

**Tech Stack:** react-helmet-async, React 19, React Router 7, Vite, Cloudflare Workers

---

### Task 1: Install react-helmet-async

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

```bash
npm install react-helmet-async
```

- [ ] **Step 2: Verify installation**

```bash
grep "react-helmet-async" package.json
```

Expected: line showing `"react-helmet-async": "^2.0.5"` (or similar version) in dependencies.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "add react-helmet-async dependency"
```

---

### Task 2: Create the `<Seo>` component

**Files:**
- Create: `src/components/seo.tsx`

- [ ] **Step 1: Create the Seo component**

Create `src/components/seo.tsx`:

```tsx
import { Helmet } from "react-helmet-async"

const SITE_NAME = "Nolli"
const SITE_URL = "https://nolli-map.com" // TODO: update when domain is finalized

interface SeoProps {
  title: string
  description: string
  path?: string
  type?: "website" | "article"
}

export function Seo({
  title,
  description,
  path = "/",
  type = "website",
}: SeoProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={url} />
    </Helmet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/seo.tsx
git commit -m "add Seo component with react-helmet-async"
```

---

### Task 3: Create SeoSync and wire HelmetProvider into the app

**Files:**
- Create: `src/components/layout/seo-sync.tsx`
- Modify: `src/vite-app.tsx`

- [ ] **Step 1: Create SeoSync component**

Create `src/components/layout/seo-sync.tsx` — follows the same pattern as `LayoutSync`:

```tsx
import { useLocation } from "react-router"
import { Seo } from "@/components/seo"

const HOME_DESCRIPTION =
  "Interactive figure-ground map for discovering architecturally significant buildings."

const ABOUT_DESCRIPTION =
  "Nolli helps architects discover and study buildings through an interactive map experience."

export function SeoSync() {
  const location = useLocation()
  const { pathname } = location

  if (pathname.startsWith("/about")) {
    return <Seo title="About" description={ABOUT_DESCRIPTION} path="/about" />
  }

  // Default: home (covers "/" and "/arch/*" routes)
  return <Seo title="Nolli" description={HOME_DESCRIPTION} path="/" />
}
```

- [ ] **Step 2: Add HelmetProvider and SeoSync to vite-app.tsx**

Modify `src/vite-app.tsx`. Add the imports and wrap with `HelmetProvider`, then add `SeoSync` inside `BrowserRouter`:

```tsx
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter } from "react-router"
import { HelmetProvider } from "react-helmet-async"
import { LayoutSync } from "@/components/layout/layout-sync"
import { ArchSync } from "@/components/layout/arch-sync"
import { SeoSync } from "@/components/layout/seo-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { PinBoard } from "@/components/pin-board"
import { NavSidebar } from "@/components/nav/nav-sidebar"
import { ContentPanel } from "@/components/sidebar/content-panel"
import { PanelContent } from "@/components/sidebar/panel-content"
import { Toaster } from "@/components/ui/sonner"
import styles from "./vite-app.module.css"

function RouterSync() {
  return (
    <>
      <LayoutSync />
      <ArchSync />
      <SeoSync />
    </>
  )
}

export function ViteApp() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" />
        <ThemeSync />
        <AuthSync />
        <RouterSync />
        <Header />
        <div className={styles.appContainer}>
          <NavSidebar />
          <ContentPanel>
            <PanelContent />
          </ContentPanel>
          <PinBoard />
        </div>
        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  )
}
```

- [ ] **Step 3: Verify the app builds**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/seo-sync.tsx src/vite-app.tsx
git commit -m "wire HelmetProvider and SeoSync into app"
```

---

### Task 4: Add fallback meta tags to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add fallback meta tags**

Modify `index.html` — add meta tags between the `<link rel="manifest">` line and `<title>`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-title" content="Nolli" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="description" content="Interactive figure-ground map for discovering architecturally significant buildings." />
    <meta property="og:title" content="Nolli" />
    <meta property="og:description" content="Interactive figure-ground map for discovering architecturally significant buildings." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://nolli-map.com/" />
    <meta property="og:site_name" content="Nolli" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Nolli" />
    <meta name="twitter:description" content="Interactive figure-ground map for discovering architecturally significant buildings." />
    <link rel="canonical" href="https://nolli-map.com/" />
    <title>Nolli</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "add fallback SEO meta tags to index.html"
```

---

### Task 5: Add static SEO files (robots.txt and sitemap.xml)

**Files:**
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`

- [ ] **Step 1: Create robots.txt**

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://nolli-map.com/sitemap.xml
```

- [ ] **Step 2: Create sitemap.xml**

Create `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nolli-map.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://nolli-map.com/about</loc>
    <priority>0.5</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt public/sitemap.xml
git commit -m "add robots.txt and sitemap.xml"
```

---

### Task 6: Verify everything works

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open the app in a browser and verify**

1. Navigate to `/` — document title should be "Nolli"
2. View page source — fallback meta tags should be present in `<head>`
3. Open browser DevTools → Elements → `<head>` — react-helmet-async should have rendered `<title>Nolli</title>`, `<meta name="description">`, `<link rel="canonical">`, and OG/Twitter tags
4. Check that the title/description update if you navigate to `/about` (note: about page component doesn't exist yet, but the SEO tags should still render since SeoSync is path-based)

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: build succeeds. The `robots.txt` and `sitemap.xml` should be in the build output.

```bash
ls dist/robots.txt dist/sitemap.xml
```

Expected: both files exist.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: SEO verification adjustments"
```
