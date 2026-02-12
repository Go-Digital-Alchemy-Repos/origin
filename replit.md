# ORIGIN Platform

## Overview

ORIGIN is a modern website platform that replaces WordPress. It provides a modular architecture, visual page builder, and enterprise-grade infrastructure for building, managing, and scaling websites.

**Current State**: MVP with authentication (BetterAuth), multi-tenant workspaces, role-based access control, marketing site, app dashboard, module browser, docs library, marketplace framework, Help & Resources, component registry, CMS pages with revision history and publishing, Collections system for custom content types with revisioned items, and modular server architecture.

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, shadcn/ui, wouter (routing), TanStack Query
- **Backend**: Express.js 5, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: BetterAuth (email/password, session-based)
- **Fonts**: Inter (sans), JetBrains Mono (mono)
- **Icons**: Lucide React

## Project Structure

```
client/src/
  App.tsx              # Root with marketing/app routing split + auth guard
  lib/
    auth-client.ts     # BetterAuth React client (useSession, signIn, signOut)
    queryClient.ts     # TanStack Query config
  components/
    ui/                # shadcn/ui base components
    app-sidebar.tsx    # Dashboard sidebar navigation
    origin-logo.tsx    # Brand logo component (uses attached logo image)
    theme-provider.tsx # Dark/light mode context
    theme-toggle.tsx   # Theme toggle button
  pages/
    marketing.tsx      # Public landing page (/)
    login.tsx          # Auth login/register page (/login)
    dashboard.tsx      # App dashboard (/app)
    stub.tsx           # Generic stub page for placeholder routes
    sites.tsx          # Site management (/app/sites)
    modules.tsx        # Module browser (/app/modules)
    docs.tsx           # Docs library (/app/docs)
    help.tsx           # Help & Resources (/app/help) — filtered by installs
    marketplace.tsx    # Marketplace browser (/app/marketplace) — install/preview
    billing.tsx        # Billing page (/app/billing)
    analytics.tsx      # Analytics (/app/analytics)
    settings.tsx       # Settings (/app/settings)
    users-admin.tsx    # User admin (/app/users)
    cms-pages.tsx      # Pages list (/app/pages) — search, filter, create
    page-editor.tsx    # Page editor (/app/pages/:pageId) — edit, save, publish, revisions
    collections.tsx    # Collections list (/app/collections) — search, create
    collection-detail.tsx # Collection detail (/app/collections/:id) — schema builder, items list
    collection-item-editor.tsx # Item editor (/app/collections/:id/items/:itemId) — auto-form, revisions
    not-found.tsx      # 404 page

server/
  index.ts             # Express server entry (BetterAuth mounted before JSON middleware)
  auth.ts              # BetterAuth config with Drizzle adapter
  db.ts                # PostgreSQL connection (Drizzle)
  routes.ts            # Route registration (delegates to registry)
  seed.ts              # Database seed data (admin user, workspace, site, marketplace items)
  storage.ts           # Storage interface for all entities
  modules/
    registry.ts        # Route aggregator (registers all modules)
    shared/
      errors.ts        # AppError, NotFoundError, ValidationError
      validate.ts      # Zod validation middleware
      auth-middleware.ts # requireAuth, requireRole, requireWorkspaceContext
    health/            # Health check module
    docs/              # Documentation CRUD module (enhanced with admin routes)
    modules/           # Platform modules module
    auth/              # Auth/workspace routes module
    billing/           # Stripe billing module (checkout, portal, webhooks)
    marketplace/       # Marketplace module (items, installs, preview sessions)
    component-registry/ # Component registry module (page builder components)
    cmsPages/          # CMS pages module (pages, revisions, publishing)
    cmsCollections/    # Collections module (custom content types, items, revisions)

shared/
  schema.ts            # Drizzle schema + Zod types for all entities
  component-registry.ts # Component registry definitions (types + 10 components)

docs/
  ORIGIN_DOCS_GOVERNANCE.md  # Doc requirements and definition of done
  ARCHITECTURE.md            # Architecture overview
  CODING_STANDARDS.md        # Coding standards
  MODULE_DEVELOPMENT.md      # Module creation guide
  API_REFERENCE.md           # API documentation
  AUTH_BETTERAUTH.md         # BetterAuth setup and usage
  TENANCY_AND_RBAC.md        # Tenancy model and RBAC docs
  APP_SHELL_NAV.md           # App shell navigation and role gating
  BILLING_STRIPE.md          # Stripe billing setup, products, webhook events
  DOCS_LIBRARY_SYSTEM.md     # Docs Library system architecture
  RESOURCE_DOCS_SYSTEM.md    # Help & Resources filtered docs system
  MARKETPLACE_FRAMEWORK.md   # Marketplace framework architecture
  COMPONENT_REGISTRY.md      # Component registry architecture
  PAGES_REVISIONS_PUBLISHING.md # CMS pages, revisions, and publishing
  COLLECTIONS_SYSTEM.md        # Collections system architecture
```

