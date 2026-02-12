# Authentication — BetterAuth Integration

## Overview

ORIGIN uses [BetterAuth](https://www.better-auth.com/) for authentication. BetterAuth provides email/password login with session management, integrated with our Drizzle ORM schema and PostgreSQL database.

## Architecture

```
BetterAuth Server (server/auth.ts)
  ├── Drizzle Adapter → PostgreSQL
  ├── Email/Password provider
  ├── Session management (HTTP-only cookies)
  └── Mounted at /api/auth/* (before express.json())

Auth Client (client/src/lib/auth-client.ts)
  ├── createAuthClient from better-auth/react
  ├── useSession hook
  ├── signIn / signUp / signOut methods
  └── Auto-manages cookies and session state
```

## Database Tables

BetterAuth manages these tables automatically:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (extended with `role` field) |
| `sessions` | Active sessions (extended with `active_workspace_id`) |
| `accounts` | OAuth/credential account links |
| `verifications` | Email verification tokens |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing session tokens |
| `BETTER_AUTH_URL` | No | Base URL (auto-detected from REPLIT_DOMAINS) |

## Auth Routes (managed by BetterAuth)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up/email` | Register with email/password |
| POST | `/api/auth/sign-in/email` | Login with email/password |
| POST | `/api/auth/sign-out` | End current session |
| GET | `/api/auth/get-session` | Get current session |
| GET | `/api/auth/ok` | Health check |

## Custom API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/me` | Get current user + workspaces |
| POST | `/api/user/select-workspace` | Set active workspace |
| GET | `/api/user/workspaces` | List user's workspaces |

## Middleware

### `requireAuth()`
Validates the BetterAuth session. Populates `req.user` and `req.session`.

```typescript
import { requireAuth } from "../shared/auth-middleware";

router.get("/protected", requireAuth(), (req, res) => {
  res.json({ user: req.user });
});
```

### `requireRole(...roles)`
Checks the user's global role. SUPER_ADMIN always passes.

```typescript
import { requireRole } from "../shared/auth-middleware";

router.get("/admin", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), handler);
```

### `requireWorkspaceContext()`
Ensures workspace is selected via `x-workspace-id` header or active session workspace.

```typescript
import { requireWorkspaceContext } from "../shared/auth-middleware";

router.get("/sites", requireAuth(), requireWorkspaceContext(), (req, res) => {
  // req.workspace.id is available
});
```

### `requireWorkspaceRole(...roles)`
Checks the user's role within the active workspace.

## Roles

| Role | Scope | Description |
|------|-------|-------------|
| SUPER_ADMIN | Global | Platform owner — full access |
| AGENCY_ADMIN | Workspace | Agency admin — manages workspace |
| CLIENT_ADMIN | Workspace | Client admin — manages sites/users |
| CLIENT_EDITOR | Workspace | Can edit content |
| CLIENT_VIEWER | Workspace | Read-only access |

## Testing Locally

### Seed Credentials

The seed creates a SUPER_ADMIN user:

- **Email**: `admin@digitalalchemy.dev`
- **Password**: `OriginAdmin2026!`

### Test Login Flow

1. Start the app: `npm run dev`
2. Navigate to `/login`
3. Sign in with the seed credentials
4. You'll land on the dashboard

### Test Registration

1. Navigate to `/login`
2. Click "Sign up"
3. Enter name, email, password
4. Submit — a workspace is not auto-created for new signups (admin creates workspaces)

### Test API Directly

```bash
# Health check
curl http://localhost:5000/api/auth/ok

# Sign in
curl -X POST http://localhost:5000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@digitalalchemy.dev","password":"OriginAdmin2026!"}'

# Get session (pass cookies from sign-in response)
curl http://localhost:5000/api/auth/get-session \
  -H "Cookie: <cookies-from-sign-in>"
```

## Audit Logging

Auth events are logged to the `audit_log` table:

- `auth.login` — Successful login
- `auth.logout` — User signed out
- `workspace.selected` — User switched workspace

## Adding Social Providers (Future)

Add providers in `server/auth.ts`:

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
},
```

## Adding Magic Link (Future)

Enable in `server/auth.ts`:

```typescript
magicLink: {
  enabled: true,
  sendMagicLink: async ({ email, url }) => {
    // Send email with magic link URL
  },
},
```
