# ORIGIN Architecture

## Overview

ORIGIN is a modern website platform built with a modular monolith architecture. It replaces WordPress with a TypeScript-first, module-based approach.

## Tech Stack

- **Frontend**: React, Tailwind CSS, shadcn/ui, wouter, TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with Inter font, Lucide icons

## Project Structure

```
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   │   ├── ui/            # shadcn/ui base components
│   │   │   ├── app-sidebar.tsx # App navigation sidebar
│   │   │   ├── origin-logo.tsx # Brand logo component
│   │   │   ├── theme-provider.tsx # Dark/light mode provider
│   │   │   └── theme-toggle.tsx   # Theme toggle button
│   │   ├── pages/             # Route pages
│   │   │   ├── marketing.tsx  # Public marketing landing page
│   │   │   ├── dashboard.tsx  # App dashboard
│   │   │   ├── sites.tsx      # Site management
│   │   │   ├── modules.tsx    # Module browser
│   │   │   ├── docs.tsx       # Docs library
│   │   │   ├── analytics.tsx  # Analytics dashboard
│   │   │   ├── settings.tsx   # Platform settings
│   │   │   └── users-admin.tsx # User management
│   │   └── App.tsx            # Root component with routing
│   └── index.html             # HTML entry point
├── server/                    # Backend application
│   ├── modules/               # Server modules
│   │   ├── shared/            # Shared utilities
│   │   │   ├── errors.ts      # AppError classes
│   │   │   └── validate.ts    # Zod validation middleware
│   │   ├── health/            # Health check module
│   │   ├── docs/              # Documentation module
│   │   ├── modules/           # Platform modules module
│   │   └── registry.ts        # Module route aggregator
│   ├── db.ts                  # Database connection
│   ├── seed.ts                # Seed data
│   ├── routes.ts              # Route registration
│   └── index.ts               # Server entry point
├── shared/                    # Shared types and schemas
│   └── schema.ts              # Drizzle schema + Zod types
└── docs/                      # Developer documentation
```

## Server Module Pattern

Every backend module follows this structure:

```
server/modules/<moduleName>/
  index.ts              # Module entry, creates Router
  <name>.routes.ts      # Express route handlers
  <name>.service.ts     # Business logic
  <name>.repo.ts        # Database access (Drizzle)
```

### Adding a New Module

1. Create module directory under `server/modules/`
2. Implement repo → service → routes
3. Register in `server/modules/registry.ts`
4. Add schema to `shared/schema.ts`
5. Run `npm run db:push`

## Frontend Architecture

- **Marketing site** (`/`): Public landing page with top navigation
- **App dashboard** (`/app/*`): Authenticated dashboard with left sidebar
- **Routing**: wouter for client-side routing
- **Data fetching**: TanStack Query with `/api` prefix
- **Theming**: Light/dark mode via ThemeProvider

## API Design

- All API routes prefixed with `/api`
- Standard error shape via `AppError` class
- Zod validation middleware for request bodies
- Module-scoped route registration via registry pattern
