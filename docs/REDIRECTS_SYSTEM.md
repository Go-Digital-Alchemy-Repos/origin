# Redirects System

## Overview

The Redirect Manager provides SEO-safe URL redirection for ORIGIN sites with support for manual CRUD, bulk CSV import, and a migration suggestions pipeline for WordPress importers.

## Database Tables

### `redirects`
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| site_id | varchar | FK → sites.id (CASCADE) |
| from_path | text | Normalized source path (e.g., `/old-page`) |
| to_url | text | Destination URL (relative or absolute) |
| code | integer | HTTP status code (301 or 302), default 301 |
| created_at | timestamp | Creation timestamp |

### `redirect_suggestions`
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| site_id | varchar | FK → sites.id (CASCADE) |
| from_path | text | Suggested source path |
| to_url | text | Suggested destination |
| source | text | Origin of suggestion (e.g., `wp_import`) |
| created_at | timestamp | Creation timestamp |

## Path Normalization

All `from_path` values are normalized before storage:
- Leading slash ensured (`page` → `/page`)
- Trailing slashes stripped (`/page/` → `/page`)
- Root path preserved as `/`

## Server Module

Located at `server/modules/redirects/`:
- `redirects.service.ts` — Data access layer (CRUD, bulk import, suggestions)
- `redirects.routes.ts` — Express routes with auth middleware
- `index.ts` — Module export

## API Endpoints

### Authenticated (require auth + workspace context)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/sites/:siteId/redirects` | List all redirects for a site |
| POST | `/api/cms/sites/:siteId/redirects` | Create a single redirect |
| PATCH | `/api/cms/redirects/:redirectId` | Update a redirect |
| DELETE | `/api/cms/redirects/:redirectId` | Delete a redirect |
| POST | `/api/cms/sites/:siteId/redirects/import` | Bulk import from CSV string |
| GET | `/api/cms/sites/:siteId/redirect-suggestions` | List pending suggestions |
| POST | `/api/cms/redirect-suggestions/:id/accept` | Accept suggestion → create redirect |
| DELETE | `/api/cms/redirect-suggestions/:id` | Dismiss suggestion |

### CSV Import

**Request body:** `{ csv: string }`

**CSV format:**
```
from_path, to_url, code
/old-page, /new-page, 301
/blog/old-post, /blog/new-post
```

- Header row is auto-detected and skipped
- Code column is optional (defaults to 301)
- Duplicate `from_path` entries are skipped
- Maximum 1000 rows per import

## Public Site Integration

Redirects are evaluated **early in public routing**, before page resolution. The check happens in `publicSite.routes.ts`:

1. Request arrives at public site router
2. `redirectsService.findRedirectByPath(siteId, requestPath)` is called
3. If a match is found, the server responds with `res.redirect(code, toUrl)`
4. If no match, normal page resolution continues

## Migration Hook

The `redirect_suggestions` table serves as a staging area for redirects suggested by content importers:

1. A WordPress importer (or other migration tool) inserts rows into `redirect_suggestions` with `source = 'wp_import'`
2. The Redirects UI shows pending suggestions with accept/dismiss buttons
3. Accepting a suggestion creates an active redirect and removes the suggestion
4. Dismissing removes the suggestion without creating a redirect

## UI

The Redirects page (`/app/redirects`) provides:
- Table view of all active redirects with from_path, to_url, code, and creation date
- Add/edit dialog with from_path, to_url, and code (301/302) fields
- Delete with confirmation
- CSV import dialog (file upload or paste)
- Suggestions panel (when suggestions exist) with accept/dismiss actions