## Database Tables

- `users` — User accounts (BetterAuth managed + role field)
- `sessions` — Active sessions (BetterAuth + active_workspace_id)
- `accounts` — OAuth/credential links (BetterAuth)
- `verifications` — Email verification tokens (BetterAuth)
- `workspaces` — Tenant workspaces
- `memberships` — User-workspace-role links
- `sites` — Websites owned by workspaces
- `audit_log` — Auth and workspace event audit trail
- `doc_entries` — In-app documentation (developer + help types)
- `origin_modules` — Platform module registry
- `stripe_customers` — Workspace-to-Stripe customer mapping
- `subscriptions` — Subscription state (webhook-driven)
- `entitlements` — Feature flags and limits per workspace
- `marketplace_items` — Marketplace catalog (site-kits, sections, widgets, apps, add-ons)
- `marketplace_installs` — Per-workspace item installations
- `preview_sessions` — Non-destructive preview session state
- `pages` — CMS pages scoped by workspace + site
- `page_revisions` — Revision history for pages (max 10 per page)
- `collections` — Custom content type definitions scoped by workspace + site
- `collection_items` — Items within collections (DRAFT/PUBLISHED)
- `collection_item_revisions` — Revision history for items (max 10 per item)

## Key Patterns

### Server Module Pattern
Each module: `server/modules/<name>/` with `index.ts`, `<name>.routes.ts`, `<name>.service.ts`

### Authentication Flow
1. BetterAuth handles `/api/auth/*` routes (sign-up, sign-in, sign-out, get-session)
2. Frontend uses `useSession()` hook from `better-auth/react`
3. App layout checks session and redirects unauthenticated users to /login
4. After login, user can select workspace via `/api/user/select-workspace`

### Middleware Stack
- `requireAuth()` — Validates BetterAuth session, populates req.user
- `requireRole(...roles)` — Checks global role (SUPER_ADMIN bypasses)
- `requireWorkspaceContext()` — Ensures workspace is selected
- `requireWorkspaceRole(...roles)` — Checks workspace membership role

### Routing
- `/` — Marketing landing page (public)
- `/login` — Authentication page (login/register)
- `/app` — Dashboard (requires auth)
- `/app/pages` — Pages list
- `/app/pages/:pageId` — Page editor
- `/app/marketplace` — Marketplace browser
- `/app/help` — Help & Resources (filtered by installs)
- `/app/docs` — Docs Library (all docs, developer-facing)
- `/app/billing` — Billing page
- `/app/studio` — Platform Studio dashboard (SUPER_ADMIN/AGENCY_ADMIN only)
- `/app/studio/*` — Platform Studio pages
- `/api/auth/*` — BetterAuth endpoints
- `/api/user/*` — User/workspace endpoints
- `/api/docs/*` — Documentation endpoints
- `/api/marketplace/*` — Marketplace endpoints
- `/api/billing/*` — Billing endpoints
- `/app/collections` — Collections list
- `/app/collections/:id` — Collection detail (schema + items)
- `/app/collections/:id/items/:itemId` — Item editor
- `/api/cms/*` — CMS pages + collections endpoints
- `/api/component-registry` — Component registry endpoints
- `/api/webhooks/stripe` — Stripe webhook endpoint

### CMS Pages System
- Pages scoped by workspace_id + site_id
- Auto-revision on every save (draft or publish)
- Max 10 revisions per page (oldest pruned)
- Status: DRAFT | PUBLISHED
- Rollback creates NEW revision from prior snapshot
- Publishing is explicit, updates published_at

### Collections System
- Collections scoped by workspace_id + site_id
- Schema stored as JSON array of CollectionField objects
- 9 field types: text, richtext, number, boolean, date, image, select, multiselect, url
- Items belong to a collection, store data matching the schema
- Auto-revision on every save (max 10, oldest pruned)
- Status: DRAFT | PUBLISHED
- Rollback creates NEW revision from prior snapshot (non-destructive)
- Auto-generated form in item editor based on schema fields

