# Site Kits System

## Overview

Site Kits are bundled starter packages that combine theme presets, page templates, section presets, collection schemas, and starter content into a single installable unit. They allow platform administrators to create curated website starter experiences that workspace users can install to quickly scaffold a new site with a cohesive design and content structure.

## Database Tables

### `site_kits`

| Column | Type | Description |
|---|---|---|
| id | varchar (PK) | UUID, auto-generated |
| name | text | Display name of the kit |
| slug | text | URL-friendly identifier (unique) |
| description | text | Kit description |
| version | text | SemVer string, defaults to "1.0.0" |
| cover_image | text | Optional cover image URL |
| metadata_json | jsonb | Arbitrary metadata, defaults to `{}` |
| status | text | "draft" or "published", defaults to "draft" |
| marketplace_item_id | varchar | FK to marketplace_items (set on first publish) |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### `site_kit_assets`

| Column | Type | Description |
|---|---|---|
| id | varchar (PK) | UUID, auto-generated |
| site_kit_id | varchar (FK) | References site_kits (cascade delete) |
| asset_type | text | One of: theme_preset, page_template, section_preset, collection_schema, starter_content |
| asset_ref | text | Reference identifier for the asset |
| label | text | Optional display label |
| config_json | jsonb | Asset configuration, defaults to `{}` |
| sort_order | integer | Display/processing order, defaults to 0 |
| created_at | timestamp | Creation time |

## API Routes

All routes are mounted under `/api/site-kits`.

### Admin Routes (require SUPER_ADMIN or AGENCY_ADMIN)

| Method | Path | Description |
|---|---|---|
| GET | `/api/site-kits/` | List all site kits |
| POST | `/api/site-kits/` | Create a new site kit |
| PATCH | `/api/site-kits/:id` | Update a site kit |
| DELETE | `/api/site-kits/:id` | Delete a draft site kit |
| POST | `/api/site-kits/:id/publish` | Publish a site kit |
| POST | `/api/site-kits/:id/unpublish` | Unpublish a site kit |
| POST | `/api/site-kits/:id/assets` | Add an asset to a kit |
| PATCH | `/api/site-kits/assets/:assetId` | Update an asset |
| DELETE | `/api/site-kits/assets/:assetId` | Remove an asset |

### Authenticated Routes (require auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/site-kits/:id` | Get a single site kit by ID |
| GET | `/api/site-kits/:id/assets` | List assets for a kit |
| GET | `/api/site-kits/:id/manifest` | Get full kit manifest with grouped assets and summary |

### Public Routes (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/site-kits/published` | List all published site kits |

### Install Route (require auth + workspace context)

| Method | Path | Description |
|---|---|---|
| POST | `/api/site-kits/:id/install` | Install a published kit to a workspace site |

**Install Request Body:**
```json
{ "siteId": "string" }
```

## Publishing Flow

1. Admin creates a site kit with name, slug, and description
2. Admin adds assets (theme presets, page templates, section presets, etc.)
3. Admin calls POST `/:id/publish`
4. Service validates the kit has at least one asset and at least one `theme_preset` asset
5. Kit status is set to "published"
6. A corresponding marketplace item is created (type: "site-kit", free, published) or updated if one already exists
7. The marketplace item ID is stored on the site kit record

### Unpublishing

1. Admin calls POST `/:id/unpublish`
2. Kit status reverts to "draft"
3. The linked marketplace item is also set to "draft"

### Deletion

- Only draft kits can be deleted
- Published kits must be unpublished first
- Deleting a kit cascades to remove all associated assets

## Install Flow

1. User selects a published site kit and provides a target site ID
2. Service verifies the kit is published
3. Service retrieves the full manifest (all assets grouped by type)
4. Assets are applied to the target workspace and site:
   - `theme_preset` — Theme configuration applied
   - `page_template` — Pages created from templates
   - `section_preset` — Sections applied to pages
   - `collection_schema` — Collections created
   - `starter_content` — Content items seeded
5. Returns a summary of what was installed (pages created, sections applied, collections created, theme applied, starter content created)

## Kit Manifest

The manifest endpoint (`GET /:id/manifest`) returns:

```json
{
  "kit": { ... },
  "assets": {
    "theme_preset": [...],
    "page_template": [...],
    "section_preset": [...],
    "collection_schema": [...],
    "starter_content": [...]
  },
  "summary": {
    "themePresets": 1,
    "pageTemplates": 3,
    "sectionPresets": 5,
    "collectionSchemas": 2,
    "starterContent": 4
  }
}
```

## File Structure

```
server/modules/siteKits/
  index.ts              # Module entry, exports createSiteKitsModule()
  siteKits.routes.ts    # Express route handlers
  siteKits.service.ts   # Business logic (CRUD, publish, install)
  siteKits.repo.ts      # Database access layer (Drizzle queries)

client/src/pages/
  site-kits.tsx         # Studio management UI

shared/schema.ts        # Database schema (siteKits, siteKitAssets tables)
```
