# Pages, Revisions & Publishing

## Overview

ORIGIN Pages provides a CMS-style page management system scoped by workspace and site. Every page save creates a new revision, and the system keeps only the most recent 10 revisions per page. Publishing is an explicit action that updates `published_at`.

## Data Model

### `pages` table

| Column           | Type      | Description                             |
|------------------|-----------|-----------------------------------------|
| id               | varchar   | UUID primary key                        |
| workspace_id     | varchar   | FK → workspaces.id                      |
| site_id          | varchar   | FK → sites.id                           |
| title            | text      | Page title                              |
| slug             | text      | URL slug                                |
| status           | text      | `DRAFT` or `PUBLISHED`                  |
| published_at     | timestamp | Last publish timestamp (null if draft)   |
| seo_title        | text      | SEO title (optional)                    |
| seo_description  | text      | SEO description (optional)              |
| seo_image        | text      | SEO image URL (optional)                |
| created_at       | timestamp | Row creation time                       |
| updated_at       | timestamp | Last update time                        |

### `page_revisions` table

| Column             | Type      | Description                          |
|--------------------|-----------|--------------------------------------|
| id                 | varchar   | UUID primary key                     |
| page_id            | varchar   | FK → pages.id (cascade delete)       |
| version            | integer   | Auto-incrementing version number     |
| content_json       | jsonb     | Full page content snapshot           |
| created_by_user_id | varchar   | FK → users.id (nullable)             |
| note               | text      | Human-readable note (e.g. "Published", "Rollback to v3") |
| created_at         | timestamp | Revision creation time               |

## Revision Behavior

1. **Auto-create**: Every save (draft or publish) creates a new revision with an incrementing version number.
2. **Pruning**: After each new revision, the system deletes any revisions beyond the 10 most recent (by version number descending).
3. **Rollback**: Rolling back to a previous revision creates a **new** revision with a copy of the source revision's `content_json`. History is never mutated.

## Page Status

- **DRAFT** — Default state for new pages. Not publicly visible.
- **PUBLISHED** — Explicitly published. Sets `published_at` timestamp and `status = PUBLISHED`.

Scheduled publishing is planned for a future prompt.

## API Endpoints

All endpoints require authentication (`requireAuth()`) and workspace context (`requireWorkspaceContext()`).

| Method | Path                                          | Description                          |
|--------|-----------------------------------------------|--------------------------------------|
| GET    | `/api/cms/sites/:siteId/pages`                | List pages for a site (query: `search`, `status`) |
| POST   | `/api/cms/sites/:siteId/pages`                | Create a new page                    |
| GET    | `/api/cms/pages/:pageId`                      | Get page detail + latest revision    |
| PATCH  | `/api/cms/pages/:pageId`                      | Update page (creates revision)       |
| POST   | `/api/cms/pages/:pageId/publish`              | Publish page (creates revision)      |
| POST   | `/api/cms/pages/:pageId/rollback/:revisionId` | Rollback to revision (creates new)   |
| GET    | `/api/cms/pages/:pageId/revisions`            | List revisions (newest first)        |
| DELETE | `/api/cms/pages/:pageId`                      | Delete page and all revisions        |

### Create Page Body

```json
{
  "title": "Home",
  "slug": "home",
  "contentJson": { "sections": [] },
  "seoTitle": "Home | My Site",
  "seoDescription": "Welcome to our site"
}
```

### Update Page Body

```json
{
  "title": "Home (updated)",
  "slug": "home",
  "contentJson": { "sections": [{ "type": "hero" }] },
  "note": "Added hero section",
  "seoTitle": "Home | My Site"
}
```

### Publish Body (optional)

```json
{
  "contentJson": { "sections": [{ "type": "hero" }] }
}
```

If `contentJson` is omitted during publish, the system uses the latest revision's content.

## UI

### Pages List (`/app/pages`)

- Displays all pages for the active site
- Search by title
- Filter by status (All / Draft / Published)
- Create new page dialog
- Click page card to open editor

### Page Editor (`/app/pages/:pageId`)

- Edit title, slug, content JSON, and SEO fields
- Save Draft button (creates revision)
- Publish button (sets status to PUBLISHED, creates revision)
- Revisions panel (slide-out) showing version history with restore buttons
- Unsaved changes indicator

## How to Test

1. Log in as `admin@digitalalchemy.dev` / `OriginAdmin2026!`
2. Ensure a workspace is selected (auto-selected on login)
3. Navigate to Pages in the sidebar
4. Create a new page with title and slug
5. Edit content JSON, save as draft — verify revision created
6. Publish the page — verify status changes to Published
7. Save again — verify another revision created
8. Open revisions panel, restore an older version — verify new revision created from old content
9. Create 12+ revisions on a page — verify only 10 are kept

## Architecture

```
server/modules/cmsPages/
  index.ts                  # Module entry, mounts at /cms
  cmsPages.routes.ts        # Express routes
  cmsPages.service.ts       # Business logic, revision management, pruning
```

The module follows the standard ORIGIN module pattern: index.ts exports a `createCmsPagesModule()` function that returns a Router mounted via the central registry.
