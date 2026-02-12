# ORIGIN Platform

## Overview

ORIGIN is a modern website platform that replaces WordPress. It provides a modular architecture, visual page builder, and enterprise-grade infrastructure for building, managing, and scaling websites.

**Current State**: MVP with authentication (BetterAuth), multi-tenant workspaces, role-based access control, marketing site, app dashboard, module browser, docs library, marketplace framework, Help & Resources, component registry, and modular server architecture.

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
    origin-logo.tsx    # Brand logo component
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

## Key Patterns

### Server Module Pattern
Each module: `server/modules/<name>/` with `index.ts`, `<name>.routes.ts`, `<name>.service.ts`, `<name>.repo.ts`

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
- `/api/component-registry` — Component registry endpoints
- `/api/webhooks/stripe` — Stripe webhook endpoint

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
- Powers: builder palette (planned), section presets (planned), marketplace packs (planned), resource docs (active)

### App Shell Navigation
- Dual-mode sidebar: Client Workspace view + Platform Studio view
- Mode toggle in sidebar header (only visible to SUPER_ADMIN/AGENCY_ADMIN)
- Topbar: workspace switcher, command palette stub (Cmd+K), theme toggle, user menu
- CRM nav item locked (requires module installation)
- See docs/APP_SHELL_NAV.md for full nav reference

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
- 20 doc entries (developer + help + marketplace + component registry docs)
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

- 2026-02-12: Component Registry foundation
  - Created shared component registry at shared/component-registry.ts
  - Defined RegistryComponent type with prop schema, presets, preview config, docs, devNotes
  - Added 10 initial components: Hero, Feature Grid, Testimonials, Pricing, FAQ, Gallery, CTA, Rich Text, Divider, Spacer
  - Created component-registry server module with GET /api/component-registry endpoints
  - Built read-only Component Registry UI at /app/studio/components (Platform Studio)
  - UI features: category tabs, search, component detail with Props/Presets, Usage Docs, Dev Notes tabs
  - Created COMPONENT_REGISTRY.md documentation
  - Seeded 2 new doc entries (developer + help) for component registry
  - Non-destructive: existing data preserved

- 2026-02-12: Documentation systems + Marketplace framework
  - Fixed webhook routing bug (double /webhooks prefix)
  - Enhanced docs module: full CRUD, search, type/category filtering, role-gated admin routes
  - Created marketplace module: items, installs, preview sessions
  - Added marketplace_items, marketplace_installs, preview_sessions DB tables
  - Built Help & Resources page filtered by installed marketplace items
  - Built Marketplace browser with category tabs, item detail, install/uninstall, preview modal
  - Seeded 14 marketplace items across all types
  - Seeded 4 marketplace-specific help docs + 4 system doc entries
  - Created DOCS_LIBRARY_SYSTEM.md, RESOURCE_DOCS_SYSTEM.md, MARKETPLACE_FRAMEWORK.md
  - Non-destructive: existing data preserved

- 2026-02-12: Stripe billing foundation
  - Added stripe_customers, subscriptions, entitlements DB tables
  - Created billing module: checkout sessions, customer portal, webhook handler
  - Webhook signature verification with raw body handling
  - Hybrid pricing: base plan + per-site quantity line items
  - Entitlements auto-updated on webhook events (features + limits)
  - Built billing page UI with plan cards, subscription status, manage button
  - Added Billing nav item to client workspace sidebar
  - Created BILLING_STRIPE.md docs and seeded billing doc entry
  - Non-destructive: existing data preserved

- 2026-02-12: App shell with dual-mode navigation
  - Built dual-mode sidebar: Client Workspace view + Platform Studio view
  - Added workspace switcher dropdown in topbar
  - Added command palette trigger stub (Cmd+K)
  - Added user menu dropdown with profile and sign-out
  - Created stub pages for all nav items (Pages, Collections, Blog, Media, Forms, Menus, Marketplace, CRM, Help)
  - Created Platform Studio stubs (Platform Dashboard, Clients, Sites, Site Kits, Sections, Widgets, Apps, Marketplace Catalog, Component Registry, System Status, Billing & Plans, Audit Logs)
  - CRM nav item locked behind module installation
  - Mode toggle visible only to SUPER_ADMIN/AGENCY_ADMIN
  - Created APP_SHELL_NAV.md docs and seeded doc entry
  - Non-destructive seed: adds missing docs without overwriting existing

- 2026-02-12: BetterAuth integration + tenancy foundations
  - Added BetterAuth with Drizzle adapter for email/password auth
  - Created tenancy model: workspaces, memberships, sites, audit_log tables
  - Implemented auth middleware: requireAuth, requireRole, requireWorkspaceContext
  - Built /login page with login/register toggle
  - Added auth guard to app layout (redirects to /login)
  - Added user menu with avatar and sign-out
  - Updated marketing links to point to /login
  - Seeded SUPER_ADMIN user, demo workspace, demo site
  - Created AUTH_BETTERAUTH.md and TENANCY_AND_RBAC.md docs
  - Added auth/tenancy doc entries to in-app Docs Library

- 2026-02-12: Initial MVP foundation
  - Created modular server architecture with health, docs, modules
  - Built marketing landing page with hero, features, pricing
  - Built app dashboard with sidebar navigation
  - Added Docs Library with search and detail view
  - Added Module browser with category tabs
  - Added Analytics, Sites, Users, Settings pages
  - Implemented dark/light mode theming
  - Created docs governance framework
  - Seeded database with docs and modules

## User Preferences

- Brand: ORIGIN with deep navy base + blue gradient accent
- Font: Inter
- Module-based architecture (no giant files)
- Comprehensive documentation required for every change
