# ORIGIN Marketplace Framework

## Overview

The ORIGIN Marketplace provides a browsable catalog of extensions organized by type. Items can be free or paid, and all items support non-destructive preview before installation.

## Item Types

| Type | Description |
|------|-------------|
| Site Kit | Complete theme + template bundles for rapid site creation |
| Section | Reusable page sections (hero, testimonials, pricing, etc.) |
| Widget | Interactive embeddable components (search, chat, calendar) |
| App | Full applications and integrations (CRM, analytics, etc.) |
| Add-on | Small utilities and enhancements (SEO tools, redirects, etc.) |

## Database Schema

### marketplace_items

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| type | text | Item type (site-kit, section, widget, app, add-on) |
| name | text | Display name |
| slug | text (unique) | URL-friendly identifier |
| description | text | Short description |
| long_description | text | Detailed description for item detail page |
| icon | text | Lucide icon name |
| cover_image | text | URL to cover image |
| author | text | Author/publisher name |
| price_id | text | Stripe Price ID (for paid items) |
| is_free | boolean | Whether the item is free |
| price | integer | Price in cents (0 for free items) |
| version | text | Semantic version |
| status | text | published, draft, archived |
| category | text | Optional sub-category |
| tags | text[] | Searchable tags |
| metadata | jsonb | Extensible metadata |
| doc_slug | text | Associated doc entry slug (for Help & Resources) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last updated timestamp |

### marketplace_installs

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| workspace_id | varchar | FK to workspaces |
| item_id | varchar | FK to marketplace_items |
| enabled | boolean | Whether currently enabled |
| purchased | boolean | Whether purchased (auto-true for free items) |
| installed_at | timestamp | Installation timestamp |

### preview_sessions

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| workspace_id | varchar | FK to workspaces |
| item_id | varchar | FK to marketplace_items |
| preview_state_json | jsonb | Preview overlay state |
| created_at | timestamp | Session start timestamp |

## API Routes

All routes prefixed with `/api/marketplace`.

### Public Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/marketplace/items` | List published items (supports `?type=` filter) |
| GET | `/api/marketplace/items/:slug` | Get item details by slug |

### Admin Routes (SUPER_ADMIN / AGENCY_ADMIN)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/marketplace/items` | Create a new marketplace item |
| PATCH | `/api/marketplace/items/:id` | Update an item |
| DELETE | `/api/marketplace/items/:id` | Delete an item |

### Workspace-Scoped Routes (requires auth + workspace context)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/marketplace/installs` | List workspace's installed items |
| POST | `/api/marketplace/install` | Install an item `{ itemId }` |
| POST | `/api/marketplace/uninstall` | Disable an item `{ itemId }` |
| POST | `/api/marketplace/preview/start` | Start preview session `{ itemId }` |
| POST | `/api/marketplace/preview/end` | End preview session `{ itemId }` |

## UI Routes

| Route | Page | Access |
|-------|------|--------|
| `/app/marketplace` | Marketplace Browser | All authenticated users |

## Preview System

### Design Principles
- Previews are **non-destructive overlays** — no workspace data is modified
- All items support unlimited preview before purchase
- Free items can be previewed or installed immediately
- Paid items require purchase before installation (preview is always free)
- Site Kits use a "Preview + Apply" pattern (no immediate apply)

### Preview Session Lifecycle
1. User clicks "Preview" on an item
2. Backend creates a `preview_sessions` entry
3. Frontend renders a preview overlay/modal (stub for now)
4. User can "Close Preview" (ends session) or "Install" (installs and ends session)

### Future Enhancements
- Live site preview with item's styles/components overlaid
- Side-by-side comparison view
- Preview history and bookmarking

## Installation Flow

### Free Items
1. Browse → Preview (optional) → Install → Enabled immediately

### Paid Items
1. Browse → Preview (unlimited) → Purchase (Stripe checkout) → Install → Enabled
2. Purchased items can be uninstalled and re-installed without re-purchase

## Integration with Help & Resources

Each marketplace item can have an associated `doc_slug` that links to a help document. When an item is installed, its associated help doc becomes visible in the Help & Resources page. See RESOURCE_DOCS_SYSTEM.md for details.

## Seeded Items

The seed data includes sample items across all types:
- Site Kits: Modern Business, Creative Portfolio
- Sections: Hero Banner, Testimonials Grid, Pricing Table, FAQ Accordion
- Widgets: Live Chat, Search Bar, Social Feed
- Apps: CRM Suite, Email Marketing
- Add-ons: SEO Toolkit Pro, Redirects Manager, Cookie Consent
