# Public Site Rendering & Domain Routing

## Overview

ORIGIN renders published pages as standalone HTML documents served to public visitors. Each site can be accessed via:

1. **Default subdomain**: `<site-slug>.originapp.ai`
2. **Custom domains**: Any verified domain mapped to a site via `site_domains`

## Architecture

### Host Resolution Flow

```
Request arrives
  ├─ Extract hostname from req.hostname
  ├─ Check site_domains table (custom domain lookup)
  │   └─ Found? → resolve to site_id
  ├─ Check if hostname ends with .originapp.ai
  │   └─ Extract slug → lookup sites table
  └─ Not a public site request → pass to app (Vite / SPA)
```

### Module Structure

```
server/modules/publicSite/
├── index.ts                  — Exports
├── publicSite.service.ts     — DB queries (host→site, page lookup, theme)
├── publicSite.routes.ts      — Express routes + host resolver middleware
├── publicSite.renderer.ts    — Server-side HTML rendering
└── publicSite.cache.ts       — Cache headers + purge hooks
```

### Key Components

#### Host Resolver Middleware (`resolvePublicSiteMiddleware`)
- Runs on every request before Vite's catch-all
- Checks if the hostname is a public site request
- If resolved, attaches `req.publicSite` with site metadata
- Non-public requests pass through untouched

#### Public Page Renderer (`renderPublicPage`)
- Server-renders published pages as self-contained HTML
- Supports all 10 builder block types (hero, feature-grid, testimonials, etc.)
- Includes Inter font, responsive CSS, navigation, and footer
- SEO: title, meta description, Open Graph tags
- No JavaScript required — pages are static HTML

#### Cache Layer (`publicSite.cache.ts`)
- Published pages: `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- 404s and errors: `no-store, no-cache, must-revalidate`
- Purge hooks: `purgeCache(siteId, pageSlug?)` called on publish
- `onCachePurge(callback)` for registering CDN/edge purge integrations

## Database

### `site_domains` table

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| site_id | varchar | FK → sites.id |
| domain | text (unique) | Full domain (e.g., `example.com`) |
| is_primary | boolean | Whether this is the primary domain |
| verified_at | timestamp | When DNS verification passed |
| created_at | timestamp | Creation timestamp |

## API Endpoints

### Public Preview (Development)

```
GET /api/public-preview/:siteSlug?page=<pageSlug>
```

Returns the fully rendered HTML for a published page. Useful for testing in development where subdomain routing isn't available.

**Parameters:**
- `siteSlug` — The site's slug (from the sites table)
- `page` (query, optional) — Page slug. Defaults to "home", "index", or first published page.

**Response:** Full HTML document (Content-Type: text/html)

### Production Routes

When accessed via `<slug>.originapp.ai` or a verified custom domain:

```
GET /           → Renders homepage (slug: home/index/first published)
GET /<pageSlug> → Renders the matching published page
```

## Testing Locally

### Using the Preview API

The easiest way to test during development:

```bash
# Render the default (home) page
curl http://localhost:5000/api/public-preview/demo-site

# Render a specific page
curl http://localhost:5000/api/public-preview/demo-site?page=about
```

### Using hosts file (subdomain simulation)

To test the actual hostname-based routing locally:

1. Edit your hosts file:

   **macOS/Linux:** `/etc/hosts`
   **Windows:** `C:\Windows\System32\drivers\etc\hosts`

2. Add an entry mapping the subdomain to localhost:

   ```
   127.0.0.1   demo-site.originapp.ai
   ```

3. Access `http://demo-site.originapp.ai:5000/` in your browser

4. The host resolver middleware will detect the `.originapp.ai` suffix, extract `demo-site`, and resolve it to the correct site.

### Using custom domain simulation

```
127.0.0.1   mysite.example.com
```

Then insert a record into `site_domains`:

```sql
INSERT INTO site_domains (site_id, domain, is_primary)
VALUES ('<your-site-id>', 'mysite.example.com', true);
```

Access `http://mysite.example.com:5000/` in your browser.

## Caching Strategy

### Current Implementation

- **Published pages**: 60s browser cache + 5min stale-while-revalidate
- **404 pages**: No caching
- **Preview API**: No caching (development tool)

### Cache Purge on Publish

When a page is published via the CMS, `purgeCache(siteId, pageSlug)` is called automatically. This triggers any registered purge callbacks.

### Future: CDN Integration

Register a purge callback to integrate with edge caches:

```typescript
import { onCachePurge } from "./modules/publicSite";

onCachePurge((siteId, pageSlug) => {
  // Call CDN purge API (Cloudflare, Fastly, etc.)
  // cdnClient.purge(`/sites/${siteId}/pages/${pageSlug}`);
});
```

## Content Rendering

The renderer supports all 10 Global Component Registry block types:

| Block | Server Render |
|-------|--------------|
| hero | Background image/gradient, headlines, CTA buttons |
| feature-grid | Responsive grid with cards |
| testimonials | Quote cards with optional ratings |
| pricing | Plan comparison with features |
| faq | Native `<details>` elements (no JS needed) |
| gallery | Responsive image grid with lazy loading |
| cta | Call-to-action banner (gradient/outlined/default) |
| rich-text | Pre-formatted text content |
| divider | Horizontal rules (solid/dashed/dotted/gradient) |
| spacer | Vertical spacing |

### BuilderContent Format

Pages using the visual builder store content in `page_revisions.content_json` as:

```json
{
  "schemaVersion": 1,
  "data": {
    "content": [
      { "type": "hero", "props": { "id": "abc", "headline": "Welcome" } },
      { "type": "cta", "props": { "id": "def", "headline": "Get Started" } }
    ],
    "root": {}
  }
}
```

Legacy/non-builder content is rendered as formatted JSON.
