import { db } from "./db";
import { docEntries, originModules, users, workspaces, memberships, sites, auditLog, marketplaceItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import { log } from "./index";
import { auth } from "./auth";

const seedDocs = [
  {
    title: "Getting Started with ORIGIN",
    slug: "getting-started",
    content: `Welcome to ORIGIN — the modern platform that replaces WordPress.

## Quick Start

ORIGIN is built on a modular architecture where every feature is a first-class module. This guide will walk you through the basics.

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

Clone the repository and install dependencies:

\`\`\`bash
npm install
npm run db:push
npm run dev
\`\`\`

### Project Structure

ORIGIN uses a clean module-based architecture:

- server/modules/ — Backend modules (routes, services, repos)
- client/src/pages/ — Frontend pages
- shared/ — Shared types and schemas
- docs/ — Developer documentation

### Next Steps

- Browse the Modules page to see available modules
- Check the Architecture guide for deeper understanding
- Read the Module Development guide to build your own`,
    category: "getting-started",
    type: "developer",
    tags: ["setup", "installation", "quickstart"],
    sortOrder: 0,
    isPublished: true,
  },
  {
    title: "Architecture Overview",
    slug: "architecture-overview",
    content: `ORIGIN follows a modular monolith architecture with clear boundaries between modules.

## Core Principles

- Module Independence: Each module is self-contained with its own routes, services, and data access
- Shared Schema: All modules share a single Drizzle schema for type safety
- API-First: Every feature is exposed through a REST API
- Type Safety: End-to-end TypeScript from database to UI

## Server Module Pattern

Each server module follows this structure:

\`\`\`
server/modules/<moduleName>/
  index.ts          — Module entry point and router
  <name>.routes.ts  — Express route handlers
  <name>.service.ts — Business logic
  <name>.repo.ts    — Database access layer
  types.ts          — Module-specific types
\`\`\`

## Route Registration

Modules are registered through the central registry at server/modules/registry.ts. This aggregator pattern keeps the main routes file clean.

## Frontend Architecture

The frontend uses React with wouter for routing, TanStack Query for data fetching, and shadcn/ui for components. Pages are split between marketing (public) and app (authenticated dashboard).`,
    category: "architecture",
    type: "developer",
    tags: ["architecture", "patterns", "modules"],
    sortOrder: 1,
    isPublished: true,
  },
  {
    title: "Creating a New Module",
    slug: "creating-a-module",
    content: `This guide walks through creating a new ORIGIN module from scratch.

## Step 1: Create the Module Directory

Create a new directory under server/modules/ with the following files:

\`\`\`
server/modules/myModule/
  index.ts
  myModule.routes.ts
  myModule.service.ts
  myModule.repo.ts
\`\`\`

## Step 2: Define the Schema

Add your data model to shared/schema.ts using Drizzle ORM:

- Define the table with pgTable()
- Create the insert schema with createInsertSchema()
- Export the types

## Step 3: Implement the Repo

The repo layer handles all database operations using Drizzle queries. Keep it thin — just CRUD operations.

## Step 4: Implement the Service

Business logic goes in the service layer. It calls the repo and adds validation, transformations, and error handling.

## Step 5: Define Routes

Create Express routes that validate input (using Zod middleware) and call the service layer.

## Step 6: Register the Module

Add your module to server/modules/registry.ts so it gets mounted on the API router.

## Step 7: Push Schema

Run npm run db:push to sync your schema to the database.`,
    category: "modules",
    type: "developer",
    tags: ["tutorial", "modules", "development"],
    sortOrder: 2,
    isPublished: true,
  },
  {
    title: "API Reference",
    slug: "api-reference",
    content: `Complete API reference for the ORIGIN platform.

## Base URL

All API endpoints are prefixed with /api.

## Health

- GET /api/health — Check platform health status

## Authentication (BetterAuth)

- POST /api/auth/sign-up/email — Register with email/password
- POST /api/auth/sign-in/email — Login with email/password
- POST /api/auth/sign-out — Sign out current session
- GET /api/auth/get-session — Get current session

## User & Workspace

- GET /api/user/me — Get current user with workspaces
- POST /api/user/select-workspace — Set active workspace
- GET /api/user/workspaces — List user's workspaces

## Docs

- GET /api/docs — List all documentation entries
- GET /api/docs/:slug — Get a single doc by slug
- POST /api/docs — Create a new doc entry

## Modules

- GET /api/modules — List all registered modules
- GET /api/modules/:slug — Get module details by slug

## Error Responses

All errors follow a standard shape:

\`\`\`json
{
  "error": {
    "message": "Human readable message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
\`\`\`

## Status Codes

- 200 — Success
- 201 — Created
- 400 — Validation error
- 401 — Unauthorized
- 403 — Forbidden
- 404 — Resource not found
- 500 — Internal server error`,
    category: "api-reference",
    type: "developer",
    tags: ["api", "reference", "endpoints", "auth"],
    sortOrder: 3,
    isPublished: true,
  },
  {
    title: "Managing Your Sites",
    slug: "managing-sites",
    content: `Learn how to create, configure, and manage your websites in ORIGIN.

## Creating a Site

Navigate to the Sites page from the sidebar and click "New Site". You'll be prompted to:

- Choose a name for your site
- Select a template or start from scratch
- Configure your domain settings

## Site Dashboard

Each site has its own dashboard with:

- Page builder for visual editing
- Media library for assets
- SEO settings
- Analytics overview

## Custom Domains

Connect your own domain in the site settings. ORIGIN automatically provisions SSL certificates and configures DNS.

## Publishing

When your site is ready, click "Publish" to make it live. ORIGIN builds and deploys your site to the edge network for fast global delivery.`,
    category: "help",
    type: "help",
    tags: ["sites", "domains", "publishing"],
    sortOrder: 4,
    isPublished: true,
  },
  {
    title: "Installing Modules",
    slug: "installing-modules",
    content: `ORIGIN's module system lets you add functionality as you need it.

## Browsing Modules

Visit the Modules page in your dashboard to see all available modules. Each module shows:

- Name and description
- Version number
- Whether it's a core module or optional
- Current installation status

## Installing a Module

Click "Install" on any module to add it to your platform. Core modules are pre-installed and cannot be removed.

## Module Categories

- Content: Blog, pages, media management
- Security: Authentication, permissions, audit logs
- Analytics: Traffic tracking, performance monitoring
- Commerce: Product catalog, checkout, subscriptions
- Communication: Forms, email, notifications
- Development: API tools, webhooks, CLI access

## Configuring Modules

After installation, many modules can be configured from the Settings page. Look for module-specific configuration panels.`,
    category: "help",
    type: "help",
    tags: ["modules", "installation", "configuration"],
    sortOrder: 5,
    isPublished: true,
  },
  {
    title: "Authentication & RBAC",
    slug: "authentication-rbac",
    content: `ORIGIN uses BetterAuth for authentication with a workspace-based tenancy model.

## Authentication

ORIGIN supports email/password authentication via BetterAuth. Sessions are managed server-side with secure HTTP-only cookies.

### Login

Navigate to /login to sign in with your email and password. After login, you'll be asked to select a workspace if you belong to multiple workspaces.

### Registration

New users can sign up at the login page. After registration, a personal workspace is automatically created.

## Role-Based Access Control (RBAC)

ORIGIN uses a two-level role system:

### Global Roles
- **SUPER_ADMIN** — Platform owner (Digital Alchemy). Full access to all workspaces, users, and platform settings.

### Workspace Roles
- **AGENCY_ADMIN** — Can manage many client sites under the agency workspace. Full admin access within the workspace.
- **CLIENT_ADMIN** — Administrator of a specific workspace. Can manage sites, users, and settings.
- **CLIENT_EDITOR** — Can edit content and manage sites within the workspace.
- **CLIENT_VIEWER** — Read-only access to workspace content and sites.

## Workspace Scoping

All data access is scoped by workspace. When you select a workspace, all API requests are automatically scoped to that workspace's data. This ensures strict data isolation between workspaces.

## Audit Logging

All authentication events (login, logout, password changes) and workspace actions are logged to the audit trail for security compliance.`,
    category: "guides",
    type: "developer",
    tags: ["auth", "rbac", "roles", "workspaces", "security"],
    sortOrder: 6,
    isPublished: true,
  },
  {
    title: "Tenancy & Workspaces",
    slug: "tenancy-workspaces",
    content: `ORIGIN is built on a multi-tenant workspace model where each workspace is an isolated environment.

## Workspace Model

A workspace represents a tenant in ORIGIN. Each workspace has:

- **Name** — Display name for the workspace
- **Slug** — URL-friendly identifier
- **Owner** — The user who created the workspace
- **Plan** — Subscription tier (starter, pro, enterprise)
- **Members** — Users with assigned roles

## Creating a Workspace

Workspaces are automatically created when a user signs up. SUPER_ADMIN and AGENCY_ADMIN users can create additional workspaces.

## Membership

Users can belong to multiple workspaces with different roles in each. The membership table tracks:

- Which user belongs to which workspace
- Their role within that workspace
- When they joined

## Sites

Sites are owned by workspaces. Each workspace can have multiple sites depending on their plan tier. Sites include:

- Name and slug
- Custom domain configuration
- Status (draft, published, archived)

## Data Isolation

All queries are automatically scoped by workspace_id using middleware. This ensures that users can only access data within their active workspace.`,
    category: "guides",
    type: "developer",
    tags: ["tenancy", "workspaces", "multi-tenant", "sites"],
    sortOrder: 7,
    isPublished: true,
  },
  {
    title: "App Shell & Navigation",
    slug: "app-shell-navigation",
    content: `The ORIGIN app shell provides a dual-mode navigation system that adapts based on user role.

## Navigation Modes

### Client Workspace View
The default view for all authenticated users. Provides access to content management, media, forms, marketplace, and workspace settings.

Key routes: Dashboard (/app), Pages, Collections, Blog, Media, Forms, Menus, Marketplace, CRM (locked), Settings, Help & Resources.

### Platform Studio View
Available only to SUPER_ADMIN and AGENCY_ADMIN roles. Provides platform-wide administration tools.

Key routes: Platform Dashboard (/app/studio), Clients, Sites, Site Kits, Sections, Widgets, Apps, Marketplace Catalog, Component Registry, Docs Library, System Status, Billing & Plans, Audit Logs.

## Mode Switching

Platform users see a toggle in the sidebar header between "Workspace" and "Studio" modes. The active mode is determined by the URL path.

## Top Bar

The top bar includes:
- **Workspace Switcher** — Select active workspace from a dropdown
- **Command Palette** — Search trigger (Cmd+K stub)
- **Theme Toggle** — Light/dark mode
- **User Menu** — Profile, settings, sign out

## Role Gating

| Role | Client View | Studio View |
|------|:-----------:|:-----------:|
| SUPER_ADMIN | Yes | Yes |
| AGENCY_ADMIN | Yes | Yes |
| CLIENT_ADMIN | Yes | No |
| CLIENT_EDITOR | Yes | No |
| CLIENT_VIEWER | Yes | No |

## Locked Items

CRM is gated behind module installation. Locked items appear dimmed with a lock icon.

See /docs/APP_SHELL_NAV.md for full navigation reference.`,
    category: "guides",
    type: "developer",
    tags: ["navigation", "sidebar", "roles", "shell", "studio"],
    sortOrder: 8,
    isPublished: true,
  },
  {
    title: "Billing & Stripe Integration",
    slug: "billing-stripe",
    content: `ORIGIN uses Stripe for subscription billing with a hybrid pricing model.

## Pricing Model

- **Starter** ($29/mo) — Page builder, media library, basic SEO. 1 site included.
- **Pro** ($79/mo + $19/site) — Adds analytics, forms, blog engine. Up to 5 sites.
- **Enterprise** ($199/mo + $9/site) — Full feature access. Unlimited sites.

## Architecture

Webhooks are the source of truth for subscription state. The billing module handles:

- **Checkout Sessions** — Stripe Checkout for subscription purchase
- **Customer Portal** — Self-serve plan changes, payment updates, cancellation
- **Webhook Handler** — Processes Stripe events and updates local DB

## Key Flows

1. User selects a plan on /app/billing
2. Backend creates a Stripe Checkout Session
3. User completes payment on Stripe
4. Webhook fires and updates subscription + entitlements
5. User manages billing via Stripe Customer Portal

## Environment Variables

Required: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and price IDs for each plan.

## Database

- stripe_customers — Links workspaces to Stripe customer IDs
- subscriptions — Tracks subscription status, plan, site quantity, billing period
- entitlements — Feature flags and limits derived from the subscription plan

See /docs/BILLING_STRIPE.md for complete API reference and setup guide.`,
    category: "guides",
    type: "developer",
    tags: ["billing", "stripe", "subscriptions", "payments", "plans"],
    sortOrder: 9,
    isPublished: true,
  },
  {
    title: "Docs Library System",
    slug: "docs-library-system",
    content: `The ORIGIN Docs Library is a Super Admin-facing documentation system stored in the database with category-based organization.

## Overview

All docs are stored in the doc_entries table with category, type, and tag-based organization. Two types exist:

- **developer** — Shown in Super Admin Docs Library (/app/docs)
- **help** — Shown in client Help & Resources (/app/help)

## Categories

Getting Started, Architecture, Modules, API Reference, Guides, Help, Marketplace.

## Admin Management

SUPER_ADMIN and AGENCY_ADMIN users can create, update, and delete docs via the API:

- POST /api/docs — Create doc
- PATCH /api/docs/:id — Update doc
- DELETE /api/docs/:id — Delete doc

## Search

Search via ?q= parameter matches against title, content, and category fields.

See /docs/DOCS_LIBRARY_SYSTEM.md for complete reference.`,
    category: "guides",
    type: "developer",
    tags: ["docs", "library", "admin", "search"],
    sortOrder: 10,
    isPublished: true,
  },
  {
    title: "Help & Resources System",
    slug: "resource-docs-system",
    content: `The Help & Resources page provides client-facing documentation filtered by installed marketplace items.

## How It Works

- General help docs (type: help, category: help/getting-started/guides) are always visible
- Marketplace-specific docs (category: marketplace) only appear when the corresponding item is installed

## Filtering

1. Fetch help docs from /api/docs?type=help
2. Fetch installed items from /api/marketplace/installs
3. Match marketplace docs by doc_slug on installed items
4. Show matching marketplace docs + all general help docs

## Future

- Entitlement-based filtering from the entitlements table
- Builder inspector contextual help
- Component-level documentation

See /docs/RESOURCE_DOCS_SYSTEM.md for complete reference.`,
    category: "guides",
    type: "developer",
    tags: ["docs", "help", "resources", "filtering"],
    sortOrder: 11,
    isPublished: true,
  },
  {
    title: "Marketplace Framework",
    slug: "marketplace-framework",
    content: `The ORIGIN Marketplace provides a browsable catalog of extensions: Site Kits, Sections, Widgets, Apps, and Add-ons.

## Item Types

- **Site Kit** — Theme + template bundle
- **Section** — Reusable page section
- **Widget** — Interactive embeddable component
- **App** — Full application/integration
- **Add-on** — Small utility enhancement

## Key Features

- Unlimited preview before purchase
- Free items install immediately
- Paid items via Stripe checkout
- Non-destructive preview overlays
- Install/uninstall per workspace

## API

- GET /api/marketplace/items — Browse catalog
- POST /api/marketplace/install — Install item
- POST /api/marketplace/preview/start — Start preview

See /docs/MARKETPLACE_FRAMEWORK.md for complete reference.`,
    category: "guides",
    type: "developer",
    tags: ["marketplace", "extensions", "install", "preview"],
    sortOrder: 12,
    isPublished: true,
  },
  {
    title: "Using the Marketplace",
    slug: "help-marketplace",
    content: `Browse, preview, and install extensions from the ORIGIN Marketplace.

## Browsing

Visit the Marketplace from the sidebar to browse available items. Use the category tabs to filter by type:

- Site Kits — Complete website themes and templates
- Sections — Pre-built page sections you can add to any page
- Widgets — Interactive components like search, chat, or social feeds
- Apps — Full applications to extend your workspace
- Add-ons — Small tools and utilities

## Previewing

Click any item to view its details. Use the "Preview" button to see how it would look on your site without making any changes. Previews are completely non-destructive.

## Installing

- **Free items**: Click "Install Free" to add immediately
- **Paid items**: Click "Purchase" to complete checkout, then the item is installed

## Managing Installed Items

Use the "Installed" tab to see all items currently active in your workspace. You can uninstall items at any time.`,
    category: "help",
    type: "help",
    tags: ["marketplace", "install", "preview", "extensions"],
    sortOrder: 13,
    isPublished: true,
  },
  {
    title: "Marketplace Purchasing",
    slug: "marketplace-purchasing",
    content: `The Marketplace Purchasing System extends the ORIGIN Marketplace with Stripe-backed monetization for paid items.

## Billing Types

- **Free** — Install immediately, no payment
- **One-time** — Single Stripe Checkout payment
- **Subscription** — Recurring monthly billing via Stripe

## Purchase Flow

1. User clicks "Purchase" on a paid marketplace item
2. System creates a Stripe Checkout session (payment or subscription mode)
3. User completes payment on Stripe-hosted checkout
4. Webhook records the purchase and auto-installs the item
5. For subscriptions, cancellation revokes the purchase

## API Endpoints

- POST /api/marketplace/checkout — Create Stripe Checkout session for a paid item
- GET /api/marketplace/purchases — List workspace purchases

## Entitlement Middleware

Routes can be gated with \`requireEntitlement(featureKey)\` middleware, which checks the workspace's entitlements features array.

## Install Gating

Paid items require a purchase record in \`workspace_purchases\` before the install endpoint will accept them. Free items bypass this check.

See /docs/MARKETPLACE_PURCHASING.md for complete reference.`,
    category: "guides",
    type: "developer",
    tags: ["marketplace", "purchasing", "stripe", "billing", "entitlements"],
    sortOrder: 14,
    isPublished: true,
  },
  {
    title: "Component Registry",
    slug: "component-registry",
    content: `The Component Registry is ORIGIN's global catalog of page builder components.

## Overview

Each registered component defines its prop schema, default presets, preview configuration, and documentation. The registry powers the builder palette, section presets, marketplace packs, and resource docs.

## Components

The registry ships with 10 foundational components:

- **Hero** — Full-width hero section with headline, CTA, and background image
- **Feature Grid** — Grid layout showcasing features with icons
- **Testimonials** — Customer quotes in grid, carousel, or stacked layouts
- **Pricing** — Plan comparison table with monthly/annual toggle
- **FAQ** — Expandable accordion with optional search
- **Gallery** — Image gallery with grid, masonry, or carousel layouts
- **CTA** — Call-to-action banner with action buttons
- **Rich Text** — Markdown content block with typography styling
- **Divider** — Visual separator with multiple styles
- **Spacer** — Invisible spacing block for vertical rhythm

## API

- GET /api/component-registry — List all components (summary)
- GET /api/component-registry/:slug — Full component detail

## UI

Browse at Studio > Component Registry (/app/studio/components).

See /docs/COMPONENT_REGISTRY.md for complete reference.`,
    category: "architecture",
    type: "developer",
    tags: ["components", "registry", "builder", "presets"],
    sortOrder: 14,
    isPublished: true,
  },
  {
    title: "Using Page Builder Components",
    slug: "help-page-builder-components",
    content: `Learn about the components available in ORIGIN's page builder.

## Available Components

ORIGIN includes a library of pre-built components you can use to build pages:

### Layout
- **Hero** — Eye-catching banner sections with headlines and call-to-action buttons

### Content
- **Feature Grid** — Highlight your features or services in a clean grid
- **FAQ** — Expandable question-and-answer sections
- **CTA** — Attention-grabbing action banners
- **Rich Text** — Free-form content with formatting support

### Media
- **Gallery** — Beautiful image galleries with lightbox support

### Commerce
- **Pricing** — Professional pricing plan comparison tables

### Social Proof
- **Testimonials** — Customer quotes and reviews

### Utility
- **Divider** — Visual separators between sections
- **Spacer** — Invisible spacing for layout control

## How to Use

Each component comes with pre-configured presets you can apply with one click, then customize to match your brand. Browse the full component library in the page builder palette.`,
    category: "help",
    type: "help",
    tags: ["components", "builder", "pages", "sections"],
    sortOrder: 15,
    isPublished: true,
  },
  {
    title: "Pages, Revisions & Publishing",
    slug: "pages-revisions-publishing",
    content: `ORIGIN Pages provides a CMS-style page management system scoped by workspace and site.

## Key Concepts

- **Pages** are scoped by workspace_id + site_id
- Every save (draft or publish) creates a **revision**
- Only the 10 most recent revisions are kept (pruning)
- Page status: DRAFT | PUBLISHED
- Rollback creates a new revision from a prior snapshot

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/cms/sites/:siteId/pages | List pages (query: search, status) |
| POST | /api/cms/sites/:siteId/pages | Create page |
| GET | /api/cms/pages/:pageId | Get page + latest revision |
| PATCH | /api/cms/pages/:pageId | Update page (creates revision) |
| POST | /api/cms/pages/:pageId/publish | Publish page |
| POST | /api/cms/pages/:pageId/rollback/:revisionId | Rollback |
| GET | /api/cms/pages/:pageId/revisions | List revisions |
| DELETE | /api/cms/pages/:pageId | Delete page |

## Architecture

Module: server/modules/cmsPages/
See /docs/PAGES_REVISIONS_PUBLISHING.md for complete reference.`,
    category: "guides",
    type: "developer",
    tags: ["pages", "revisions", "publishing", "cms"],
    sortOrder: 16,
    isPublished: true,
  },
  {
    title: "Managing Pages",
    slug: "help-managing-pages",
    content: `Learn how to create, edit, publish, and manage pages on your ORIGIN site.

## Creating a Page

1. Navigate to **Pages** in the sidebar
2. Click **New Page**
3. Enter a title and URL slug
4. Click **Create Page**

## Editing Pages

Click any page in the list to open the editor. You can edit:
- **Title** — The page name shown in navigation
- **Slug** — The URL path (e.g. /about)
- **Content** — Use the visual drag-and-drop builder or the JSON editor
- **SEO** — Title and description for search engines

## Saving & Publishing

- **Save Draft** — Saves your changes without making them public. Creates a revision.
- **Publish** — Makes the page live and visible to visitors. Also creates a revision.

## Revision History

Every time you save or publish, ORIGIN creates a snapshot of your page. You can view up to 10 recent versions in the **Revisions** panel.

To restore an older version:
1. Click **Revisions** in the editor toolbar
2. Find the version you want
3. Click **Restore**

This creates a new version from the old content — your history is never lost.

## Deleting Pages

Pages can be deleted from the page list. This permanently removes the page and all its revisions.`,
    category: "help",
    type: "help",
    tags: ["pages", "editor", "publishing", "revisions"],
    sortOrder: 16,
    isPublished: true,
  },
  {
    title: "Page Builder — Puck Integration",
    slug: "builder-puck-integration",
    content: `ORIGIN uses Puck (@puckeditor/core) as its visual drag-and-drop page builder engine.

## Architecture

The builder integration is modular — all Puck-specific code is isolated so the engine can be swapped later.

- **Adapter**: client/src/lib/builder/puck-adapter.ts maps the Global Component Registry to Puck config
- **Components**: client/src/lib/builder/components.tsx provides React implementations for all registry components
- **Types**: client/src/lib/builder/types.ts defines the BuilderContent schema with versioning
- **Renderer**: client/src/lib/builder/renderer.tsx converts content_json to React output
- **Editor**: client/src/components/builder/PuckEditor.tsx wraps Puck with responsive preview

## Content Format

Builder output is stored in page_revisions.content_json as:

\`\`\`json
{
  "schemaVersion": 1,
  "data": {
    "content": [{ "type": "hero", "props": { "id": "...", "headline": "..." } }],
    "root": {}
  }
}
\`\`\`

## Guardrails

- No raw CSS — components only accept semantic props (enums, theme tokens)
- Schema validation checks version compatibility
- Registry validation verifies component types exist
- All styling controls use predefined safe options

See /docs/BUILDER_PUCK_INTEGRATION.md for complete reference.`,
    category: "architecture",
    type: "developer",
    tags: ["builder", "puck", "pages", "drag-drop", "components"],
    sortOrder: 17,
    isPublished: true,
  },
  {
    title: "How to Use the Page Builder",
    slug: "help-page-builder",
    content: `ORIGIN includes a visual drag-and-drop page builder to create pages without writing code.

## Getting Started

1. Navigate to **Pages** in the sidebar
2. Click a page to open the editor
3. Click **Open Builder** in the toolbar
4. The full-screen builder opens with components on the left

## Adding Content Blocks

Drag components from the left panel onto the canvas. Available components include:

- **Hero** — Eye-catching banner with headlines and buttons
- **Feature Grid** — Showcase features in a grid layout
- **Testimonials** — Customer reviews and quotes
- **Pricing** — Plan comparison tables
- **FAQ** — Expandable question-and-answer sections
- **Gallery** — Image galleries
- **CTA** — Call-to-action banners
- **Rich Text** — Free-form text content
- **Divider** — Visual separators
- **Spacer** — Invisible spacing

## Editing Blocks

Click any block on the canvas to select it. The right panel shows all its customizable options. Each option uses safe controls — dropdowns, text fields, and toggles — so you can't accidentally break the design.

## Responsive Preview

Use the Desktop, Tablet, and Mobile buttons to preview your page at different screen sizes. Click **Preview** for a clean view without the editor interface.

## Saving Your Work

- **Save Draft** — Saves without publishing (creates a revision)
- **Publish** — Makes the page live
- Close the builder with the X button to return to page settings

All changes are saved as revisions. You can restore any previous version from the Revisions panel.`,
    category: "help",
    type: "help",
    tags: ["builder", "pages", "drag-drop", "editing", "visual"],
    sortOrder: 17,
    isPublished: true,
  },
  {
    title: "Collections System",
    slug: "collections-system",
    content: `ORIGIN Collections lets you define custom content types with flexible schemas and revisioned items.

## Key Concepts

- **Collections** are scoped by workspace_id + site_id
- Each collection has a **schema** (array of typed fields stored as JSON)
- 9 field types: text, richtext, number, boolean, date, image, select, multiselect, url
- **Items** belong to a collection and store data matching the schema
- Every save creates a **revision** (max 10, oldest pruned)
- Item status: DRAFT | PUBLISHED
- Rollback creates a new revision from a prior snapshot

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/cms/sites/:siteId/collections | List collections |
| POST | /api/cms/sites/:siteId/collections | Create collection |
| GET | /api/cms/collections/:id | Get collection |
| PATCH | /api/cms/collections/:id | Update collection (name, slug, schema) |
| DELETE | /api/cms/collections/:id | Delete collection + all items |
| GET | /api/cms/collections/:id/items | List items |
| POST | /api/cms/collections/:id/items | Create item |
| GET | /api/cms/collections/:id/items/:itemId | Get item + latest revision |
| PATCH | /api/cms/collections/:id/items/:itemId | Update item (creates revision) |
| POST | /api/cms/collections/:id/items/:itemId/publish | Publish item |
| POST | /api/cms/collections/:id/items/:itemId/rollback/:revId | Rollback |
| GET | /api/cms/collections/:id/items/:itemId/revisions | List revisions |
| DELETE | /api/cms/collections/:id/items/:itemId | Delete item |

## Architecture

Module: server/modules/cmsCollections/
See /docs/COLLECTIONS_SYSTEM.md for complete reference.`,
    category: "guides",
    type: "developer",
    tags: ["collections", "content-types", "schema", "revisions", "cms"],
    sortOrder: 17,
    isPublished: true,
  },
  {
    title: "Managing Collections",
    slug: "help-managing-collections",
    content: `Learn how to create custom content types and manage structured content with ORIGIN Collections.

## What Are Collections?

Collections let you define your own content types beyond pages. For example, you could create collections for Team Members, Products, Testimonials, or FAQ entries — each with their own set of fields.

## Creating a Collection

1. Navigate to **Collections** in the sidebar
2. Click **New Collection**
3. Enter a name, URL slug, and optional description
4. Click **Create Collection**

## Defining the Schema

After creating a collection, switch to the **Schema** tab to define fields:

1. Click **Add Field**
2. Choose a label, key (auto-generated), and field type
3. Set whether the field is required
4. For Select/Multi-Select types, enter comma-separated options
5. Click **Save Schema** to persist changes

Available field types: Text, Rich Text, Number, Boolean, Date, Image URL, Select, Multi-Select, URL.

## Adding Items

Switch to the **Items** tab and click **New Item**. The editor auto-generates a form based on your schema fields.

## Saving & Publishing Items

- **Save Draft** — Saves changes without making them public. Creates a revision.
- **Publish** — Makes the item live. Also creates a revision.

## Revision History

Every save creates a snapshot. View up to 10 recent versions in the **Revisions** panel. To restore an older version, click **Restore** — this creates a new version from the old data.

## Deleting

- Delete individual items from the item editor
- Delete entire collections (and all items) from the collection detail page`,
    category: "help",
    type: "help",
    tags: ["collections", "content-types", "schema", "items"],
    sortOrder: 17,
    isPublished: true,
  },
  {
    slug: "theme-tokens-layout-presets",
    title: "Theme Tokens & Layout Presets",
    content: `ORIGIN theme system provides safe, semantic styling controls for sites. Themes use semantic tokens (surface, text, border, accent) and layout presets (header style, footer style, spacing, widths, button shape).

## Architecture
- site_themes table: one record per site with tokens_json and layout_json
- GET/PUT /api/cms/sites/:siteId/theme
- Auto-creates defaults if no theme exists
- Zod validation for all token and layout input

## Tokens
7 semantic color slots per mode (light + dark): surface, surfaceAlt, text, textMuted, border, accent, accentText.
Plus: fontHeading, fontBody, borderRadius.

## Layout Presets
headerStyle (standard/centered/minimal/transparent), footerStyle (standard/minimal/columns/centered), sectionSpacing (compact/comfortable/spacious), containerWidth (narrow/standard/wide/full), buttonStyle (square/rounded/pill).

See /docs/THEME_TOKENS_LAYOUT_PRESETS.md for full reference.`,
    category: "guides",
    type: "developer",
    tags: ["theme", "tokens", "layout", "design-system", "styling"],
    sortOrder: 18,
    isPublished: true,
  },
  {
    slug: "help-changing-theme",
    title: "How to Change Your Theme Safely",
    content: `Learn how to customize your site's appearance using ORIGIN's safe theme controls.

## Accessing the Theme Editor
1. Go to Theme in the sidebar
2. Select your site (if you have multiple)

## Changing Colors
- Switch to the Tokens tab
- Use color pickers to set light mode and dark mode colors
- Each color has a semantic purpose (Surface = background, Accent = brand color, etc.)
- Use the live preview panel on the right to see changes instantly

## Changing Layout
- Switch to the Layout tab
- Choose header style, footer style, section spacing, container width, and button shape
- Preview updates in real time

## Typography
- Under Tokens, scroll to Typography & Shape
- Pick heading and body fonts from the dropdown
- Choose your preferred border radius

## Resetting
- Click Reset to restore default theme values
- Changes are only saved when you click Save Theme`,
    category: "help",
    type: "help",
    tags: ["theme", "styling", "design", "customization"],
    sortOrder: 18,
    isPublished: true,
  },
  {
    slug: "public-site-rendering-domains",
    title: "Public Site Rendering & Domain Routing",
    content: `ORIGIN renders published CMS pages as standalone HTML documents served to public visitors via subdomain or custom domain routing.

## Architecture
- Host resolver middleware intercepts requests before the SPA
- Subdomain pattern: \`<site-slug>.originapp.ai\`
- Custom domains via \`site_domains\` table with DNS verification
- Server-side HTML rendering (no JS required)
- Cache headers: 60s browser cache + 5min stale-while-revalidate

## Module Structure
\`\`\`
server/modules/publicSite/
├── publicSite.service.ts    — DB queries (host→site, page lookup)
├── publicSite.routes.ts     — Express routes + host resolver
├── publicSite.renderer.ts   — SSR HTML for all 10 block types
└── publicSite.cache.ts      — Cache headers + purge hooks
\`\`\`

## Key APIs
- Preview: GET /api/public-preview/:siteSlug?page=slug
- Production: hostname-based routing via middleware

## Cache Purge
purgeCache(siteId, pageSlug) is called on page publish. Register CDN purge callbacks via onCachePurge().

See /docs/PUBLIC_RENDERING_DOMAINS.md for full reference.`,
    category: "guides",
    type: "developer",
    tags: ["public-site", "rendering", "domains", "caching", "SSR"],
    sortOrder: 19,
    isPublished: true,
  },
  {
    slug: "help-public-site-preview",
    title: "How to Preview Your Published Site",
    content: `Once you publish pages in ORIGIN, they become available as a standalone public website.

## Previewing Published Pages

1. Go to **Pages** in the sidebar
2. Open a page and click **Publish**
3. Use the preview URL to see how visitors will experience your page

## How It Works

- Published pages are rendered as clean HTML — no login required
- Your site is automatically available at \`<your-site-slug>.originapp.ai\`
- Each published page gets its own URL (e.g., \`yoursite.originapp.ai/about\`)
- The homepage is the first published page with slug "home" or "index"

## Custom Domains

You can connect your own domain (e.g., \`www.mybusiness.com\`) to your ORIGIN site:

1. Add your domain in site settings
2. Point your DNS to ORIGIN's servers
3. Once verified, visitors can access your site at your custom domain

## What Visitors See

- Fast, lightweight pages with no unnecessary scripts
- SEO-friendly with proper titles and meta tags
- Responsive design that works on mobile, tablet, and desktop
- Professional navigation and footer based on your published pages`,
    category: "help",
    type: "help",
    tags: ["public-site", "preview", "publishing", "domains", "SEO"],
    sortOrder: 19,
    isPublished: true,
  },
  {
    title: "Navigation Menus System",
    slug: "navigation-menus-system",
    content: `ORIGIN provides a WordPress-style navigation menu system for managing site navigation.

## Architecture

- **DB Tables**: \`menus\` (per-site, with optional slot assignment) and \`menu_items\` (nested via parent_id, ordered by sort_order)
- **Server Module**: server/modules/cmsMenus/ with service + routes
- **API Prefix**: /api/cms/

## Menu Model

Each menu is scoped to a workspace + site and can optionally be assigned to a slot (header or footer). When assigned, the menu is automatically rendered in that position on the public site.

## Menu Items

Items support four types:
- **page** — links to a CMS page (target = page slug)
- **collection_list** — links to a collection listing
- **collection_item** — links to a specific collection item
- **external_url** — links to any URL

Items can be nested (parent_id) and reordered (sort_order). The tree structure supports unlimited depth.

## API Endpoints

- GET /api/cms/sites/:siteId/menus — list menus
- POST /api/cms/sites/:siteId/menus — create menu
- GET /api/cms/menus/:menuId — get menu with items
- PATCH /api/cms/menus/:menuId — update menu
- DELETE /api/cms/menus/:menuId — delete menu
- POST /api/cms/menus/:menuId/items — add item
- PATCH /api/cms/menus/:menuId/items/:itemId — update item
- DELETE /api/cms/menus/:menuId/items/:itemId — delete item
- PUT /api/cms/menus/:menuId/reorder — reorder items (accepts tree array)

## Public Rendering

The public site renderer fetches menus assigned to header/footer slots and renders them as HTML navigation. Header menus support nested dropdowns; footer menus render as flat link lists.`,
    category: "architecture",
    type: "developer",
    tags: ["menus", "navigation", "cms", "header", "footer"],
    sortOrder: 25,
    isPublished: true,
  },
  {
    title: "Managing Navigation Menus",
    slug: "help-navigation-menus",
    content: `Use ORIGIN's menu system to create and manage navigation for your website.

## Creating a Menu

1. Go to **Menus** in the sidebar
2. Click **New Menu**
3. Give it a name (e.g., "Main Navigation")
4. Optionally assign it to a slot (Header or Footer) to auto-render it on your public site

## Adding Items

1. Open a menu by clicking on it
2. Click **Add Item**
3. Choose the item type:
   - **Page** — select one of your CMS pages
   - **Collection** — link to a collection listing
   - **Collection Item** — link to a specific item
   - **External URL** — link to any web address
4. Enter a label and target

## Organizing Items

- **Drag and drop** items to reorder them
- Use the **arrow buttons** to move items up/down
- Use **indent/outdent** to create nested (dropdown) menus
- Click the **+** button on any item to add a child item beneath it

## Editing and Deleting

- Click the **pencil** icon to edit an item's label, type, or target
- Click the **trash** icon to delete an item

## Slot Assignment

Assigning a menu to the "Header" or "Footer" slot makes it appear automatically on your public website's header or footer navigation.`,
    category: "help",
    type: "help",
    tags: ["menus", "navigation", "header", "footer", "drag-drop"],
    sortOrder: 20,
    isPublished: true,
  },
  {
    title: "Forms System",
    slug: "forms-system",
    content: `ORIGIN's built-in Forms system lets you create customizable forms, collect submissions, and integrate with external services via webhooks.

## Architecture

Forms are scoped by workspace + site and stored in the \`forms\` table with JSONB columns for flexible field definitions and settings.

### Tables
- \`forms\` — Form definitions with \`fields_json\` (field array) and \`settings_json\` (configuration)
- \`form_submissions\` — Submission payloads with IP hash for rate limiting

### Field Types
text, textarea, email, phone, select, checkbox, radio, date

### Settings
- \`submitLabel\` — Custom submit button text
- \`successMessage\` — Post-submission message
- \`notifyEmails\` — Email notification recipients
- \`webhookUrl\` — POST submission data to external URL
- \`honeypotEnabled\` — Hidden field to catch bots
- \`rateLimitPerMinute\` — Max submissions per IP per minute

## API Endpoints

### Authenticated (require auth + workspace context)
- GET /api/cms/sites/:siteId/forms — list forms for a site
- POST /api/cms/sites/:siteId/forms — create form
- GET /api/cms/forms/:formId — get form
- PATCH /api/cms/forms/:formId — update form
- DELETE /api/cms/forms/:formId — delete form
- GET /api/cms/forms/:formId/submissions — list submissions (paginated)
- DELETE /api/cms/forms/:formId/submissions/:submissionId — delete submission

### Public (no auth)
- POST /api/cms/public/forms/:formId/submit — submit form
- GET /api/cms/public/forms/:formId/definition — get form fields/settings for rendering

## Page Builder Integration

The \`form-embed\` component in the Global Component Registry allows embedding forms in pages via the drag-and-drop builder.`,
    category: "architecture",
    type: "developer",
    tags: ["forms", "submissions", "webhooks", "spam-protection", "cms"],
    sortOrder: 26,
    isPublished: true,
  },
  {
    title: "Building and Managing Forms",
    slug: "help-forms",
    content: `Create powerful forms to collect information from your website visitors.

## Creating a Form

1. Go to **Forms** in the sidebar
2. Click **New Form**
3. Give it a name (e.g., "Contact Form")

## Adding Fields

1. Open a form by clicking on it
2. Click **Add Field**
3. Choose a field type:
   - **Text** — short text input
   - **Text Area** — multi-line text
   - **Email** — email address with validation
   - **Phone** — phone number
   - **Dropdown** — select from options
   - **Checkbox** — yes/no toggle
   - **Radio** — choose one from options
   - **Date** — date picker
4. Set the label, placeholder, and whether it's required
5. For Dropdown and Radio fields, enter options (one per line)

## Organizing Fields

Use the **up/down arrows** to reorder fields. Click the **pencil** icon to edit or the **trash** icon to remove.

## Form Settings

Switch to the **Settings** tab to configure:
- **Submit Button Label** — customize the button text
- **Success Message** — what visitors see after submitting
- **Notification Emails** — get notified on each submission
- **Webhook URL** — send data to external services (e.g., Zapier)
- **Spam Protection** — enable honeypot and set rate limits

## Viewing Submissions

Click the **Submissions** button to see all form responses in a table. You can paginate through submissions and delete individual entries.

## Embedding in Pages

Use the **Form Embed** block in the page builder to add a form to any page. Just enter the form ID.

You can also copy an embed code using the **Embed** button in the form editor.`,
    category: "help",
    type: "help",
    tags: ["forms", "submissions", "contact", "embed", "page-builder"],
    sortOrder: 21,
    isPublished: true,
  },
  {
    title: "Redirects System",
    slug: "redirects-system",
    content: `ORIGIN's Redirect Manager provides SEO-safe URL redirection with bulk import and migration support.

## Architecture

Redirects are scoped per site and evaluated early in public routing—before page resolution.

### Tables
- \`redirects\` — Active redirect rules (from_path, to_url, code 301/302)
- \`redirect_suggestions\` — Suggested redirects from importers (e.g., WordPress migration)

### Path Normalization
All \`from_path\` values are normalized: leading slash ensured, trailing slashes stripped.

## API Endpoints

### Authenticated (require auth + workspace context)
- GET /api/cms/sites/:siteId/redirects — list all redirects
- POST /api/cms/sites/:siteId/redirects — create redirect
- PATCH /api/cms/redirects/:redirectId — update redirect
- DELETE /api/cms/redirects/:redirectId — delete redirect
- POST /api/cms/sites/:siteId/redirects/import — bulk import from CSV
- GET /api/cms/sites/:siteId/redirect-suggestions — list suggestions
- POST /api/cms/redirect-suggestions/:id/accept — accept suggestion → create redirect
- DELETE /api/cms/redirect-suggestions/:id — dismiss suggestion

### CSV Import Format
\`\`\`
from_path, to_url, code
/old-page, /new-page, 301
/blog/old, https://example.com/new, 302
\`\`\`
Header row is auto-detected and skipped. Max 1000 rows per import.

## Public Site Integration

Redirects are checked before page resolution in the public site router. When a matching \`from_path\` is found, the server responds with the configured status code (301/302).`,
    category: "architecture",
    type: "developer",
    tags: ["redirects", "seo", "urls", "301", "migration"],
    sortOrder: 27,
    isPublished: true,
  },
  {
    title: "Managing URL Redirects",
    slug: "help-redirects",
    content: `Set up URL redirects to ensure visitors and search engines find your content at its new location.

## Adding a Redirect

1. Go to **Redirects** in the sidebar
2. Click **Add Redirect**
3. Enter the old path (e.g., \`/old-page\`)
4. Enter the new destination (e.g., \`/new-page\` or a full URL)
5. Choose the redirect type:
   - **301 Permanent** — tells search engines the page has moved permanently (best for SEO)
   - **302 Temporary** — tells search engines the move is temporary

## Editing or Deleting Redirects

Click the **pencil** icon to edit or the **trash** icon to delete a redirect from the table.

## Importing from CSV

If you have many redirects to add:
1. Click **Import CSV**
2. Upload a CSV file or paste the content
3. Format: \`from_path, to_url, code\`
4. The code column is optional (defaults to 301)
5. Duplicate paths are automatically skipped

## Suggested Redirects

When you import content from another platform (like WordPress), ORIGIN may suggest redirects for renamed or moved pages. You can accept or dismiss each suggestion.

## Best Practices

- Use **301** redirects for permanent URL changes to preserve SEO value
- Use **302** redirects for temporary changes (e.g., A/B testing)
- Avoid redirect chains (A → B → C); redirect directly from A → C
- Review redirects periodically to remove ones that are no longer needed`,
    category: "help",
    type: "help",
    tags: ["redirects", "seo", "urls", "csv-import", "migration"],
    sortOrder: 22,
    isPublished: true,
  },
  {
    title: "SEO System",
    slug: "seo-system",
    content: `ORIGIN's SEO system provides comprehensive search engine optimization at both page and site levels.

## Architecture

The SEO system consists of page-level fields and site-level defaults that work together for optimal search engine visibility.

### Database Tables

- \`pages\` — Extended with canonical_url, indexable, og_title, og_description, og_image columns
- \`site_seo_settings\` — Per-site defaults (title_suffix, default_og_image, default_indexable, robots_txt)

### Server Module

\`server/modules/seo/\` — SEO settings CRUD with site ownership validation

### API Routes

- GET /api/cms/sites/:siteId/seo — get site SEO settings
- PUT /api/cms/sites/:siteId/seo — upsert site SEO settings

### Public Endpoints (served at site domain)

- /sitemap.xml — auto-generated from published pages
- /robots.txt — customizable with auto-appended sitemap reference

### Page-Level SEO Fields

Each page supports: seoTitle, seoDescription, canonicalUrl, indexable (boolean), ogTitle, ogDescription, ogImage.

### Rendering Behavior

- Title: "Page SEO Title | Site Title Suffix"
- Canonical: explicit canonicalUrl or auto-generated from baseUrl + slug
- Indexable: page-level overrides site default; noindex meta tag when false
- OG tags: page ogTitle/ogDescription/ogImage → fallback to seoTitle/seoDescription → fallback to site defaults
- Sitemap: only includes published, indexable pages with lastmod dates`,
    category: "developer",
    type: "developer",
    tags: ["seo", "sitemap", "robots", "open-graph", "canonical", "meta-tags"],
    sortOrder: 23,
    isPublished: true,
  },
  {
    title: "SEO Settings & Optimization",
    slug: "help-seo",
    content: `Optimize your site for search engines with ORIGIN's built-in SEO tools.

## Site-Level SEO Settings

Go to **SEO** in the sidebar to configure defaults that apply across your site:

- **Title Suffix** — Added after every page title (e.g., "About Us | My Company")
- **Default OG Image** — Used when sharing pages that don't have their own image
- **Default Indexing** — Whether new pages should be indexable by default
- **robots.txt** — Controls how search engines crawl your site

## Page-Level SEO

When editing a page, scroll to the SEO section to set:

- **SEO Title** — Custom title for search results (aim for 50-60 characters)
- **SEO Description** — Summary shown in search results (aim for 150-160 characters)
- **Canonical URL** — Preferred URL for this content (leave blank for automatic)
- **Indexable** — Toggle to control whether search engines can index this page

## Social Sharing (Open Graph)

Set Open Graph fields to control how your pages appear when shared on social media:

- **OG Title** — Custom title for social media sharing
- **OG Description** — Custom description for social sharing
- **OG Image** — Image shown in social previews (recommended: 1200x630px)

## Auto-Generated Files

ORIGIN automatically generates and serves:

- **sitemap.xml** — Lists all published pages with last modified dates
- **robots.txt** — Your custom rules plus an automatic sitemap reference

## Best Practices

- Write unique, descriptive titles for each page
- Keep descriptions concise and compelling
- Set OG images for important pages to improve social sharing
- Use canonical URLs to prevent duplicate content issues
- Review the indexable setting for staging or private pages`,
    category: "help",
    type: "help",
    tags: ["seo", "sitemap", "robots", "social-sharing", "open-graph"],
    sortOrder: 23,
    isPublished: true,
  },
  {
    title: "Blog System",
    slug: "blog-system",
    content: `ORIGIN's Blog System provides a turnkey blogging solution built on top of the Collections framework.

## Architecture

The blog system uses a special "blog-posts" collection with a predefined schema and adds public rendering routes for blog index and detail pages.

### Server Module

\`server/modules/blog/\` — Blog setup wizard, published post queries, and HTML renderers

### API Routes

- GET /api/cms/sites/:siteId/blog/status — check if blog exists, get post counts
- POST /api/cms/sites/:siteId/blog/setup — one-click blog wizard (creates collection + page)
- GET /api/cms/public/blog/:siteId/posts — list published posts (public)
- GET /api/cms/public/blog/:siteId/posts/:slug — get single published post (public)

### Blog Post Schema Fields

title, slug, excerpt, body, featured_image, author, category, tags, published_date, seo_title, seo_description, og_image

### Public Rendering

- /blog — Blog index listing with post cards, categories, dates
- /blog/:slug — Full article page with Article structured data (schema.org)
- Both routes handled before the page catch-all in publicSite routes

### Article Schema Markup

Each blog post detail page includes \`application/ld+json\` structured data with:
- @type: Article
- headline, description, image, author, datePublished, dateModified, publisher

### SEO Integration

Blog posts support seo_title, seo_description, og_image overrides. Falls back to post title/excerpt/featured_image when not set.`,
    category: "developer",
    type: "developer",
    tags: ["blog", "collections", "seo", "structured-data", "article-schema"],
    sortOrder: 24,
    isPublished: true,
  },
  {
    title: "Setting Up Your Blog",
    slug: "help-blog",
    content: `Create a professional blog for your site in just one click.

## Getting Started

1. Go to **Blog** in the sidebar
2. Click **Create Blog** to run the setup wizard
3. Start writing posts in the Blog Posts collection

## What the Wizard Creates

- A **Blog Posts** collection with all the fields you need: title, slug, excerpt, body, featured image, author, category, tags, dates, and SEO fields
- A **Blog page** that's automatically published
- **Public templates** for your blog listing (/blog) and individual articles (/blog/your-post-slug)

## Writing Posts

1. From the Blog page, click **New Post** or **Manage Collection**
2. Fill in the post fields — at minimum, title, slug, and body
3. Set the status to **Published** when ready
4. Your post will appear at /blog/your-slug on your public site

## SEO for Blog Posts

Each post has optional SEO fields:
- **SEO Title** — Custom title for search engines
- **SEO Description** — Meta description for search results
- **OG Image** — Social sharing image override

If not set, the post's title, excerpt, and featured image are used automatically.

## Categories & Tags

Organize posts with categories (select from predefined options) and tags (comma-separated). Categories appear as badges on post cards.

## Article Schema

Blog posts automatically include Article structured data (schema.org) for rich search results, including headline, author, dates, and images.`,
    category: "help",
    type: "help",
    tags: ["blog", "posts", "writing", "seo", "categories"],
    sortOrder: 24,
    isPublished: true,
  },
];

const seedMarketplaceItems = [
  {
    type: "site-kit",
    name: "Modern Business",
    slug: "modern-business",
    description: "A clean, professional theme with hero sections, team bios, and service showcases.",
    longDescription: "The Modern Business site kit gives you everything you need to launch a professional business website. Includes a stunning hero section, team member profiles, service cards, testimonial carousels, and a contact form. Fully responsive and optimized for conversion.",
    icon: "briefcase",
    isFree: false,
    price: 4900,
    version: "1.2.0",
    status: "published",
    category: "business",
    tags: ["business", "professional", "corporate", "responsive"],
    author: "ORIGIN",
    docSlug: "help-sitekit-modern-business",
  },
  {
    type: "site-kit",
    name: "Creative Portfolio",
    slug: "creative-portfolio",
    description: "Showcase your work with a beautiful portfolio layout and project galleries.",
    longDescription: "The Creative Portfolio site kit is designed for designers, photographers, and creative professionals. Features masonry galleries, project case studies, about pages, and smooth animations. Dark mode optimized.",
    icon: "palette",
    isFree: true,
    price: 0,
    version: "1.0.0",
    status: "published",
    category: "creative",
    tags: ["portfolio", "creative", "gallery", "design"],
    author: "ORIGIN",
    docSlug: "help-sitekit-creative-portfolio",
  },
  {
    type: "section",
    name: "Hero Banner",
    slug: "hero-banner",
    description: "Full-width hero section with background image, overlay, headline, and CTA buttons.",
    icon: "image",
    isFree: true,
    price: 0,
    version: "1.0.0",
    status: "published",
    category: "headers",
    tags: ["hero", "banner", "header", "cta"],
    author: "ORIGIN",
  },
  {
    type: "section",
    name: "Testimonials Grid",
    slug: "testimonials-grid",
    description: "Display customer testimonials in a responsive grid with avatars and ratings.",
    icon: "message-square",
    isFree: true,
    price: 0,
    version: "1.0.0",
    status: "published",
    category: "social-proof",
    tags: ["testimonials", "reviews", "social-proof"],
    author: "ORIGIN",
  },
  {
    type: "section",
    name: "Pricing Table",
    slug: "pricing-table",
    description: "Configurable pricing table with plan comparison, feature lists, and CTA buttons.",
    icon: "credit-card",
    isFree: false,
    price: 1900,
    version: "1.1.0",
    status: "published",
    category: "commerce",
    tags: ["pricing", "plans", "comparison"],
    author: "ORIGIN",
  },
  {
    type: "section",
    name: "FAQ Accordion",
    slug: "faq-accordion",
    description: "Expandable FAQ section with smooth animations and search functionality.",
    icon: "help-circle",
    isFree: true,
    price: 0,
    version: "1.0.0",
    status: "published",
    category: "content",
    tags: ["faq", "accordion", "questions"],
    author: "ORIGIN",
  },
  {
    type: "widget",
    name: "Live Chat",
    slug: "live-chat",
    description: "Embeddable live chat widget with agent routing and offline messaging.",
    icon: "message-circle",
    isFree: false,
    price: 2900,
    version: "2.0.0",
    status: "published",
    category: "communication",
    tags: ["chat", "support", "messaging", "live"],
    author: "ORIGIN",
    docSlug: "help-widget-live-chat",
  },
  {
    type: "widget",
    name: "Search Bar",
    slug: "search-bar-widget",
    description: "Full-text search widget with instant results, filters, and keyboard navigation.",
    icon: "search",
    isFree: true,
    price: 0,
    version: "1.0.0",
    status: "published",
    category: "navigation",
    tags: ["search", "fulltext", "navigation"],
    author: "ORIGIN",
  },
  {
    type: "widget",
    name: "Social Feed",
    slug: "social-feed",
    description: "Display social media posts from multiple platforms in a unified feed.",
    icon: "share-2",
    isFree: false,
    price: 1900,
    version: "1.0.0",
    status: "published",
    category: "social",
    tags: ["social", "feed", "instagram", "twitter"],
    author: "ORIGIN",
  },
  {
    type: "app",
    name: "CRM Suite",
    slug: "crm-suite",
    description: "Complete customer relationship management with contacts, deals, and pipelines.",
    longDescription: "The CRM Suite app adds full customer relationship management to your workspace. Track leads through customizable pipelines, manage contact profiles, log interactions, and generate reports. Integrates with forms and email marketing.",
    icon: "contact",
    isFree: false,
    price: 7900,
    version: "1.0.0",
    status: "published",
    category: "business",
    tags: ["crm", "contacts", "sales", "pipeline"],
    author: "ORIGIN",
    docSlug: "help-app-crm-suite",
  },
  {
    type: "app",
    name: "Email Marketing",
    slug: "email-marketing",
    description: "Send campaigns, automate sequences, and manage subscriber lists.",
    longDescription: "The Email Marketing app lets you create beautiful email campaigns with a drag-and-drop editor, set up automated drip sequences, segment your audience, and track open/click rates. Includes templates and A/B testing.",
    icon: "mail",
    isFree: false,
    price: 4900,
    version: "1.0.0",
    status: "published",
    category: "marketing",
    tags: ["email", "campaigns", "automation", "marketing"],
    author: "ORIGIN",
  },
  {
    type: "add-on",
    name: "SEO Toolkit Pro",
    slug: "seo-toolkit-pro",
    description: "Advanced SEO with structured data, sitemap generation, and search analytics.",
    icon: "bar-chart",
    isFree: false,
    price: 2900,
    version: "2.0.0",
    status: "published",
    category: "seo",
    tags: ["seo", "analytics", "search", "optimization"],
    author: "ORIGIN",
  },
  {
    type: "add-on",
    name: "Redirects Manager",
    slug: "redirects-manager",
    description: "Manage URL redirects with bulk import, regex patterns, and 301/302 support.",
    icon: "arrow-right-left",
    isFree: true,
    price: 0,
    version: "1.0.0",
    status: "published",
    category: "seo",
    tags: ["redirects", "seo", "urls", "301"],
    author: "ORIGIN",
  },
  {
    type: "add-on",
    name: "Cookie Consent",
    slug: "cookie-consent",
    description: "GDPR-compliant cookie consent banner with customizable categories and preferences.",
    icon: "cookie",
    isFree: true,
    price: 0,
    version: "1.0.0",
    status: "published",
    category: "compliance",
    tags: ["gdpr", "cookies", "consent", "privacy"],
    author: "ORIGIN",
  },
];

const seedMarketplaceDocs = [
  {
    title: "Modern Business Site Kit",
    slug: "help-sitekit-modern-business",
    content: `Get started with the Modern Business site kit.

## What's Included

- Hero section with full-width background
- Team member profile cards
- Service showcase grid
- Testimonial carousel
- Contact form with validation
- Footer with social links

## Setup

After installing, visit Pages to see the pre-built pages. Customize colors, fonts, and content through the page builder.

## Customization

All sections are fully editable. Swap images, change copy, adjust colors, and rearrange sections using drag and drop.`,
    category: "marketplace",
    type: "help",
    tags: ["site-kit", "business", "theme"],
    sortOrder: 100,
    isPublished: true,
  },
  {
    title: "Creative Portfolio Site Kit",
    slug: "help-sitekit-creative-portfolio",
    content: `Get started with the Creative Portfolio site kit.

## What's Included

- Masonry gallery layout
- Project case study template
- About page with timeline
- Contact page
- Dark mode optimized design

## Setup

After installing, the portfolio pages are ready to customize. Add your projects, update your bio, and adjust the color scheme.

## Tips

- Use high-resolution images for the gallery
- Write detailed case studies for each project
- The dark mode design works best with high-contrast images`,
    category: "marketplace",
    type: "help",
    tags: ["site-kit", "portfolio", "creative"],
    sortOrder: 101,
    isPublished: true,
  },
  {
    title: "Live Chat Widget",
    slug: "help-widget-live-chat",
    content: `Set up and configure the Live Chat widget for your site.

## Getting Started

After installing, the chat widget appears in the bottom-right corner of your site. Configure agent routing and customize the appearance.

## Features

- Real-time messaging with visitors
- Agent routing and queues
- Offline message collection
- Customizable colors and position
- Typing indicators

## Configuration

Access chat settings from your workspace Settings page. Set business hours, customize the welcome message, and configure notification preferences.`,
    category: "marketplace",
    type: "help",
    tags: ["widget", "chat", "support"],
    sortOrder: 102,
    isPublished: true,
  },
  {
    title: "CRM Suite App",
    slug: "help-app-crm-suite",
    content: `Manage customer relationships with the CRM Suite.

## Getting Started

After installing, access the CRM from the sidebar. The CRM module unlocks the previously locked CRM navigation item.

## Features

- Contact management with custom fields
- Deal pipeline with drag-and-drop stages
- Activity logging and reminders
- Import/export contacts via CSV
- Integration with forms

## Pipeline Stages

Default pipeline: Lead > Qualified > Proposal > Negotiation > Closed Won / Closed Lost

Customize stages in CRM Settings.`,
    category: "marketplace",
    type: "help",
    tags: ["app", "crm", "contacts", "sales"],
    sortOrder: 103,
    isPublished: true,
  },
];

const seedModules = [
  {
    name: "Page Builder",
    slug: "page-builder",
    description: "Visual drag-and-drop page builder with live preview, responsive editing, and component library.",
    version: "1.0.0",
    category: "content",
    icon: "palette",
    isCore: true,
    isActive: true,
  },
  {
    name: "SEO Toolkit",
    slug: "seo-toolkit",
    description: "Complete SEO management with meta tags, sitemaps, structured data, and search analytics.",
    version: "2.1.0",
    category: "content",
    icon: "bar-chart",
    isCore: false,
    isActive: true,
  },
  {
    name: "Authentication",
    slug: "authentication",
    description: "User authentication with social login, SSO, MFA, and session management.",
    version: "1.0.0",
    category: "security",
    icon: "shield",
    isCore: true,
    isActive: true,
  },
  {
    name: "Media Library",
    slug: "media-library",
    description: "Centralized asset management with image optimization, CDN delivery, and folder organization.",
    version: "1.2.0",
    category: "content",
    icon: "image",
    isCore: true,
    isActive: true,
  },
  {
    name: "Blog Engine",
    slug: "blog-engine",
    description: "Full-featured blog with markdown editor, categories, tags, and RSS feed generation.",
    version: "1.0.0",
    category: "content",
    icon: "file-text",
    isCore: false,
    isActive: true,
  },
  {
    name: "Analytics",
    slug: "analytics",
    description: "Privacy-first analytics with real-time dashboards, funnels, and custom event tracking.",
    version: "1.0.0",
    category: "analytics",
    icon: "bar-chart",
    isCore: false,
    isActive: true,
  },
  {
    name: "Form Builder",
    slug: "form-builder",
    description: "Create custom forms with validation, conditional logic, and submission workflows.",
    version: "1.1.0",
    category: "communication",
    icon: "mail",
    isCore: false,
    isActive: true,
  },
  {
    name: "E-Commerce",
    slug: "ecommerce",
    description: "Product catalog, shopping cart, checkout flow, and Stripe payment integration.",
    version: "0.9.0",
    category: "commerce",
    icon: "shopping-cart",
    isCore: false,
    isActive: false,
  },
  {
    name: "API Gateway",
    slug: "api-gateway",
    description: "RESTful API management with rate limiting, authentication, and usage analytics.",
    version: "1.0.0",
    category: "development",
    icon: "code",
    isCore: false,
    isActive: true,
  },
  {
    name: "Notifications",
    slug: "notifications",
    description: "Multi-channel notification system with email, SMS, push, and in-app messaging.",
    version: "1.0.0",
    category: "communication",
    icon: "message-square",
    isCore: false,
    isActive: false,
  },
  {
    name: "Scheduling",
    slug: "scheduling",
    description: "Content scheduling, appointment booking, and calendar integration for your sites.",
    version: "0.8.0",
    category: "content",
    icon: "calendar",
    isCore: false,
    isActive: false,
  },
  {
    name: "Performance",
    slug: "performance",
    description: "Edge caching, image optimization, lazy loading, and Core Web Vitals monitoring.",
    version: "1.0.0",
    category: "development",
    icon: "zap",
    isCore: true,
    isActive: true,
  },
];

async function seedSuperAdmin() {
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@digitalalchemy.dev"));
  if (existingAdmin.length > 0) {
    log("Skipping SUPER_ADMIN seed (already exists)", "seed");
    return existingAdmin[0];
  }

  log("Creating SUPER_ADMIN user...", "seed");

  const ctx = await auth.api.signUpEmail({
    body: {
      email: "admin@digitalalchemy.dev",
      password: "OriginAdmin2026!",
      name: "Digital Alchemy Admin",
    },
  });

  await db
    .update(users)
    .set({ role: "SUPER_ADMIN" })
    .where(eq(users.id, ctx.user.id));

  log("Created SUPER_ADMIN user (admin@digitalalchemy.dev)", "seed");
  return { ...ctx.user, role: "SUPER_ADMIN" };
}

async function seedDemoWorkspace(adminId: string) {
  const existingWs = await db.select().from(workspaces).where(eq(workspaces.slug, "digital-alchemy"));
  if (existingWs.length > 0) {
    log("Skipping demo workspace seed (already exists)", "seed");
    return existingWs[0];
  }

  log("Creating demo workspace...", "seed");
  const [ws] = await db
    .insert(workspaces)
    .values({
      name: "Digital Alchemy",
      slug: "digital-alchemy",
      ownerId: adminId,
      plan: "enterprise",
    })
    .returning();

  await db.insert(memberships).values({
    userId: adminId,
    workspaceId: ws.id,
    role: "SUPER_ADMIN",
  });

  log("Created demo workspace: Digital Alchemy", "seed");
  return ws;
}

async function seedDemoSite(workspaceId: string) {
  const existingSite = await db.select().from(sites).where(eq(sites.slug, "demo-site"));
  if (existingSite.length > 0) {
    log("Skipping demo site seed (already exists)", "seed");
    return existingSite[0];
  }

  log("Creating demo site...", "seed");
  const [site] = await db
    .insert(sites)
    .values({
      name: "Demo Site",
      slug: "demo-site",
      workspaceId,
      domain: "demo.origin.dev",
      status: "published",
    })
    .returning();

  log("Created demo site: Demo Site", "seed");
  return site;
}

export async function seedDatabase() {
  try {
    const existingDocs = await db.select().from(docEntries);
    const existingSlugs = new Set(existingDocs.map((d) => d.slug));
    const newDocs = seedDocs.filter((d) => !existingSlugs.has(d.slug));
    if (newDocs.length > 0) {
      log(`Seeding ${newDocs.length} new doc entries...`, "seed");
      await db.insert(docEntries).values(newDocs);
      log(`Seeded ${newDocs.length} new doc entries`, "seed");
    } else {
      log(`Skipping docs seed (all ${seedDocs.length} already exist)`, "seed");
    }

    const existingModules = await db.select().from(originModules);
    if (existingModules.length === 0) {
      log("Seeding modules...", "seed");
      await db.insert(originModules).values(seedModules);
      log(`Seeded ${seedModules.length} modules`, "seed");
    } else {
      log(`Skipping modules seed (${existingModules.length} already exist)`, "seed");
    }

    const existingMpItems = await db.select().from(marketplaceItems);
    const existingMpSlugs = new Set(existingMpItems.map((i) => i.slug));
    const newMpItems = seedMarketplaceItems.filter((i) => !existingMpSlugs.has(i.slug));
    if (newMpItems.length > 0) {
      log(`Seeding ${newMpItems.length} new marketplace items...`, "seed");
      await db.insert(marketplaceItems).values(newMpItems);
      log(`Seeded ${newMpItems.length} marketplace items`, "seed");
    } else {
      log(`Skipping marketplace items seed (all ${seedMarketplaceItems.length} already exist)`, "seed");
    }

    const existingMpDocs = seedMarketplaceDocs.filter((d) => !existingSlugs.has(d.slug));
    if (existingMpDocs.length > 0) {
      log(`Seeding ${existingMpDocs.length} new marketplace doc entries...`, "seed");
      await db.insert(docEntries).values(existingMpDocs);
      log(`Seeded ${existingMpDocs.length} marketplace doc entries`, "seed");
    } else {
      log(`Skipping marketplace docs seed (all already exist)`, "seed");
    }

    const admin = await seedSuperAdmin();
    const ws = await seedDemoWorkspace(admin.id);
    await seedDemoSite(ws.id);
  } catch (err) {
    log(`Seed error: ${err}`, "seed");
  }
}
