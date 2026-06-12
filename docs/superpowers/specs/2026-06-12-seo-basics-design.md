# SEO Basics Design

**Date:** 2026-06-12
**Scope:** Light SEO for the SPA app (meta tags + social sharing + static files)
**Out of scope:** OG images (separate issue), landing page SEO (separate domain), `/arch/[slug]` indexing

## Context

Nolli is a Vite + React 19 SPA deployed on Cloudflare Workers. A separate landing page on a different domain will handle primary SEO. The SPA app needs light SEO: per-route meta tags, social sharing previews, and basic crawlability files.

**Production domain:** TBD (placeholder: `nolli-map.com`) — update all references when finalized.

## Architecture

Three layers:

1. **`<Seo>` component** — wraps `react-helmet-async`. Each route renders it with its meta config.
2. **`<HelmetProvider>`** — wraps the app at the root (`vite-app.tsx`).
3. **Static SEO files** — `robots.txt` and `sitemap.xml` in `public/`, served as-is by Cloudflare.

**Fallback:** `index.html` contains default meta tags. Routes override them via `react-helmet-async` at runtime. Non-JS crawlers see the `index.html` fallback.

## `<Seo>` Component

**Location:** `src/components/seo.tsx`

```tsx
interface SeoProps {
  title: string;                              // Appended with " | Nolli" (except home = "Nolli")
  description: string;                        // 150-160 chars recommended
  path?: string;                              // For canonical URL
  type?: 'website' | 'article';               // OG type, defaults to 'website'
}
```

**Rendered `<head>` tags:**
- `<title>{title} | Nolli</title>`
- `<meta name="description" content={description} />`
- `<meta property="og:title" content={title} />`
- `<meta property="og:description" content={description} />`
- `<meta property="og:type" content={type} />`
- `<meta property="og:url" content="https://nolli-map.com${path}" />`
- `<meta name="twitter:card" content="summary" />`
- `<meta name="twitter:title" content={title} />`
- `<meta name="twitter:description" content={description} />`
- `<link rel="canonical" href="https://nolli-map.com${path}" />`

## Route Config

| Route | Title | Description |
|-------|-------|-------------|
| `/` | Nolli | Interactive figure-ground map for discovering architecturally significant buildings. |
| `/about` | About | Nolli helps architects discover and study buildings through an interactive map experience. |

## Static Files

**`public/robots.txt`:**
```
User-agent: *
Allow: /

Sitemap: https://nolli-map.com/sitemap.xml
```

**`public/sitemap.xml`:**
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

## index.html Fallback

Add to existing `<head>` in `index.html`:

```html
<meta name="description" content="Interactive figure-ground map for discovering architecturally significant buildings." />
<meta property="og:title" content="Nolli" />
<meta property="og:description" content="Interactive figure-ground map for discovering architecturally significant buildings." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://nolli-map.com/" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Nolli" />
<meta name="twitter:description" content="Interactive figure-ground map for discovering architecturally significant buildings." />
<link rel="canonical" href="https://nolli-map.com/" />
```

## File Changes

| File | Action |
|------|--------|
| `src/components/seo.tsx` | New — `<Seo>` component |
| `src/vite-app.tsx` | Modify — wrap with `<HelmetProvider>` |
| Route files (`home`, `about`) | Modify — add `<Seo>` |
| `public/robots.txt` | New |
| `public/sitemap.xml` | New |
| `index.html` | Modify — add fallback meta tags |

## Dependencies

- `react-helmet-async` (install via npm)

## Future Extensions

- OG images (separate issue)
- `/arch/[slug]` routes with dynamic meta tags when building detail pages are implemented
- Structured data (JSON-LD) if needed later
- Update all `nolli-map.com` references when production domain is finalized
