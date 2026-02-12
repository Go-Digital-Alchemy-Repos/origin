# ORIGIN App Add-on Generator & Standards

## Overview

The ORIGIN App Add-on system provides a standardized way to create, distribute, and manage workspace-scoped applications within the ORIGIN platform. Apps are safe-by-default: generated code is inert until explicitly published and entitled.

## App Contract

Every ORIGIN App is defined by a contract (`OriginAppDefinition`) that specifies:

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Unique identifier (lowercase, alphanumeric, hyphens) |
| `name` | `string` | Display name |
| `description` | `string` | Short description |
| `version` | `string` | SemVer version (e.g. `1.0.0`) |
| `entitlementKey` | `string` | Feature key matching billing plan features (e.g. `crm`) |
| `status` | `"draft" \| "published" \| "deprecated"` | Visibility status |
| `nav` | `OriginAppNavItem[]` | Sidebar navigation items |
| `docs` | `OriginAppDocsRef` | Dev and resource doc slugs |
| `marketplace` | `OriginAppMarketplaceMeta?` | Optional marketplace metadata |
| `serverRoutePrefix` | `string` | Server route prefix (e.g. `/crm`) |

## Generator Usage

### Generate a new app scaffold:

```bash
npx tsx scripts/generate-origin-app.ts \
  --key my-app \
  --name "My App" \
  --entitlement apps.my-app
```

### Files created:

| Path | Purpose |
|------|---------|
| `server/modules/apps/<key>/` | Server module (routes, service, repo, schemas) |
| `client/src/pages/apps/<key>/` | Frontend pages (home, routes) |
| `shared/apps/<key>/` | Shared types and schemas |
| `docs/apps/<key>_DEV.md` | Developer documentation |
| `docs/apps/<key>_RESOURCE.md` | Help & resources |
| `docs/apps/<key>.manifest.json` | Marketplace manifest |

### Seed marketplace item:

```bash
npx tsx scripts/seed-marketplace-item.ts --key my-app
```

This script reads the manifest and provides SQL for manual insertion. It does NOT auto-write to the database.

## Gating Rules

An app appears in workspace navigation **only** when ALL of the following are true:

1. **App status is `"published"`** in the registry (`shared/originApps/registry.ts`)
2. **Workspace has the required entitlement** (e.g., `apps.crm` feature in entitlements table)
3. **Workspace context exists** (user has selected a workspace)

### Server-side gating:

All app routes MUST use the standard gate pattern:

```typescript
const gate = [requireAuth(), requireWorkspaceContext(), requireEntitlement("feature-key")];
router.get("/endpoint", ...gate, handler);
```

### Client-side gating:

- **Nav injection**: The sidebar only shows app nav items when `hasWorkspace && entitlements.includes(app.entitlementKey)`
- **Route mounting**: App routes in `App.tsx` only render when workspace context exists
- **WorkspaceGuard**: Every app page MUST wrap content in `<WorkspaceGuard>` before any data fetching

## Retry Fuse Rules

To prevent infinite request loops:

1. **Global defaults**: `retry: false` is set globally in `queryClient.ts`
2. **App queries**: Must never use `retry: true` or `retry: Infinity`
3. **Error codes that must NOT be retried**: `401` (Unauthorized), `403` (Forbidden), `400` (WORKSPACE_REQUIRED)
4. **Transient errors only**: If retry is needed, use `retry: 2` max for 5xx/network errors only

## Definition of Done for Shipping an App

- [ ] Contract defined in `shared/originApps/registry.ts` with status `"draft"`
- [ ] Server module with health endpoint and entitlement gate
- [ ] Frontend page(s) wrapped in `WorkspaceGuard`
- [ ] Shared types in `shared/apps/<key>/`
- [ ] Developer docs and resource docs created
- [ ] Marketplace manifest created
- [ ] App tested in draft mode (invisible to workspaces)
- [ ] Status changed to `"published"` for release
- [ ] Entitlement key added to at least one billing plan

## How This Solution Avoids Infinite Loops

1. **No auto-mounting**: Generated apps are not added to any router or nav by default
2. **Workspace guard**: All queries are behind `enabled: !!activeWorkspaceId`
3. **Entitlement check**: Nav items only render when entitlements API confirms access
4. **Global retry: false**: QueryClient is configured to never retry failed requests
5. **No polling**: No `refetchInterval`, no auto-recompute loops
6. **Explicit registration**: Apps must be manually added to `registry.ts` and `server/modules/registry.ts`
