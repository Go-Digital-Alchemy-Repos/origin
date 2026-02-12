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
- `/app/*` — All app pages use sidebar layout
- `/api/auth/*` — BetterAuth endpoints
- `/api/user/*` — User/workspace endpoints
- `/api/*` — Other API endpoints

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
- 8 doc entries (including auth/tenancy docs)
- 12 platform modules

## Recent Changes

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
