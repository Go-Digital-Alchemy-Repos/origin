# ORIGIN Platform

## Overview

ORIGIN is a modern website platform designed as a modular, enterprise-grade replacement for traditional CMS solutions. It aims to simplify website building, management, and scaling through a visual page builder and robust infrastructure. Key capabilities include authentication, multi-tenant workspaces, role-based access control, a comprehensive module ecosystem (marketplace, documentation, component registry), advanced CMS features (pages with revision history, custom content types via Collections), a flexible site theme system, and a public site rendering system with custom domain support. The project emphasizes scalability and maintainability through a modular server architecture.

## User Preferences

- Brand: ORIGIN with deep navy base + blue gradient accent
- Font: Inter
- Module-based architecture (no giant files)
- Comprehensive documentation required for every change

## System Architecture

The platform employs a modular architecture with a clear separation of concerns.

**UI/UX Decisions:**
The frontend uses React 18, Tailwind CSS, and shadcn/ui. `wouter` handles routing, and `TanStack Query` manages data fetching. Typography features Inter for sans-serif and JetBrains Mono for monospaced text, with Lucide React for icons. The branding uses a deep navy base with a blue gradient accent. The application includes a dual-mode sidebar for client workspaces and platform studio views, with role-based navigation.

**Technical Implementations:**

-   **Frontend Stack:** React 18, Tailwind CSS, shadcn/ui, wouter, TanStack Query.
-   **Backend Stack:** Express.js 5, TypeScript.
-   **Database:** PostgreSQL with Drizzle ORM.
-   **Authentication:** BetterAuth for email/password and session management, integrated with `useSession()` for frontend authentication state.
-   **Server Module Pattern:** Self-contained modules (e.g., `server/modules/<name>/`) with dedicated routes and service files.
-   **Middleware:** `requireAuth()`, `requireRole()`, `requireWorkspaceContext()`, `requireWorkspaceRole()`, and `requireEntitlement(featureKey)` enforce access control. Shared `getWorkspaceId()` helper in `auth-middleware.ts` for DRY workspace extraction. `validateBody(schema)` middleware in `shared/validate.ts` for request body validation.
-   **Error Handling:** Standardized error response shape `{ error: { message, code } }` across all routes. Global `ZodError` handler in `routes.ts`. Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `RATE_LIMITED`.
-   **CMS Pages:** Workspace and site-scoped pages with automatic revisioning (last 10), explicit publishing, and non-destructive rollback.
-   **Collections System:** Defines custom content types with JSON schema, supporting 9 field types. Includes automatic item revisioning, non-destructive rollback, and auto-generated editor forms.
-   **Documentation System:** Separate "Docs Library" for developers and "Help & Resources" for clients, filterable by installed marketplace items.
-   **Component Registry:** A global catalog of reusable page builder components (`shared/component-registry.ts`) with prop schemas, presets, and documentation.
-   **Public Site Rendering:** Server-side HTML rendering of published pages, supporting subdomain (`<slug>.originapp.ai`) and custom domain routing. Includes cache headers and purge hooks for CDN integration. All 10 builder block types are server-rendered.
-   **Blog System:** Turnkey blog built on Collections, with setup wizard, public routes (`/blog`, `/blog/:slug`), and management UI.
-   **SEO System:** Per-page and site-level SEO settings, including canonical URLs, indexable control, OG tags, sitemap.xml, and robots.txt generation.
-   **Redirects System:** Manages 301/302 redirects with CRUD, CSV import, and integration into public site routing.
-   **Forms System:** Gravity Forms-style form builder with various field types, spam protection (honeypot, IP rate limiting), webhook integration, and public submission endpoints.
-   **Navigation Menus:** Tree-structured menus with nested items, supporting pages, collection items, and external URLs, assignable to header/footer slots.
-   **Page Builder:** Utilizes `@puckeditor/core` for a visual drag-and-drop experience, mapping to the Global Component Registry. Supports responsive previews and versioned content. Feature-flagged Webflow-like Editor Shell (`VITE_EDITOR_SHELL=true`) provides a premium 3-pane layout (Left Rail components/navigator, Center Canvas, Right Rail style/settings/CMS) with custom editor design tokens, reusable primitives, canvas overlay system, and viewport breakpoint controls.
-   **Site Theme System:** Per-site semantic tokens (surface, text, accent for light/dark modes) and layout presets (header, footer, spacing, container, buttons) configurable via a theme editor UI.
-   **Marketplace Purchasing:** Stripe-backed purchases for marketplace items with billing types (free, subscription, one_time). `workspace_purchases` table tracks purchases. Checkout via Stripe sessions, webhook-driven purchase recording, and install gating for paid items.
-   **Marketplace Versioning:** SemVer-based version management with non-destructive deprecation, platform compatibility checks (`minPlatformVersion`), install version tracking (`installedVersion`), and changelog history (`marketplace_changelogs` table). Super Admin UI at `/app/studio/marketplace` for version bumps, deprecation toggles, and changelog management. Deprecated items hidden from new installs but remain functional for existing users.
-   **WordPress Migration:** XML import pipeline with non-destructive content creation (DRAFT status, slug collision handling, redirect suggestions). Workspace-scoped with ownership validation. UI at `/app/migration`.
-   **Site Kits System:** Bundled site packages containing theme presets, page templates, section presets, collection schemas, and starter content. Super Admin creates/manages kits with asset-based architecture (`site_kits` + `site_kit_assets` tables). Publishing auto-creates marketplace items under "site-kit" category. Client install is non-destructive (creates new pages/content without overwriting). Draft kits can be deleted; published kits must be unpublished first. Kits require at least one theme preset and one asset to publish.
-   **AI Copilot Context System:** Enriches AI interactions with workspace-specific data (entitlements, installed apps, site pages, collections, menus). Context builder gathers data in parallel and injects it into prompt templates. Four templates: General Assistant, Content Strategy, Lead Capture & CRM, Site Optimization. Rule-based `/suggest` endpoint works without API key. `/chat` endpoint requires `OPENAI_API_KEY`. Non-destructive (read-only context gathering).

-   **ORIGIN App Add-on Generator:** CLI-based scaffolding system for workspace-scoped apps (`scripts/generate-origin-app.ts`). App contracts defined in `shared/originApps/` with registry pattern. Generated apps are inert until explicitly published and entitled. Runtime wiring uses `WorkspaceGuard` component, entitlement-gated sidebar nav injection, and server-side `requireEntitlement()` middleware. Studio Apps Catalog at `/app/studio/apps`. Safety: no polling, no auto-recompute, global `retry: false`, workspace context required before any queries.

**Core Server Modules:**
`siteTheme/`, `cmsPages/`, `cmsCollections/`, `cmsMenus/`, `forms/`, `redirects/`, `seo/`, `blog/`, `publicSite/`, `auth/`, `billing/`, `marketplace/`, `component-registry/`, `docs/`, `siteKits/`, `aiCopilot/`, `apps/crm/`.

## External Dependencies

-   **Authentication:** BetterAuth
-   **Database:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **Styling:** Tailwind CSS
-   **UI Components:** shadcn/ui
-   **Routing:** wouter
-   **Data Fetching:** TanStack Query
-   **Icons:** Lucide React
-   **Page Builder Core:** @puckeditor/core
-   **Billing:** Stripe (for billing, subscriptions, and webhooks)