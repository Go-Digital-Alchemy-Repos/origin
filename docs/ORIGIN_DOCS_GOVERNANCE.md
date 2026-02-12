# ORIGIN Documentation Governance

## Purpose

This document defines documentation requirements and the "definition of done" for every change made to the ORIGIN platform.

## Documentation Requirements

Every prompt/change must update documentation in both:

### 1. Developer Docs (`/docs/*.md`)

Markdown files stored in the repository for developer reference. These cover:

- Architecture decisions
- Module development guides
- API reference
- Coding standards
- Deployment procedures

### 2. In-App Docs Library (seed entries)

Database-seeded documentation entries that appear in the Docs Library within the ORIGIN dashboard. These are split into:

- **Developer Docs** (`type: "developer"`) — For Super Admin / developer-facing docs
- **Help Docs** (`type: "help"`) — Client-facing help that is dynamic per installed modules/components

## Definition of Done

A change is considered "done" when:

1. **Code is complete** — Feature works end-to-end
2. **Developer docs updated** — Relevant `/docs/*.md` files reflect the change
3. **In-app docs updated** — If the change adds a new module or user-facing feature, a doc entry exists in the seed data or was created via API
4. **Tests pass** — All relevant tests pass
5. **Code reviewed** — Changes have been reviewed

## Doc Entry Schema

Each doc entry must include:

| Field       | Required | Description                                     |
|-------------|----------|-------------------------------------------------|
| title       | Yes      | Human-readable title                            |
| slug        | Yes      | URL-friendly unique identifier                  |
| content     | Yes      | Markdown content                                |
| category    | Yes      | One of: getting-started, architecture, modules, api-reference, guides, help |
| type        | Yes      | "developer" or "help"                           |
| tags        | No       | Array of keyword tags                           |
| sortOrder   | No       | Numeric sort position (lower = first)           |
| isPublished | No       | Boolean, defaults to true                       |

## Categories

- `getting-started` — Onboarding and setup guides
- `architecture` — System design and patterns
- `modules` — Module-specific documentation
- `api-reference` — API endpoint reference
- `guides` — How-to guides and tutorials
- `help` — Client-facing help articles

## Adding a New Doc

1. Add markdown to `/docs/` directory
2. Add a seed entry to `server/seed.ts` (or create via POST /api/docs)
3. Assign appropriate category and type
4. Tag with relevant keywords

## File Naming Convention

- `/docs/ORIGIN_DOCS_GOVERNANCE.md` — This file
- `/docs/ARCHITECTURE.md` — Architecture overview
- `/docs/MODULE_DEVELOPMENT.md` — Module creation guide
- `/docs/API_REFERENCE.md` — API documentation
- `/docs/CODING_STANDARDS.md` — Coding standards and conventions
