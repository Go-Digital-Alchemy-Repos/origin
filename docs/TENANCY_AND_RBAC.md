# Tenancy & Role-Based Access Control (RBAC)

## Overview

ORIGIN implements a multi-tenant architecture using workspaces as the primary tenant boundary. Every piece of data is scoped to a workspace, ensuring strict isolation between tenants.

## Tenancy Model

```
Platform (ORIGIN)
  └── Workspaces (tenants)
       ├── Memberships (user ↔ workspace ↔ role)
       ├── Sites (websites owned by workspace)
       └── [Future: workspace-scoped modules, settings, etc.]
```

## Database Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| name | text | Display name |
| email | text | Unique email |
| email_verified | boolean | Email verification status |
| image | text | Profile image URL |
| role | text | Global role (default: CLIENT_VIEWER) |
| created_at | timestamp | Account creation time |
| updated_at | timestamp | Last update time |

### workspaces
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| name | text | Workspace name |
| slug | text | URL-friendly identifier (unique) |
| owner_id | varchar | FK → users.id |
| plan | text | Subscription tier |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### memberships
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| user_id | varchar | FK → users.id |
| workspace_id | varchar | FK → workspaces.id |
| role | text | Role within workspace |
| created_at | timestamp | Membership creation time |

### sites
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| name | text | Site name |
| slug | text | URL-friendly identifier (unique) |
| workspace_id | varchar | FK → workspaces.id |
| domain | text | Custom domain |
| status | text | draft / published / archived |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### audit_log
| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| user_id | varchar | User who performed action |
| workspace_id | varchar | Workspace context |
| action | text | Action performed |
| resource | text | Resource type affected |
| details | jsonb | Additional metadata |
| ip_address | text | Client IP |
| user_agent | text | Client user agent |
| created_at | timestamp | Event time |

## Roles

### Global Roles

| Role | Description | Scope |
|------|-------------|-------|
| SUPER_ADMIN | Platform owner (Digital Alchemy) | Full access to everything |

### Workspace Roles

| Role | Description | Capabilities |
|------|-------------|-------------|
| AGENCY_ADMIN | Agency administrator | Manage workspace, all sites, invite users |
| CLIENT_ADMIN | Client administrator | Manage sites, settings within workspace |
| CLIENT_EDITOR | Content editor | Edit content, manage media |
| CLIENT_VIEWER | Read-only viewer | View content and analytics |

## Permission Matrix

| Action | SUPER_ADMIN | AGENCY_ADMIN | CLIENT_ADMIN | CLIENT_EDITOR | CLIENT_VIEWER |
|--------|:-----------:|:------------:|:------------:|:-------------:|:-------------:|
| View workspace | Yes | Yes | Yes | Yes | Yes |
| Edit workspace settings | Yes | Yes | Yes | No | No |
| Manage members | Yes | Yes | Yes | No | No |
| Create sites | Yes | Yes | Yes | No | No |
| Edit site content | Yes | Yes | Yes | Yes | No |
| View analytics | Yes | Yes | Yes | Yes | Yes |
| Delete workspace | Yes | Yes | No | No | No |
| Access all workspaces | Yes | No | No | No | No |

## Middleware Usage

### Basic Auth Check

```typescript
router.get("/protected", requireAuth(), handler);
```

### Role Check (Global)

```typescript
router.get("/admin-only",
  requireAuth(),
  requireRole("SUPER_ADMIN"),
  handler
);
```

### Workspace Scoping

```typescript
router.get("/workspace-data",
  requireAuth(),
  requireWorkspaceContext(),
  handler
);
// req.workspace.id is now available
```

### Workspace Role Check

```typescript
router.post("/edit-site",
  requireAuth(),
  requireWorkspaceContext(),
  requireWorkspaceRole("AGENCY_ADMIN", "CLIENT_ADMIN", "CLIENT_EDITOR"),
  handler
);
```

## Scoping Examples

### Querying Sites by Workspace

```typescript
const workspaceId = scopeByWorkspace(req.workspace?.id);
const sites = await db
  .select()
  .from(sitesTable)
  .where(eq(sitesTable.workspaceId, workspaceId));
```

### Creating a Resource

```typescript
const newSite = await db.insert(sitesTable).values({
  name: req.body.name,
  slug: req.body.slug,
  workspaceId: req.workspace!.id, // Always from middleware
}).returning();
```

## Workspace Selection Flow

1. User logs in via BetterAuth
2. Frontend calls `GET /api/user/me` to get user + workspaces
3. If user has multiple workspaces, they select one
4. Frontend calls `POST /api/user/select-workspace` with `workspaceId`
5. Active workspace is stored on the session
6. All subsequent API calls are scoped to the active workspace

## Seed Data

The seed creates:

- **SUPER_ADMIN** user: `admin@digitalalchemy.dev` / `OriginAdmin2026!`
- **Demo workspace**: "Digital Alchemy" (enterprise plan)
- **Demo site**: "Demo Site" (published, domain: demo.origin.dev)
