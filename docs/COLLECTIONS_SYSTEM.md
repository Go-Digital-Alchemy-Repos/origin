# Collections System

## Overview

ORIGIN Collections provide a flexible system for defining custom content types with schema-driven fields and revisioned items. Collections follow the same patterns as CMS Pages — workspace + site scoping, DRAFT/PUBLISHED status, revision history with pruning, and non-destructive rollback.

## Architecture

```
server/modules/cmsCollections/
  index.ts                       # Module entry point (mounts on /api/cms)
  cmsCollections.service.ts      # Business logic layer
  cmsCollections.routes.ts       # Express route handlers

shared/schema.ts                 # Drizzle ORM schema + Zod types
```

## Database Tables

### `collections`

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| workspace_id | VARCHAR | FK → workspaces.id |
| site_id | VARCHAR | FK → sites.id |
| name | TEXT | Display name |
| slug | TEXT | URL-safe identifier |
| description | TEXT | Optional description |
| schema_json | JSONB | Array of CollectionField objects |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `collection_items`

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| collection_id | VARCHAR | FK → collections.id (CASCADE) |
| status | TEXT | DRAFT or PUBLISHED |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `collection_item_revisions`

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| item_id | VARCHAR | FK → collection_items.id (CASCADE) |
| version | INTEGER | Monotonically increasing version number |
| data_json | JSONB | Item data matching the collection schema |
| created_by_user_id | VARCHAR | FK → users.id |
| note | TEXT | Optional revision note |
| created_at | TIMESTAMP | Creation timestamp |

## Schema Fields

Collection schemas are stored as a JSON array of `CollectionField` objects:

```typescript
type CollectionField = {
  key: string;        // Machine-readable field key (e.g., "title")
  label: string;      // Human-readable label (e.g., "Title")
  type: CollectionFieldType;
  required?: boolean;
  description?: string;
  options?: string[]; // For select/multiselect types
  defaultValue?: unknown;
};
```

### Supported Field Types

| Type | Description | Input Component |
|------|-------------|-----------------|
| text | Single-line text | Input |
| richtext | Multi-line rich text | Textarea |
| number | Numeric value | Input (number) |
| boolean | True/false toggle | Switch |
| date | Date value | Input (date) |
| image | Image URL | Input |
| select | Single choice from options | Select dropdown |
| multiselect | Multiple choices from options | Badge toggles |
| url | URL string | Input |

## API Endpoints

All endpoints require authentication (`requireAuth()`) and workspace context (`requireWorkspaceContext()`).

### Collection CRUD

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/sites/:siteId/collections` | List collections (query: `search`) |
| POST | `/api/cms/sites/:siteId/collections` | Create collection |
| GET | `/api/cms/collections/:collectionId` | Get collection |
| PATCH | `/api/cms/collections/:collectionId` | Update collection |
| DELETE | `/api/cms/collections/:collectionId` | Delete collection + all items |

### Item CRUD

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/collections/:id/items` | List items (query: `status`) |
| POST | `/api/cms/collections/:id/items` | Create item |
| GET | `/api/cms/collections/:id/items/:itemId` | Get item + latest revision |
| PATCH | `/api/cms/collections/:id/items/:itemId` | Update item (creates revision) |
| POST | `/api/cms/collections/:id/items/:itemId/publish` | Publish item |
| POST | `/api/cms/collections/:id/items/:itemId/rollback/:revId` | Rollback to revision |
| GET | `/api/cms/collections/:id/items/:itemId/revisions` | List revisions |
| DELETE | `/api/cms/collections/:id/items/:itemId` | Delete item |

## Revision Management

- Every save (draft or publish) creates a new revision
- Maximum 10 revisions per item (oldest pruned automatically)
- Rollback creates a NEW revision from a prior snapshot (non-destructive)
- Revision history is never mutated directly

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/app/collections` | CollectionsPage | Collection list with search + create dialog |
| `/app/collections/:id` | CollectionDetailPage | Tabs: Items list + Schema builder |
| `/app/collections/:id/items/:itemId` | CollectionItemEditorPage | Auto-generated form + save/publish/revisions |

## Workspace Ownership Verification

All routes verify that the requested collection belongs to the active workspace via `getCollectionForWorkspace()`. Item routes additionally verify collection ownership before accessing items.

## Non-Destructive Design

- No existing tables or data were modified
- New tables: `collections`, `collection_items`, `collection_item_revisions`
- Revision history is append-only (rollback creates new revision)
- Collection deletion cascades to items and revisions via FK constraints
