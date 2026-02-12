import { db } from "./db";
import { docEntries, originModules } from "@shared/schema";
import { log } from "./index";

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
- 404 — Resource not found
- 500 — Internal server error`,
    category: "api-reference",
    type: "developer",
    tags: ["api", "reference", "endpoints"],
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

export async function seedDatabase() {
  try {
    const existingDocs = await db.select().from(docEntries);
    if (existingDocs.length === 0) {
      log("Seeding doc entries...", "seed");
      await db.insert(docEntries).values(seedDocs);
      log(`Seeded ${seedDocs.length} doc entries`, "seed");
    } else {
      log(`Skipping docs seed (${existingDocs.length} already exist)`, "seed");
    }

    const existingModules = await db.select().from(originModules);
    if (existingModules.length === 0) {
      log("Seeding modules...", "seed");
      await db.insert(originModules).values(seedModules);
      log(`Seeded ${seedModules.length} modules`, "seed");
    } else {
      log(`Skipping modules seed (${existingModules.length} already exist)`, "seed");
    }
  } catch (err) {
    log(`Seed error: ${err}`, "seed");
  }
}