### Documentation System
- **Docs Library** (`/app/docs`): All developer docs, accessible from Studio sidebar
- **Help & Resources** (`/app/help`): Client-facing help docs, filtered by installed marketplace items
- Doc types: `developer` (Docs Library) and `help` (Help & Resources)
- Marketplace-category docs only visible when the corresponding item is installed
- Admin CRUD routes gated by SUPER_ADMIN/AGENCY_ADMIN role

### Marketplace
- Item types: site-kit, section, widget, app, add-on
- Free items install immediately; paid items require purchase
- All items support non-destructive preview before install
- Install/uninstall is per-workspace
- Each item can have an associated help doc via doc_slug

### Component Registry
- Global catalog of page builder components defined in `shared/component-registry.ts`
- Each component: name, slug, prop schema, presets, preview config, docsMarkdown, devNotes
- 10 initial components: Hero, Feature Grid, Testimonials, Pricing, FAQ, Gallery, CTA, Rich Text, Divider, Spacer
- Served via `/api/component-registry` endpoints
- Read-only UI at `/app/studio/components` in Platform Studio

### App Shell Navigation
- Dual-mode sidebar: Client Workspace view + Platform Studio view
- Mode toggle in sidebar header (only visible to SUPER_ADMIN/AGENCY_ADMIN)
- Topbar: workspace switcher, command palette stub (Cmd+K), theme toggle, user menu
- CRM nav item locked (requires module installation)

### Roles
- SUPER_ADMIN — Platform owner (Digital Alchemy)
- AGENCY_ADMIN — Agency workspace admin
- CLIENT_ADMIN — Client workspace admin
- CLIENT_EDITOR — Content editor
- CLIENT_VIEWER — Read-only access

## Seed Data

- SUPER_ADMIN: `admin@digitalalchemy.dev` / `OriginAdmin2026!`
- Demo workspace: "Digital Alchemy" (enterprise plan)
- Demo site: "Demo Site" (published)
- 24 doc entries (developer + help + marketplace + component registry + pages + collections docs)
- 12 platform modules
- 14 marketplace items (2 site kits, 4 sections, 3 widgets, 2 apps, 3 add-ons)
- 10 registered page builder components

## Docs Update Checklist

Every future prompt that modifies ORIGIN must verify:
1. If a new module/feature is added, create a corresponding doc entry in seed
2. If a new API endpoint is added, update the API Reference doc
3. If a marketplace item is added, create a help doc with category "marketplace"
4. If architecture changes, update the Architecture Overview doc
5. If navigation changes, update the App Shell & Navigation doc
6. Create/update corresponding /docs/*.md file
7. Update replit.md with recent changes

## Recent Changes

- 2026-02-12: Collections system for custom content types
  - Added collections, collection_items, collection_item_revisions DB tables
  - Created cmsCollections server module with full CRUD + revision management
  - 9 field types: text, richtext, number, boolean, date, image, select, multiselect, url
  - Schema stored as JSON array of CollectionField objects with zod validation
  - Auto-revision on every save (max 10, oldest pruned)
  - Rollback creates new revision from prior snapshot (non-destructive)
  - Built Collections list UI with search and create dialog
  - Built Collection detail with tabs (Items list + Schema builder)
  - Built Item editor with auto-generated form based on schema fields
  - Item editor includes save draft, publish, delete, and revisions panel
  - Created COLLECTIONS_SYSTEM.md documentation
  - Seeded 2 new doc entries (developer + help)
  - Non-destructive: existing data preserved

- 2026-02-12: CMS Pages with revision history and publishing
  - Added pages and page_revisions DB tables
  - Created cmsPages server module with full CRUD + revision management
  - Revision pruning: keeps only 10 most recent per page
  - Rollback creates new revision from prior snapshot (non-destructive)
  - Built Pages list UI with search, status filter, create dialog
  - Built Page editor with title/slug/content/SEO editing
  - Editor includes save draft, publish, and revisions panel
  - Added /api/user/sites endpoint for site listing
  - Created PAGES_REVISIONS_PUBLISHING.md documentation
  - Seeded 2 new doc entries (developer + help)
  - Non-destructive: existing data preserved

- 2026-02-12: Component Registry foundation
  - Created shared component registry at shared/component-registry.ts
  - 10 initial components with prop schemas, presets, docs, devNotes
  - Component registry API endpoints
  - Read-only Component Registry UI in Platform Studio
  - Created COMPONENT_REGISTRY.md documentation

- 2026-02-12: Platform logo updated
  - Updated OriginLogo component to use attached brand image
  - Updated favicon.png

## User Preferences

- Brand: ORIGIN with deep navy base + blue gradient accent
- Font: Inter
- Module-based architecture (no giant files)
- Comprehensive documentation required for every change
