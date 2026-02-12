# ORIGIN Platform

## Overview

ORIGIN is a modern website platform designed to replace traditional CMS solutions like WordPress. It offers a modular architecture, a visual page builder, and robust, enterprise-grade infrastructure. The platform aims to simplify website building, management, and scaling for businesses.

Key capabilities include: authentication, multi-tenant workspaces, role-based access control, a marketing site, an app dashboard, a module browser, a documentation library, a marketplace framework, a help & resources section, a component registry, CMS pages with revision history and publishing, a Collections system for custom content types with revisioned items, and a site theme system with semantic tokens and layout presets. The project emphasizes a modular server architecture to ensure scalability and maintainability.

## User Preferences

- Brand: ORIGIN with deep navy base + blue gradient accent
- Font: Inter
- Module-based architecture (no giant files)
- Comprehensive documentation required for every change

## System Architecture

The platform is built with a clear separation of concerns using a modular architecture.

**UI/UX Decisions:**
The frontend utilizes React 18 with Tailwind CSS and shadcn/ui for a modern, component-driven UI. Routing is handled by `wouter`, and data fetching with `TanStack Query`. The design incorporates the Inter font for sans-serif text and JetBrains Mono for monospaced elements, with Lucide React for icons. The branding uses a deep navy base with a blue gradient accent. The application features a dual-mode sidebar for client workspaces and platform studio views, with role-based access to navigation items.

**Technical Implementations:**

-   **Frontend:** React 18, Tailwind CSS, shadcn/ui, wouter, TanStack Query.
-   **Backend:** Express.js 5, TypeScript.
-   **Database:** PostgreSQL with Drizzle ORM.
-   **Authentication:** BetterAuth for email/password and session management.
-   **Server Module Pattern:** Each server module is self-contained with its own `index.ts`, routes, and service files (e.g., `server/modules/<name>/<name>.routes.ts`).
-   **Authentication Flow:** BetterAuth handles core auth routes. The frontend uses `useSession()` for authentication status, redirecting unauthenticated users to `/login`. Users can select workspaces post-login.
-   **Middleware Stack:** Includes `requireAuth()`, `requireRole()`, `requireWorkspaceContext()`, and `requireWorkspaceRole()` for robust access control.
-   **CMS Pages System:** Pages are scoped by workspace and site, with automatic revisioning (keeping the last 10), explicit publishing, and non-destructive rollback.
-   **Collections System:** Custom content types with schema definition (JSON array of field objects), supporting 9 field types. Items within collections have automatic revisioning (last 10), non-destructive rollback, and auto-generated forms in the item editor.
-   **Documentation System:** Features a "Docs Library" for developer documentation and "Help & Resources" for client-facing help, filtered by installed marketplace items.
-   **Component Registry:** A global catalog of reusable page builder components (`shared/component-registry.ts`) with prop schemas, presets, and documentation.

**Feature Specifications:**

-   **Workspaces & Roles:** Supports multi-tenant workspaces with `SUPER_ADMIN`, `AGENCY_ADMIN`, `CLIENT_ADMIN`, `CLIENT_EDITOR`, and `CLIENT_VIEWER` roles.
-   **Marketplace:** Provides various item types (site-kits, sections, widgets, apps, add-ons), allowing for free or paid installations, non-destructive previews, and per-workspace management.
-   **Site Theme System:** Semantic tokens (surface/text/border/accent for light+dark modes) and layout presets (header style, footer style, section spacing, container width, button style) stored per site. Theme editor UI at `/app/sites/theme` with color pickers, layout selectors, and live preview panel. API: GET/PUT `/api/cms/sites/:siteId/theme`.
-   **Page Builder:** Puck-based (`@puckeditor/core`) visual drag-and-drop page builder. Maps Global Component Registry to Puck config. Edits `page_revisions.content_json` with versioned `BuilderContent` envelope. Supports add/remove/reorder blocks, prop inspector, responsive preview (desktop/tablet/mobile). Modular architecture for engine swapability.

## Key Routes

-   `/app/sites/theme` — Site theme editor (tokens, layout, live preview)
-   `/app/pages` — CMS pages list
-   `/app/pages/:pageId` — Page editor
-   `/app/collections` — Collections list
-   `/app/collections/:id` — Collection detail (schema + items)
-   `/app/collections/:id/items/:itemId` — Item editor
-   `/api/cms/sites/:siteId/theme` — Theme GET/PUT

## Database Tables

-   `site_themes` — Per-site theme tokens and layout presets (site_id unique FK)
-   `pages` — CMS pages scoped by workspace + site
-   `page_revisions` — Revision history for pages
-   `collections` — Custom content type definitions
-   `collection_items` — Items within collections
-   `collection_item_revisions` — Revision history for items

## Server Modules

Located at `server/modules/`:
-   `siteTheme/` — Site theme GET/PUT with zod validation
-   `cmsPages/` — CMS pages CRUD + revisions
-   `cmsCollections/` — Collections CRUD + items + revisions
-   `auth/` — Auth/workspace routes
-   `billing/` — Stripe billing
-   `marketplace/` — Marketplace items/installs
-   `component-registry/` — Page builder components
-   `docs/` — Documentation CRUD
-   `health/` — Health check
-   `modules/` — Platform modules

## Recent Changes

- 2026-02-12: Puck page builder integration
  - Installed @puckeditor/core as visual drag-and-drop builder engine
  - Created builder adapter: client/src/lib/builder/puck-adapter.ts (registry → Puck config)
  - Created React component implementations: client/src/lib/builder/components.tsx (10 components)
  - Created builder types with schemaVersion envelope: client/src/lib/builder/types.ts
  - Created shared renderer: client/src/lib/builder/renderer.tsx (content_json → React)
  - Created PuckEditor wrapper: client/src/components/builder/PuckEditor.tsx
  - Updated page-editor.tsx with "Open Builder" button, Details/Content JSON tabs
  - Added responsive preview (desktop/tablet/mobile) and full preview mode
  - Created BUILDER_PUCK_INTEGRATION.md documentation
  - Seeded 2 doc entries (developer + help)

- 2026-02-12: Site theme system
  - Added site_themes DB table with tokens_json + layout_json
  - Created siteTheme server module with GET/PUT + zod validation
  - Semantic tokens: surface, surfaceAlt, text, textMuted, border, accent, accentText (light + dark)
  - Layout presets: headerStyle, footerStyle, sectionSpacing, containerWidth, buttonStyle
  - Built theme editor UI at /app/sites/theme with color pickers, layout selectors, live preview
  - Added Theme nav item in sidebar
  - Created THEME_TOKENS_LAYOUT_PRESETS.md documentation
  - Seeded 2 doc entries (developer + help)

## External Dependencies

-   **Authentication:** BetterAuth
-   **Database:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **Styling:** Tailwind CSS
-   **UI Components:** shadcn/ui
-   **Routing:** wouter
-   **Data Fetching:** TanStack Query
-   **Icons:** Lucide React
-   **Billing:** Stripe (for billing, subscriptions, and webhooks)