# ORIGIN Resource Docs System (Help & Resources)

## Overview

The Resource Docs system provides client-facing help documentation filtered by what the workspace has installed. Unlike the Super Admin Docs Library which shows all developer docs, the Help & Resources page only shows:

1. **General help docs** — Always visible (category: `help`, `getting-started`, `guides`)
2. **Marketplace-specific docs** — Only visible when the corresponding marketplace item is installed in the workspace (category: `marketplace`)

## How Filtering Works

### General Help Docs
Docs with `type: "help"` and categories like `help`, `getting-started`, or `guides` are always shown to all authenticated users.

### Marketplace-Filtered Docs
Docs with `category: "marketplace"` are only shown when:
1. The doc's `slug` matches a marketplace item's `doc_slug` field
2. That marketplace item is installed (enabled) in the user's active workspace

### Flow:
```
1. Client visits /app/help
2. Frontend fetches GET /api/docs?type=help
3. Frontend fetches GET /api/marketplace/installs (workspace-scoped)
4. Frontend fetches GET /api/marketplace/items
5. Installed items' docSlugs are collected
6. Marketplace-category docs are filtered to only show those matching installed docSlugs
7. General help docs are always shown
```

## UI Route

| Route | Page | Access |
|-------|------|--------|
| `/app/help` | Help & Resources | All authenticated users |

## Entitlement-Based Filtering

The filtering is currently based on marketplace installs. Future enhancements will include:
- Filtering by workspace entitlements (features array from the entitlements table)
- Component-level docs accessible from the builder inspector panel
- Contextual help tooltips in the page builder

## Future: Builder Inspector Integration

When the page builder is implemented, component docs will be accessible from:
1. The builder inspector panel (sidebar when a component is selected)
2. The Resource Docs list (via marketplace item docs)

Each marketplace item (widget, section, etc.) can have an associated doc entry. When a user selects a component in the builder, the inspector can load the doc via the item's `doc_slug` reference.

## Database Schema

The system uses existing tables:
- `doc_entries` — Stores all documentation (developer + help)
- `marketplace_items` — Has `doc_slug` field linking to a doc entry
- `marketplace_installs` — Tracks which items are installed per workspace

No additional tables are needed for the resource docs system.

## Creating a Resource Doc

To add a help doc for a marketplace item:

1. Add a doc entry to `server/seed.ts` with:
   - `type: "help"`
   - `category: "marketplace"`
   - A unique `slug`
2. Set the marketplace item's `docSlug` to match the doc's `slug`
3. The doc will automatically appear in Help & Resources when the item is installed
