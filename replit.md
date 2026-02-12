# ORIGIN Platform

## Overview

ORIGIN is a modern website platform designed to replace traditional CMS solutions like WordPress. It offers a modular architecture, a visual page builder, and robust, enterprise-grade infrastructure. The platform aims to simplify website building, management, and scaling for businesses.

Key capabilities include: authentication, multi-tenant workspaces, role-based access control, a marketing site, an app dashboard, a module browser, a documentation library, a marketplace framework, a help & resources section, a component registry, CMS pages with revision history and publishing, a Collections system for custom content types with revisioned items, a site theme system with semantic tokens and layout presets, and a public site rendering system with subdomain/custom domain routing. The project emphasizes a modular server architecture to ensure scalability and maintainability.

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
-   **Public Site Rendering:** Server-side HTML rendering of published pages. Host resolver middleware intercepts requests by hostname (subdomain `<slug>.originapp.ai` or custom domain via `site_domains`). All 10 builder block types render server-side. Cache headers + purge hooks for CDN integration.

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
-   `/app/forms` — Forms list and builder
-   `/api/cms/sites/:siteId/forms` — Forms CRUD
-   `/api/cms/public/forms/:formId/submit` — Public form submission
-   `/api/cms/public/forms/:formId/definition` — Public form definition
-   `/api/public-preview/:siteSlug` — Public site preview (dev testing)
-   `<slug>.originapp.ai/*` — Public site rendering (production, hostname-based)
-   `/app/redirects` — Redirects manager
-   `/api/cms/sites/:siteId/redirects` — Redirects CRUD
-   `/api/cms/sites/:siteId/redirects/import` — CSV bulk import
-   `/api/cms/sites/:siteId/redirect-suggestions` — Migration suggestions
-   `/app/sites/seo` — Site SEO settings editor
-   `/api/cms/sites/:siteId/seo` — SEO settings GET/PUT

## Database Tables

-   `site_seo_settings` — Per-site SEO defaults (title_suffix, default_og_image, default_indexable, robots_txt)
-   `site_themes` — Per-site theme tokens and layout presets (site_id unique FK)
-   `site_domains` — Custom domain mappings (site_id, domain, is_primary, verified_at)
-   `menus` — Navigation menus scoped by workspace + site, with optional slot (header/footer)
-   `menu_items` — Menu items with parent_id nesting, sort_order, type (page/collection_list/collection_item/external_url), target
-   `pages` — CMS pages scoped by workspace + site
-   `page_revisions` — Revision history for pages
-   `collections` — Custom content type definitions
-   `collection_items` — Items within collections
-   `collection_item_revisions` — Revision history for items
-   `forms` — Form definitions with fields_json + settings_json (workspace + site scoped)
-   `form_submissions` — Submission payloads with IP hash + user agent
-   `redirects` — URL redirect rules per site (from_path, to_url, code 301/302)
-   `redirect_suggestions` — Suggested redirects from importers (e.g., WP migration)

## Server Modules

Located at `server/modules/`:
-   `siteTheme/` — Site theme GET/PUT with zod validation
-   `cmsPages/` — CMS pages CRUD + revisions
-   `cmsCollections/` — Collections CRUD + items + revisions
-   `cmsMenus/` — Navigation menus CRUD + items + reorder + slot assignment
-   `forms/` — Forms CRUD + public submit + definition endpoint + submissions
-   `redirects/` — Redirect rules CRUD + CSV import + suggestions + public routing integration
-   `seo/` — Site SEO settings CRUD, sitemap.xml generation, robots.txt
-   `publicSite/` — Public site rendering, host resolver, cache headers + purge
-   `auth/` — Auth/workspace routes
-   `billing/` — Stripe billing
-   `marketplace/` — Marketplace items/installs
-   `component-registry/` — Page builder components
-   `docs/` — Documentation CRUD
-   `health/` — Health check
-   `modules/` — Platform modules

## Recent Changes

- 2026-02-12: SEO system
  - Added canonical_url, indexable, og_title, og_description, og_image columns to pages table
  - Created site_seo_settings table for site-level defaults (title_suffix, default_og_image, default_indexable, robots_txt)
  - Created seo server module (service, routes) with CRUD + sitemap.xml + robots.txt generation
  - Updated public site renderer with canonical links, noindex meta, OG tags, title suffix
  - Integrated sitemap.xml and robots.txt routes into public site routing (before catch-all)
  - Expanded page editor SEO panel with canonical URL, indexable toggle, OG fields, character counters
  - Built Site SEO Settings UI at /app/sites/seo with title suffix, default OG image, robots.txt editor
  - Added SEO nav item in sidebar
  - Created docs/SEO_SYSTEM.md documentation
  - Seeded 2 doc entries (developer + help)

- 2026-02-12: Redirects system
  - Added redirects + redirect_suggestions DB tables
  - Created redirects server module (service, routes) with full CRUD + CSV bulk import
  - Redirect resolution integrated early in public site routing (before page lookup)
  - Migration hook: redirect_suggestions table for WP importer (accept/dismiss workflow)
  - Built redirects UI page at /app/redirects with table view, add/edit dialog, CSV import
  - Added Redirects nav item in sidebar
  - Created docs/REDIRECTS_SYSTEM.md documentation
  - Seeded 2 doc entries (developer + help)

- 2026-02-12: Forms system (Gravity Forms-style)
  - Added forms + form_submissions DB tables with JSONB fields for flexible config
  - Created forms server module (service, routes) with full CRUD + public submit + definition endpoint
  - 8 field types: text, textarea, email, phone, select, checkbox, radio, date
  - Spam protection: honeypot hidden field + IP-based rate limiting (configurable per minute)
  - Webhook integration: POST submission data to external URLs
  - Built forms UI page at /app/forms with field builder, settings editor, preview, and submissions viewer
  - Added FormEmbed component to component registry + React render map + public site renderer
  - Public endpoints: submit form + get form definition (no auth required)
  - Seeded 2 doc entries (developer + help)

- 2026-02-12: Navigation menus system
  - Added menus + menu_items DB tables with parent_id nesting and sort_order
  - Created cmsMenus server module (service, routes) with full CRUD + reorder + slot assignment
  - Built menus UI page at /app/menus with drag/drop tree editor, indent/outdent, item type selector
  - Menu items support 4 types: page, collection_list, collection_item, external_url
  - Slot assignment (header/footer) auto-renders menus on public site
  - Integrated menu rendering into publicSite renderer (header nav + footer links)
  - Updated public preview route to include menu data
  - Seeded 2 doc entries (developer + help)

- 2026-02-12: Public site rendering & domain routing
  - Added site_domains DB table for custom domain mappings
  - Created publicSite server module (service, routes, renderer, cache)
  - Host resolver middleware intercepts requests by hostname before Vite
  - Subdomain routing: <slug>.originapp.ai
  - Custom domain support via site_domains table
  - Server-side HTML rendering for all 10 builder block types
  - Cache headers (60s browser + 5min stale-while-revalidate) + purge hooks
  - Preview API: GET /api/public-preview/:siteSlug for dev testing
  - Auto-purge on CMS page publish
  - Created PUBLIC_RENDERING_DOMAINS.md documentation
  - Seeded 2 doc entries (developer + help)

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