# ORIGIN Platform Health Audit

**Date:** 2026-02-12
**Scope:** Full platform audit covering modular routes, tenancy scoping, validation consistency, documentation completeness, error response standardization, and deprecated code removal.

---

## 1. Modular Route Architecture

**Status:** PASS

All 18 modules are properly registered in `server/modules/registry.ts` with self-contained `index.ts` entry points:

| Module | Index | Routes | Service |
|--------|-------|--------|---------|
| auth | Yes | auth.routes.ts | BetterAuth integration |
| billing | Yes | billing.routes.ts | billing.service.ts |
| blog | Yes | blog.routes.ts | blog.service.ts |
| cmsCollections | Yes | cmsCollections.routes.ts | cmsCollections.service.ts |
| cmsMenus | Yes | cmsMenus.routes.ts | cmsMenus.service.ts |
| cmsPages | Yes | cmsPages.routes.ts | cmsPages.service.ts |
| component-registry | Yes | component-registry.routes.ts | Shared registry |
| docs | Yes | docs.routes.ts | docs.service.ts |
| forms | Yes | forms.routes.ts | forms.service.ts |
| health | Yes | health.routes.ts | N/A |
| marketplace | Yes | marketplace.routes.ts | marketplace.service.ts |
| migration | Yes | migration.routes.ts | migration.service.ts |
| modules | Yes | modules.routes.ts | modules.service.ts |
| publicSite | Yes | publicSite.routes.ts | publicSite.service.ts |
| redirects | Yes | redirects.routes.ts | redirects.service.ts |
| seo | Yes | seo.routes.ts | seo.service.ts |
| siteKits | Yes | siteKits.routes.ts | siteKits.service.ts |
| siteTheme | Yes | siteTheme.routes.ts | siteTheme.service.ts |
| apps/crm | Yes | crm.routes.ts | crm.service.ts |

---

## 2. Tenancy & Workspace Scoping

**Status:** PASS

- **78 route handlers** use `getWorkspaceId()` for workspace-scoped data isolation.
- **5 route files** correctly omit workspace scoping (platform-level or public):
  - `health.routes.ts` — Platform health check (no tenant data)
  - `docs.routes.ts` — Platform documentation (global, read routes are public)
  - `modules.routes.ts` — Module catalog (global, read-only)
  - `component-registry.routes.ts` — Component catalog (global, read-only)
  - `publicSite.routes.ts` — Public site rendering (resolved by domain/subdomain, not workspace session)

All workspace-scoped modules use `requireWorkspaceContext()` middleware to enforce `activeWorkspaceId` presence before `getWorkspaceId()` extraction.

CRM module uses a shared `gate` array pattern: `[requireAuth(), requireWorkspaceContext(), requireEntitlement("crm")]` applied to all 14 routes.

---

## 3. Validation Consistency

**Status:** PASS

All POST/PATCH/PUT routes that accept request bodies use `validateBody(schema)` middleware with Zod schemas.

Routes that were flagged but are correctly unvalidated:

| Route | Reason |
|-------|--------|
| `POST /billing/portal` | No request body; action triggered by authenticated session |
| `POST /billing/stripe` | Stripe webhook; raw body verified by `stripe.webhooks.constructEvent()` |
| `POST /site-kits/:id/publish` | No request body; action triggered by URL param |
| `POST /site-kits/:id/unpublish` | No request body; action triggered by URL param |

Global `ZodError` handler in `routes.ts` catches any validation failures with standardized `VALIDATION_ERROR` code.

---

## 4. Error Response Standardization

**Status:** FIXED (this audit)

**Standard shape:** `{ error: { message: string, code: string } }`

**Fixes applied:**

| File | Line | Before | After |
|------|------|--------|-------|
| billing.routes.ts | 101 | `{ error: "Webhook secret not configured" }` | `{ error: { message: "...", code: "STRIPE_NOT_CONFIGURED" } }` |
| billing.routes.ts | 106 | `{ error: "Missing stripe-signature header" }` | `{ error: { message: "...", code: "VALIDATION_ERROR" } }` |
| billing.routes.ts | 115 | `{ error: "Webhook Error: ..." }` | `{ error: { message: "...", code: "VALIDATION_ERROR" } }` |
| billing.routes.ts | 123 | `{ error: "Webhook handler failed" }` | `{ error: { message: "...", code: "INTERNAL_ERROR" } }` |
| component-registry.routes.ts | 29 | `{ error: "Component not found" }` | `{ error: { message: "...", code: "NOT_FOUND" } }` |

