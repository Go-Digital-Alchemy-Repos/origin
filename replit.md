# ORIGIN Platform

## Overview

ORIGIN is a modern website platform that replaces WordPress. It provides a modular architecture, visual page builder, and enterprise-grade infrastructure for building, managing, and scaling websites.

**Current State**: MVP with authentication (BetterAuth), multi-tenant workspaces, role-based access control, marketing site, app dashboard, module browser, docs library, and modular server architecture.

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
    analytics.tsx      # Analytics (/app/analytics)
    settings.tsx       # Settings (/app/settings)
    users-admin.tsx    # User admin (/app/users)
    not-found.tsx      # 404 page

server/
  index.ts             # Express server entry (BetterAuth mounted before JSON middleware)
  auth.ts              # BetterAuth config with Drizzle adapter
  db.ts                # PostgreSQL connection (Drizzle)
  routes.ts            # Route registration (delegates to registry)
  seed.ts              # Database seed data (admin user, workspace, site)
  storage.ts           # Storage interface for all entities
  modules/
    registry.ts        # Route aggregator (registers all modules)
    shared/
      errors.ts        # AppError, NotFoundError, ValidationError
      validate.ts      # Zod validation middleware
      auth-middleware.ts # requireAuth, requireRole, requireWorkspaceContext
    health/            # Health check module
    docs/              # Documentation CRUD module
    modules/           # Platform modules module
    auth/              # Auth/workspace routes module

shared/
  schema.ts            # Drizzle schema + Zod types for all entities

docs/
  ORIGIN_DOCS_GOVERNANCE.md  # Doc requirements and definition of done
  ARCHITECTURE.md            # Architecture overview
  CODING_STANDARDS.md        # Coding standards
  MODULE_DEVELOPMENT.md      # Module creation guide
  API_REFERENCE.md           # API documentation
  AUTH_BETTERAUTH.md         # BetterAuth setup and usage
  TENANCY_AND_RBAC.md        # Tenancy model and RBAC docs
  APP_SHELL_NAV.md           # App shell navigation and role gating
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
- `doc_entries` — In-app documentation
- `origin_modules` — Platform module registry

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
- `/app/*` — Client workspace pages (sidebar layout)
- `/app/studio` — Platform Studio dashboard (SUPER_ADMIN/AGENCY_ADMIN only)
- `/app/studio/*` — Platform Studio pages
- `/api/auth/*` — BetterAuth endpoints
- `/api/user/*` — User/workspace endpoints
- `/api/*` — Other API endpoints

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
- 9 doc entries (including auth/tenancy/nav docs)
- 12 platform modules

## Recent Changes

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
