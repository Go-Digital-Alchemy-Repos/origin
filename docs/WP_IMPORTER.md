# WordPress Importer — Developer Documentation

## Overview

The WordPress migration module (`server/modules/migration/`) provides a non-destructive import pipeline that converts a WordPress WXR (XML) export into ORIGIN entities. All imported content arrives as DRAFT, giving editors full control before publishing.

## Architecture

```
server/modules/migration/
├── index.ts              # Module entry, exports createMigrationModule()
├── migration.routes.ts   # API endpoints
├── migration.service.ts  # Orchestrator: parse → import → redirect suggestions
└── wpParser.ts           # Stateless WP XML parser (fast-xml-parser)
```

## Database Tables

### `migration_jobs`

| Column             | Type      | Description                              |
|--------------------|-----------|------------------------------------------|
| id                 | varchar   | PK (UUID)                                |
| workspace_id       | varchar   | FK → workspaces                          |
| site_id            | varchar   | FK → sites                               |
| created_by_user_id | varchar   | FK → users                               |
| source             | text      | Always "wordpress"                       |
| status             | text      | pending / running / completed / failed   |
| file_name          | text      | Original upload filename                 |
| summary            | jsonb     | Post-import stats (pages, posts, etc.)   |
| created_at         | timestamp | Job creation time                        |
| completed_at       | timestamp | Job finish time                          |

### `migration_logs`

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | varchar   | PK (UUID)                      |
| job_id     | varchar   | FK → migration_jobs            |
| level      | text      | info / warn / error            |
| message    | text      | Human-readable log line        |
| meta       | jsonb     | Optional structured data       |
| created_at | timestamp | Log entry time                 |

## API Routes

All routes require authentication and workspace context.

| Method | Path                                   | Description           |
|--------|----------------------------------------|-----------------------|
| GET    | /api/migration/jobs                    | List workspace jobs   |
| GET    | /api/migration/jobs/:jobId             | Get single job        |
| GET    | /api/migration/jobs/:jobId/logs        | Get job log entries   |
| POST   | /api/sites/:siteId/migration/wp-import | Start a WP import    |

### POST /api/sites/:siteId/migration/wp-import

**Body (JSON):**
```json
{
  "xmlContent": "<string — full WP XML export>",
  "fileName": "wordpress-export.xml"
}
```

**Max size:** 50 MB (enforced at both route and Express JSON parser level).

**Response:** Returns the `MigrationJob` record. If the import is fast enough it will already be `completed` or `failed` when the response arrives (synchronous pipeline).

## Import Pipeline

1. **Parse** — `wpParser.parseWpExport(xml)` extracts pages, posts, and media from the WXR structure.
2. **Import Pages** — Each WP page becomes an ORIGIN CMS page (DRAFT). Content is wrapped in a page-builder-compatible richtext block. Slug collisions append a unique suffix.
3. **Import Posts** — Ensures a `blog-posts` collection exists (creates one if not). Each WP post becomes a collection item (DRAFT) with a revision holding the mapped blog data.
4. **Import Media** — Logs attachment URLs in migration logs. No file download occurs (media remains at original URLs until manually re-uploaded).
5. **Redirect Suggestions** — Generates `redirect_suggestions` rows mapping old WP permalinks to new ORIGIN paths (pages → `/<slug>`, posts → `/blog/<slug>`). Source is set to `wp_import`.

## WP XML Parser (`wpParser.ts`)

- Uses `fast-xml-parser` with CDATA support
- Handles both namespaced (`wp:post_type`) and non-namespaced element names
- Exported functions:
  - `parseWpExport(xmlString)` → `WpExportData`
  - `generateRedirectSuggestions(wpData, importedPages, importedPosts)` → redirect pairs

## Non-Destructive Guarantees

- All content is imported as DRAFT
- Slug collisions are resolved with unique suffixes (never overwrites)
- Redirect suggestions are proposals, not active redirects
- Media is referenced but not downloaded
- Existing site content is never modified or deleted

## Frontend

The migration wizard (`client/src/pages/migration.tsx`) provides:

1. **Upload step** — Site selector + file picker
2. **Progress step** — Spinner while job is running
3. **Results step** — Summary cards (pages, posts, media, redirects) + full log table
4. **History** — Table of previous import jobs with view details
