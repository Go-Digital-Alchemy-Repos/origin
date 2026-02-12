# Tickets App — Developer Documentation

## Overview

The Tickets app is an ORIGIN add-on that provides a trouble ticket system for support requests, issue tracking, and customer service management. It is gated by the `apps.tickets` entitlement.

## Architecture

### Server Module
- Location: `server/modules/apps/tickets/`
- API Base: `/api/apps/tickets`
- Entitlement: `apps.tickets`

### Client UI
- Location: `client/src/pages/app-tickets.tsx`
- Route: `/app/apps/tickets`

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/apps/tickets/health` | Health check and version info |

## Gating

All routes use `requireEntitlement("apps.tickets")`. If the entitlement is missing, the API returns 403 and the UI shows a "not enabled" state with a link to the Marketplace.

## Planned Features

- Ticket inbox with triage workflow
- Status workflow (Open, In Progress, Resolved, Closed)
- Agent assignment and workload management
- Email and in-app notifications
- Public customer portal for ticket submission
- Priority levels and SLA tracking
- Tags and categories

## Adding Features

1. Add new routes in `tickets.routes.ts`
2. Add business logic in `tickets.service.ts`
3. Add DB schema in `shared/schema.ts` if needed
4. Update the UI page in `app-tickets.tsx`
5. Update this documentation
