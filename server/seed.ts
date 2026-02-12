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
