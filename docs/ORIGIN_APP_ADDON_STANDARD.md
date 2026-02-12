# ORIGIN App Add-on Standard

## Overview

ORIGIN Apps are first-class platform modules gated by entitlements. They are NOT runtime plugins — they are compiled into the platform and controlled via entitlement checks. This document defines the standard for creating, shipping, and maintaining app add-ons.

## App Contract

Every ORIGIN app is defined using the `defineOriginApp()` contract in `shared/originApps/`:

```typescript
defineOriginApp({
  key: "tickets",                    // Unique kebab-case identifier
  name: "Tickets",                   // Human-readable name
  description: "...",                // Short description
  version: "0.1.0",                  // SemVer
  entitlementKey: "apps.tickets",    // Entitlement gating key
  category: "addon",                 // "core" or "addon"
  nav: [{ label, path, icon }],      // Sidebar navigation items
  api: { basePath: "/api/apps/tickets" },
  docs: { devDocSlug, resourceDocSlug },
  ui: { baseRoute: "/app/apps/tickets" },
  marketplace: { itemType: "app", defaultBilling: "free" }
})
```

## Folder Structure

```
server/modules/apps/<key>/
  index.ts              # Module factory (createXxxModule)
  <key>.routes.ts       # Express routes with gating
  <key>.service.ts      # Business logic

client/src/pages/
  app-<key>.tsx          # UI page component

shared/originApps/
  types.ts              # App contract type
  registry.ts           # Central registry of all apps

docs/apps/
  <key>_DEV.md          # Developer documentation
  <key>_RESOURCE.md     # Client-facing help docs
```

## Gating Rules

1. **All API routes** must use `requireEntitlement(entitlementKey)` middleware
2. **UI pages** must handle 403 responses gracefully with a "not enabled" state
3. **Navigation items** appear for all users but link to the app page which handles its own gating
4. Enabling/disabling an app must **never break public site rendering**
5. App components must **fail gracefully** if the app is not enabled

## Entitlement Convention

- Pattern: `apps.<key>` (e.g., `apps.tickets`)
- Boolean check via `requireEntitlement()`
- Super Admins bypass all entitlement checks
- **Legacy exception:** CRM uses `"crm"` (predates the `apps.<key>` convention). New apps must use the `apps.<key>` pattern.

## Versioning & Deprecation

- Apps use SemVer (`major.minor.patch`)
- Version is tracked in the App Registry and marketplace
- Deprecated apps remain functional for existing users
- New installs are hidden for deprecated apps

## Marketplace Integration

- Each app has a corresponding `marketplace_items` row with `type = "app"`
- Billing types: `free`, `subscription`, `one_time`
- Install gating: paid apps require purchase before enabling entitlement
- Status lifecycle: `draft` → `published` → (optionally) deprecated

## Generator

Use the generator to scaffold a new app:

```bash
npx tsx scripts/gen-app.ts --key <key> --name "<Name>" --entitlement apps.<key>
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--key` | required | Kebab-case app identifier |
| `--name` | same as key | Human-readable name |
| `--entitlement` | `apps.<key>` | Entitlement key |
| `--version` | `0.1.0` | Initial version |
| `--billing` | `free` | Default billing type |

### After Generation

1. Add app definition to `shared/originApps/registry.ts`
2. Add module import to `server/modules/apps/index.ts`
3. Add route to `client/src/App.tsx`
4. Add nav item to `client/src/components/app-sidebar.tsx`
5. Seed marketplace item (optional)

## Definition of Done

An app add-on is ready to ship when:

- [ ] App contract defined in registry
- [ ] Server module with health endpoint and gating
- [ ] UI page with "not enabled" graceful fallback
- [ ] Navigation item in sidebar
- [ ] Route registered in App.tsx
- [ ] Dev documentation created
- [ ] Resource documentation created
- [ ] Marketplace item created (draft or published)
- [ ] Entitlement key documented
- [ ] Light + dark mode supported in UI
- [ ] No impact on public site rendering when disabled