All error responses now conform to the standard `{ error: { message, code } }` shape.

---

## 5. Documentation Completeness

**Status:** PASS

### Developer Docs (`/docs/*.md`): 28 files

Every server module has a corresponding developer doc file. Cross-cutting concerns (architecture, API reference, coding standards, tenancy, app shell) are also documented.

### In-App Doc Entries (database): 48 entries

| Category | Count | Coverage |
|----------|-------|----------|
| api-reference | 1 | API Reference |
| architecture | 7 | Architecture, Puck, Registry, CRM, Forms, Menus, Redirects |
| developer | 2 | Blog, SEO |
| getting-started | 1 | Getting Started |
| guides | 16 | All major systems (auth, billing, collections, docs, editor, marketplace, pages, public site, site kits, tenancy, theme, WP migration, versioning, resource docs) |
| help | 16 | Client-facing help for all user features |
| marketplace | 4 | CRM Suite, Site Kits, Live Chat Widget |
| modules | 1 | Module creation guide |

### Module-to-Documentation Matrix: 100% Coverage

Every module has:
1. A `/docs/*.md` developer documentation file
2. A database doc entry (developer type) for the Docs Library
3. A database doc entry (help type) for client-facing Help & Resources

---

## 6. Deprecated Code Removal

**Status:** PASS (no action needed)

All occurrences of "deprecated" in the codebase refer to the **marketplace item deprecation feature** (a product capability), not actual deprecated code:

- `marketplace.repo.ts` — Filters deprecated items from public listing
- `marketplace.service.ts` — Enforces deprecation during install
- `puck-adapter.ts` — Skips deprecated components in builder
- `marketplace.tsx` / `studio-marketplace.tsx` — UI for deprecation badges and management

No `TODO`, `FIXME`, or `HACK` comments were found in production code.

---

## 7. Auth Middleware Coverage

**Status:** PASS

| Module | Routes | Auth Checks | Pattern |
|--------|--------|-------------|---------|
| auth | 4 | 5 | requireAuth on protected, public register/login |
| billing | 4 | 4 | requireAuth + requireWorkspaceContext; webhook unauthed (Stripe sig) |
| blog | 4 | 5 | requireAuth + workspace for management; public read routes |
| cmsCollections | 13 | 24 | requireAuth + requireWorkspaceContext on all |
| cmsMenus | 9 | 19 | requireAuth + requireWorkspaceContext on all |
| cmsPages | 8 | 14 | requireAuth + requireWorkspaceContext on all |
| component-registry | 2 | 0 | Public read-only catalog (correct) |
| docs | 7 | 5 | requireAuth on admin writes; public reads |
| forms | 9 | 15 | requireAuth + workspace; public submission endpoint |
| health | 1 | 0 | Public health check (correct) |
| marketplace | 20 | 19 | requireAuth on management; public browse |
| migration | 4 | 9 | requireAuth + requireWorkspaceContext on all |
| modules | 2 | 0 | Public read-only catalog (correct) |
| publicSite | 6 | 0 | Public site rendering (correct) |
| redirects | 8 | 17 | requireAuth + requireWorkspaceContext on all |
| seo | 2 | 5 | requireAuth + requireWorkspaceContext on all |
| siteKits | 14 | 14 | requireAuth + requireRole for admin; workspace for install |
| siteTheme | 2 | 5 | requireAuth + requireWorkspaceContext on all |
| apps/crm | 14 | gate array | requireAuth + requireWorkspaceContext + requireEntitlement("crm") |

---

## Summary

| Area | Status | Action |
|------|--------|--------|
| Modular routes | PASS | No changes needed |
| Tenancy scoping | PASS | 78 workspace-scoped routes, 5 correctly unscoped |
| Validation consistency | PASS | All body-accepting routes validated |
| Error response shapes | FIXED | 5 non-standard errors corrected |
| Documentation completeness | PASS | 28 doc files, 48 DB entries, 100% module coverage |
| Deprecated code removal | PASS | No deprecated code found |
| Auth middleware | PASS | Correct patterns across all modules |
