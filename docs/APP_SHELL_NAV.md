# App Shell & Navigation

## Overview

The ORIGIN app shell provides a dual-mode navigation system that adapts based on user role. It consists of a collapsible sidebar, a top bar with workspace switcher and user menu, and a main content area.

## Navigation Modes

### Client Workspace View (Default)

Available to all authenticated users. This is the standard view for managing a single workspace's content and settings.

| Nav Item | Route | Description |
|----------|-------|-------------|
| Dashboard | `/app` | Workspace overview with stats and recent activity |
| Pages | `/app/pages` | Manage website pages |
| Collections | `/app/collections` | Structured content collections |
| Blog | `/app/blog` | Blog post management |
| Media | `/app/media` | Media asset library |
| Forms | `/app/forms` | Form builder and submissions |
| Menus | `/app/menus` | Navigation menu management |
| Marketplace | `/app/marketplace` | Browse and install modules |
| CRM | `/app/crm` | Customer relationship management (locked by default) |
| Settings | `/app/settings` | Workspace settings |
| Help & Resources | `/app/help` | Documentation and support |

### Platform Studio View

Available only to `SUPER_ADMIN` and `AGENCY_ADMIN` roles. This view provides platform-wide administration and management tools.

| Nav Item | Route | Description |
|----------|-------|-------------|
| Platform Dashboard | `/app/studio` | Platform-wide overview |
| Clients | `/app/studio/clients` | Client workspace management |
| Sites | `/app/studio/sites` | All sites across workspaces |
| Site Kits | `/app/studio/site-kits` | Reusable site templates |
| Sections | `/app/studio/sections` | Reusable page sections |
| Widgets | `/app/studio/widgets` | Interactive widget components |
| Apps | `/app/studio/apps` | Platform applications |
| Marketplace Catalog | `/app/studio/marketplace` | Marketplace management |
| Component Registry | `/app/studio/components` | Global component registry |
| Docs Library | `/app/docs` | Platform documentation |
| System Status | `/app/studio/status` | Platform health monitoring |
| Billing & Plans | `/app/studio/billing` | Subscription management |
| Audit Logs | `/app/studio/audit` | Security audit trail |

## Mode Switching

Platform users (SUPER_ADMIN, AGENCY_ADMIN) see a toggle in the sidebar header:
- **Workspace** button — Switches to client workspace view
- **Studio** button — Switches to Platform Studio view

The active mode is determined by the current URL path:
- Routes starting with `/app/studio` activate Studio mode
- All other `/app/*` routes use the Client workspace view

## Top Bar Components

### Workspace Switcher
- Located on the left side of the topbar
- Shows the currently active workspace name
- Dropdown lists all workspaces the user belongs to
- Selecting a workspace calls `POST /api/user/select-workspace`

### Command Palette (Stub)
- Triggered by clicking the search bar or pressing `Cmd+K` (future)
- Currently a visual placeholder for future implementation

### User Menu
- Dropdown with user name and email
- Links to Settings and Help
- Sign out action

## Role Gating

| Role | Client View | Studio View |
|------|:-----------:|:-----------:|
| SUPER_ADMIN | Yes | Yes |
| AGENCY_ADMIN | Yes | Yes |
| CLIENT_ADMIN | Yes | No |
| CLIENT_EDITOR | Yes | No |
| CLIENT_VIEWER | Yes | No |

## Locked Items

Some navigation items are gated behind module installation:
- **CRM** — Requires the CRM module to be installed from the Marketplace
- Locked items are visually dimmed with a lock icon and are not clickable

## Design Rules

1. **Sidebar width**: 15rem expanded, 3rem collapsed (icon-only)
2. **Topbar height**: 3rem (h-12)
3. **Active state**: Uses shadcn SidebarMenuButton `isActive` prop
4. **Badge**: "Beta v0.1" in sidebar footer
5. **Branding**: ORIGIN logo in sidebar header
6. **Theme**: Supports light and dark mode via ThemeToggle in topbar

## Adding a New Nav Item

1. Add the route to `client/src/App.tsx` in the `AppRouter` component
2. Add the nav item to the appropriate array in `client/src/components/app-sidebar.tsx`:
   - `clientNav` / `clientSecondaryNav` / `clientBottomNav` for Client view
   - `studioNav` / `studioSecondaryNav` / `studioBottomNav` for Studio view
3. Create the page component (or use `StubPage` for placeholders)
4. If the item is role-gated, add `locked: true` to the nav item config

## File Locations

- `client/src/components/app-sidebar.tsx` — Sidebar component with nav arrays
- `client/src/App.tsx` — Route definitions, topbar components (WorkspaceSwitcher, CommandPaletteButton, UserMenu)
- `client/src/pages/stub.tsx` — Generic placeholder page component for stub routes
