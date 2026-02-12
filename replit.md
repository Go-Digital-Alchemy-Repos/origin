# ORIGIN Platform

## Overview

ORIGIN is a modern website platform that replaces WordPress. It provides a modular architecture, visual page builder, and enterprise-grade infrastructure for building, managing, and scaling websites.

**Current State**: MVP foundation with marketing site, app dashboard, module browser, docs library, and modular server architecture.

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, shadcn/ui, wouter (routing), TanStack Query
- **Backend**: Express.js 5, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Fonts**: Inter (sans), JetBrains Mono (mono)
- **Icons**: Lucide React

## Project Structure

```
client/src/
  App.tsx              # Root with marketing/app routing split
  components/
    ui/                # shadcn/ui base components
    app-sidebar.tsx    # Dashboard sidebar navigation
    origin-logo.tsx    # Brand logo component
    theme-provider.tsx # Dark/light mode context
    theme-toggle.tsx   # Theme toggle button
  pages/
    marketing.tsx      # Public landing page (/)
    dashboard.tsx      # App dashboard (/app)
    sites.tsx          # Site management (/app/sites)
    modules.tsx        # Module browser (/app/modules)
    docs.tsx           # Docs library (/app/docs)
    analytics.tsx      # Analytics (/app/analytics)
    settings.tsx       # Settings (/app/settings)
    users-admin.tsx    # User admin (/app/users)
    not-found.tsx      # 404 page

server/
  index.ts             # Express server entry
  db.ts                # PostgreSQL connection (Drizzle)
  routes.ts            # Route registration (delegates to registry)
  seed.ts              # Database seed data
  storage.ts           # User storage interface
  modules/
    registry.ts        # Route aggregator (registers all modules)
    shared/
      errors.ts        # AppError, NotFoundError, ValidationError
      validate.ts      # Zod validation middleware
    health/            # Health check module
    docs/              # Documentation CRUD module
    modules/           # Platform modules module

shared/
  schema.ts            # Drizzle schema + Zod types for all entities

docs/
  ORIGIN_DOCS_GOVERNANCE.md  # Doc requirements and definition of done
  ARCHITECTURE.md            # Architecture overview
  CODING_STANDARDS.md        # Coding standards
  MODULE_DEVELOPMENT.md      # Module creation guide
  API_REFERENCE.md           # API documentation
```

## Key Patterns

### Server Module Pattern
Each module: `server/modules/<name>/` with `index.ts`, `<name>.routes.ts`, `<name>.service.ts`, `<name>.repo.ts`

### Adding a New Module
1. Create directory under `server/modules/`
2. Implement repo → service → routes → index
3. Register in `server/modules/registry.ts`
4. Add schema to `shared/schema.ts`
5. Run `npm run db:push`

### Routing
- `/` — Marketing landing page (public)
- `/app` — Dashboard (app layout with sidebar)
- `/app/*` — All app pages use sidebar layout
- `/api/*` — API endpoints

### API Endpoints
- GET /api/health
- GET /api/docs, GET /api/docs/:slug, POST /api/docs
- GET /api/modules, GET /api/modules/:slug

## Recent Changes

- 2026-02-12: Initial MVP foundation
  - Created modular server architecture with health, docs, modules
  - Built marketing landing page with hero, features, pricing
  - Built app dashboard with sidebar navigation
  - Added Docs Library with search and detail view
  - Added Module browser with category tabs
  - Added Analytics, Sites, Users, Settings pages
  - Implemented dark/light mode theming
  - Created docs governance framework
  - Seeded database with 6 docs and 12 modules

## User Preferences

- Brand: ORIGIN with deep navy base + blue gradient accent
- Font: Inter
- Module-based architecture (no giant files)
- Comprehensive documentation required for every change
