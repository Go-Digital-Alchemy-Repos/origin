# Navigation Menus System

## Overview

ORIGIN's Navigation Menus System provides tree-structured navigation management with nested items, multiple link types, and assignable header/footer slots. Menus are rendered in public site pages as part of the site chrome.

## Database Tables

### `menus`

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| site_id | varchar | FK → sites.id |
| workspace_id | varchar | FK → workspaces.id |
| name | text | Menu name |
| slot | text (nullable) | Assignment slot: `header`, `footer`, or null |
| created_at | timestamp | Creation timestamp |

### `menu_items`

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| menu_id | varchar | FK → menus.id (CASCADE) |
| parent_id | varchar (nullable) | FK → menu_items.id for nesting |
| type | text | Item type (see below) |
| label | text | Display label |
| target | text (nullable) | Link target (page slug, URL, etc.) |
| open_in_new_tab | boolean | Open link in new tab (default: false) |
| sort_order | integer | Position within parent level |

## Item Types

| Type | Description | Target Value |
|------|-------------|--------------|
| `page` | Link to a CMS page | Page slug |
| `collection_list` | Link to a collection listing | Collection slug |
| `collection_item` | Link to a specific collection item | Item slug |
| `external_url` | Link to an external URL | Full URL |

## Tree Structure

Menu items support arbitrary nesting via `parent_id`. The tree is flattened for storage and reconstructed on read. Reordering is handled via a bulk `PUT /reorder` endpoint that updates `parentId` and `sortOrder` for all items.

## Server Module

Located at `server/modules/cmsMenus/`:

- `cmsMenus.service.ts` — CRUD operations, tree reordering, workspace scoping
- `cmsMenus.routes.ts` — Express routes with auth middleware
- `index.ts` — Module registration

## API Endpoints

### Authenticated (require auth + workspace context)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/sites/:siteId/menus` | List menus for a site |
| POST | `/api/cms/sites/:siteId/menus` | Create a new menu |
| GET | `/api/cms/menus/:menuId` | Get menu with items |
| PATCH | `/api/cms/menus/:menuId` | Update menu name or slot |
| DELETE | `/api/cms/menus/:menuId` | Delete a menu and its items |
| POST | `/api/cms/menus/:menuId/items` | Add an item to a menu |
| PATCH | `/api/cms/menus/:menuId/items/:itemId` | Update a menu item |
| DELETE | `/api/cms/menus/:menuId/items/:itemId` | Delete a menu item |
| PUT | `/api/cms/menus/:menuId/reorder` | Bulk reorder items |

## Slot Assignment

Each site can have one menu assigned to the `header` slot and one to the `footer` slot. Assigning a menu to a slot is done via PATCH on the menu's `slot` field. The public site renderer queries menus by slot to build navigation chrome.

## Request Validation

All mutation endpoints use Zod schemas for body validation:

- `createMenuBody` — name (required), slot (optional: header/footer/null)
- `updateMenuBody` — name (optional), slot (optional)
- `createItemBody` — type, label (required), parentId, target, openInNewTab, sortOrder (optional)
- `updateItemBody` — all fields optional
- `reorderBody` — array of `{ id, parentId, sortOrder }` objects

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Missing workspace or invalid input |
| NOT_FOUND | 404 | Menu or item not found in workspace |

## Environment Variables

No additional environment variables required.

## Public Site Integration

The public site renderer (`publicSite.renderer.ts`) uses exported helpers:

- `buildHeaderNavHtml()` — Renders header navigation from the `header` slot menu
- `buildFooterHtml()` — Renders footer navigation from the `footer` slot menu

These are called during page rendering and blog rendering to provide consistent site chrome.

## Tenancy Model

- Menus are scoped to `(siteId, workspaceId)` pairs
- All authenticated endpoints verify workspace ownership via `getMenuForWorkspace()` before operations
- Public site rendering accesses menus by site ID and slot (no auth needed)

## Testing

1. Create a menu via POST `/api/cms/sites/:siteId/menus` with name and slot
2. Add items with different types (page, external_url)
3. Add nested items by setting `parentId`
4. Verify tree structure via GET `/api/cms/menus/:menuId`
5. Test reordering via PUT `/api/cms/menus/:menuId/reorder`
6. Assign to header/footer slot and verify public site renders navigation
7. Delete items and menus, verify cascade behavior
