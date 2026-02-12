import { db } from "./db";
import { docEntries, originModules, users, workspaces, memberships, sites, auditLog } from "@shared/schema";
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

    const admin = await seedSuperAdmin();
    const ws = await seedDemoWorkspace(admin.id);
    await seedDemoSite(ws.id);
  } catch (err) {
    log(`Seed error: ${err}`, "seed");
  }
}
