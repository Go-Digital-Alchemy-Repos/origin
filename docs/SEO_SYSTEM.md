# SEO System

ORIGIN's SEO system provides comprehensive search engine optimization at both page and site levels.

## Overview

The SEO system operates on two tiers:

1. **Site-level defaults** — Global settings that apply to all pages unless overridden
2. **Page-level overrides** — Per-page fields that take precedence over site defaults

## Database Tables

### `pages` (extended columns)

| Column | Type | Description |
|--------|------|-------------|
| `canonical_url` | text | Explicit canonical URL (auto-generated if empty) |
| `indexable` | boolean | Whether search engines should index this page (default: true) |
| `og_title` | text | Open Graph title override |
| `og_description` | text | Open Graph description override |
| `og_image` | text | Open Graph image URL override |

### `site_seo_settings`

| Column | Type | Description |
|--------|------|-------------|
| `site_id` | varchar FK | Reference to sites table (unique) |
| `title_suffix` | text | Appended to all page titles: "Page Title \| Suffix" |
| `default_og_image` | text | Fallback OG image for pages without one |
| `default_indexable` | boolean | Default indexable flag for new pages |
| `robots_txt` | text | Custom robots.txt content |

## Server Module

Located at `server/modules/seo/`:

- `seo.service.ts` — CRUD for site SEO settings, sitemap generation, robots.txt
- `seo.routes.ts` — API endpoints with workspace ownership validation
- `index.ts` — Module registration

## API Routes

### Authenticated (require workspace context)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/sites/:siteId/seo` | Get site SEO settings |
| PUT | `/api/cms/sites/:siteId/seo` | Create or update site SEO settings |

### Public (served at site domain)

| Path | Description |
|------|-------------|
| `/sitemap.xml` | Auto-generated XML sitemap from published pages |
| `/robots.txt` | Custom robots.txt with auto-appended sitemap URL |

## Rendering Behavior

The public site renderer applies SEO settings as follows:

### Title Tag
```
<title>Page SEO Title | Title Suffix</title>
```
Falls back to page title if no SEO title is set. Falls back to site name if no title suffix.

### Canonical URL
```html
<link rel="canonical" href="..." />
```
Uses explicit `canonicalUrl` if set, otherwise auto-generates from `baseUrl + slug`.

### Indexability
```html
<meta name="robots" content="noindex, nofollow">
```
Added when page `indexable` is false. Falls back to site `defaultIndexable` setting.

### Open Graph Tags
```html
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<meta property="og:type" content="website">
```
Cascade: page OG fields → page SEO fields → site defaults.

### Sitemap
- Includes only published pages
- Uses `updatedAt` or `publishedAt` for `<lastmod>`
- `changefreq` set to `weekly`

### robots.txt
- Serves custom content from site settings
- Auto-appends `Sitemap: <baseUrl>/sitemap.xml` if not already present
- Default: `User-agent: * Allow: /`

## UI Pages

### Page Editor SEO Panel (`/app/pages/:pageId`)
- SEO Title with 60-character counter
- SEO Description with 160-character counter
- Canonical URL field
- Indexable toggle
- Open Graph overrides (title, description, image)

### Site SEO Settings (`/app/sites/seo`)
- Title suffix configuration
- Default OG image with preview
- Default indexable toggle
- robots.txt editor
- Info cards for auto-generated files
