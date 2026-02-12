# Marketplace Versioning & Deprecation

## Overview

The marketplace versioning system enables safe, non-destructive lifecycle management of marketplace items. It provides semantic versioning (SemVer), version tracking for installs, deprecation with messaging, platform compatibility checks, and a full changelog history.

## Schema Changes

### marketplace_items (extended)
| Column | Type | Description |
|---|---|---|
| version | text | SemVer string (MAJOR.MINOR.PATCH), defaults to "1.0.0" |
| deprecated | boolean | Whether item is deprecated (hidden from new installs) |
| deprecation_message | text | Optional message shown to existing users |
| min_platform_version | text | Minimum platform version required for install |

### marketplace_installs (extended)
| Column | Type | Description |
|---|---|---|
| installed_version | text | Version at time of install |

### marketplace_changelogs (new table)
| Column | Type | Description |
|---|---|---|
| id | varchar (PK) | UUID |
| item_id | varchar (FK) | References marketplace_items |
| version | text | Version this entry describes |
| change_type | text | "major", "minor", "patch", or "custom" |
| notes | text | Changelog description |
| created_at | timestamp | When created |

## API Routes

### Admin Routes (require SUPER_ADMIN or AGENCY_ADMIN)

| Method | Path | Description |
|---|---|---|
| GET | `/api/marketplace/admin/items` | List all items (including deprecated) |
| POST | `/api/marketplace/items/:id/bump-version` | Bump version with changelog |
| POST | `/api/marketplace/items/:id/set-version` | Set specific version |
| POST | `/api/marketplace/items/:id/deprecate` | Mark item as deprecated |
| POST | `/api/marketplace/items/:id/undeprecate` | Restore deprecated item |

### Public Routes (require auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/marketplace/items/:id/changelogs` | Get changelog for item |
| GET | `/api/marketplace/items/:id/compatibility` | Check platform compatibility |

### Request Bodies

**bump-version:**
```json
{ "bumpType": "major" | "minor" | "patch", "notes": "string" }
```

**set-version:**
```json
{ "version": "2.0.0", "notes": "string" }
```

**deprecate:**
```json
{ "message": "optional deprecation message" }
```

## Versioning Helpers

Located in `server/modules/marketplace/versioning.ts`:

- `parseSemVer(version)` - Parse "1.2.3" into `{ major, minor, patch }`
- `isValidSemVer(version)` - Validate SemVer format
- `compareSemVer(a, b)` - Compare two versions (-1, 0, 1)
- `bumpVersion(current, type)` - Increment version by type
- `checkCompatibility(minVersion, platformVersion)` - Check platform compatibility
- `PLATFORM_VERSION` - Current platform version constant ("1.0.0")

## Design Decisions

1. **Non-destructive deprecation**: Deprecated items remain installed and functional for existing users. They are only hidden from new installation listings.
2. **Version tracking**: `installedVersion` captures which version a workspace originally installed, enabling future update notifications.
3. **Compatibility gating**: `minPlatformVersion` prevents installs on incompatible platform versions but does not affect existing installs.
4. **Changelog immutability**: Changelog entries are append-only and tied to specific versions.

## Super Admin UI

The Studio Marketplace Catalog page (`/app/studio/marketplace`) provides:
- Searchable, filterable list of all marketplace items (including deprecated)
- Per-item detail view with version info, deprecation status, and changelog
- Version bump dialog (patch/minor/major with changelog notes)
- Deprecate/restore toggle with optional messaging
- Full changelog history display

## File Structure

```
server/modules/marketplace/
  versioning.ts          - SemVer helpers, compatibility checks
  marketplace.repo.ts    - Database queries (changelog, deprecation filtering)
  marketplace.service.ts - Business logic (bump, deprecate, compatibility)
  marketplace.routes.ts  - API endpoints (admin + public)

client/src/pages/
  studio-marketplace.tsx - Super Admin management UI
  marketplace.tsx        - Client marketplace (auto-filters deprecated)

shared/schema.ts         - Database schema + types
```
