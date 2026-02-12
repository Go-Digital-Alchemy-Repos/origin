# Blog System

## Overview

ORIGIN's Blog System provides a turnkey blogging solution built on top of the Collections infrastructure. A setup wizard creates the necessary collection and landing page, while public routes render a styled blog index and detail pages with Article structured data for SEO.

## Architecture

The blog system is composed of three layers:

1. **Blog Service** — Setup wizard, published post queries, site ownership checks
2. **Blog Renderer** — Server-side HTML generation for `/blog` and `/blog/:slug`
3. **Blog Routes** — CMS API endpoints and public read endpoints

## How It Works

### Setup Wizard

When a user clicks "Create Blog" in the management UI:

1. A `blog-posts` collection is created with a predefined schema (title, slug, excerpt, body, featured image, author, category, tags, publish/update dates, SEO fields)
2. A `/blog` CMS page is created simultaneously
3. The collection and page are scoped to the user's site and workspace

### Publishing Flow

1. Authors create collection items in the `blog-posts` collection
2. Items are published through the standard collection item publish workflow
3. Published items automatically appear on the public `/blog` and `/blog/:slug` routes

## Database

The blog system uses the existing `collections`, `collection_items`, `collection_item_revisions`, and `pages` tables. No additional tables are required.

### Blog Collection Schema Fields

| Field | Key | Type | Required |
|-------|-----|------|----------|
| Title | `title` | text | Yes |
| Slug | `slug` | text | Yes |
| Excerpt | `excerpt` | textarea | No |
| Body | `body` | richtext | No |
| Featured Image | `featuredImage` | text | No |
| Author | `author` | text | No |
| Category | `category` | text | No |
| Tags | `tags` | text | No |
| Publish Date | `publishDate` | date | No |
| Updated Date | `updatedDate` | date | No |
| SEO Title | `seoTitle` | text | No |
| SEO Description | `seoDescription` | textarea | No |

## Server Module

Located at `server/modules/blog/`:

- `blog.service.ts` — Setup wizard, published post queries, site ownership verification
- `blog.routes.ts` — CMS API endpoints (status, setup) and public endpoints (posts list, single post)
- `blog.renderer.ts` — Server-side HTML rendering for blog index and detail pages
- `index.ts` — Module registration

## API Endpoints

### Authenticated (require auth + workspace context)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/sites/:siteId/blog/status` | Get blog setup status (exists, post counts) |
| POST | `/api/cms/sites/:siteId/blog/setup` | Run blog setup wizard |

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/public/blog/:siteId/posts` | List published blog posts |
| GET | `/api/cms/public/blog/:siteId/posts/:slug` | Get a single published post by slug |

### Public Site Routes (subdomain/custom domain)

| Path | Description |
|------|-------------|
| `/blog` | Blog index page with post cards |
| `/blog/:postSlug` | Individual blog post with Article schema markup |

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Missing workspace context |
| FORBIDDEN | 403 | Site not owned by workspace |
| NOT_FOUND | 404 | Post not found |
| CONFLICT | 409 | Blog already set up for this site |

## Environment Variables

No additional environment variables required. The blog system uses the existing database connection.

## Client UI

Located at `client/src/pages/blog.tsx`:

- **Setup Wizard** — Shown when no blog exists; single-click setup
- **Management Dashboard** — Stats cards (total, published, draft counts), published posts table
- **Navigation** — Links to collection manager and new post creation

## SEO Features

- Blog post detail pages include `Article` JSON-LD structured data
- Canonical URLs generated from site base URL
- Open Graph meta tags for social sharing
- Integration with site-level SEO defaults (title suffix, default OG image)
- `noindex` support when site default indexable is false

## Testing

1. Navigate to `/app/blog` in the CMS
2. Click "Create Blog" to run the setup wizard
3. Verify the `blog-posts` collection is created with all schema fields
4. Create and publish a collection item in the blog-posts collection
5. Visit the public `/blog` route to verify the index renders
6. Visit `/blog/:slug` to verify the detail page renders with structured data
7. Inspect page source for Article JSON-LD and OG meta tags
