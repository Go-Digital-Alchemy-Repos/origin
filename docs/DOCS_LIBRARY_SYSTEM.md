# ORIGIN Docs Library System

## Overview

The ORIGIN Docs Library is a Super Admin / developer-facing documentation system. It stores structured doc entries in the database, categorized and tagged, with full CRUD management available to platform administrators.

## Database

All docs are stored in the `doc_entries` table:

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| title | text | Document title |
| slug | text (unique) | URL-friendly identifier |
| content | text | Markdown-formatted content |
| category | text | Category bucket (getting-started, architecture, modules, api-reference, guides, help, marketplace) |
| type | text | `developer` or `help` — controls visibility scope |
| tags | text[] | Array of tags for filtering |
| sort_order | integer | Display ordering |
| is_published | boolean | Published visibility flag |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last updated timestamp |

## Doc Types

- **developer** — Shown in the Super Admin Docs Library (`/app/docs`). Developer/architecture documentation.
- **help** — Shown in client Help & Resources (`/app/help`). End-user guides and tutorials.

## Categories

| Category | Description |
|----------|-------------|
| getting-started | Onboarding and setup guides |
| architecture | System architecture and patterns |
| modules | Module development and usage |
| api-reference | API endpoint documentation |
| guides | How-to guides (auth, tenancy, billing, etc.) |
| help | End-user help articles |
| marketplace | Marketplace item-specific docs (filtered by install status) |

## API Routes

All routes are prefixed with `/api/docs`.

### Public Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/docs` | List all docs (supports `?type=`, `?category=`, `?q=` query params) |
| GET | `/api/docs/help` | List published help docs only |
| GET | `/api/docs/:slug` | Get single doc by slug |

### Admin Routes (SUPER_ADMIN / AGENCY_ADMIN only)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/docs` | Create a new doc entry |
| PATCH | `/api/docs/:id` | Update a doc entry |
| DELETE | `/api/docs/:id` | Delete a doc entry |

## UI Routes

| Route | Page | Access |
|-------|------|--------|
| `/app/docs` | Docs Library | All authenticated users (Studio sidebar) |
| `/app/help` | Help & Resources | All authenticated users (Client sidebar) |

## Seeding

Docs are seeded from `server/seed.ts`. The seed process is non-destructive:
- Checks for existing slugs before inserting
- New doc entries are appended without touching existing ones
- Docs from `/docs/*.md` files are referenced but not auto-imported (manual seed entries preferred for control)

## Search

The Docs Library supports text search via the `?q=` query parameter. Search matches against title, content, and category fields using case-insensitive partial matching.

## Tags

Tags are stored as a text array on each doc entry. The UI renders tags as badges on doc detail views. Tag-based filtering can be added in future iterations.

## Docs Update Checklist

Every future prompt that modifies ORIGIN must verify:

1. [ ] If a new module/feature is added, create a corresponding doc entry in `server/seed.ts`
2. [ ] If a new API endpoint is added, update the "API Reference" doc entry
3. [ ] If a new marketplace item is added, create a `type: "help"` doc with `category: "marketplace"` and set `docSlug` on the item
4. [ ] If architecture changes, update the "Architecture Overview" doc entry
5. [ ] If navigation changes, update the "App Shell & Navigation" doc entry
6. [ ] Create/update corresponding `/docs/*.md` file for developer reference
7. [ ] Update `replit.md` with recent changes
