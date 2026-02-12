# CRM App Add-on

**Created:** 2026-02-12

## Overview

The CRM App is a workspace-scoped add-on that provides customer relationship management capabilities within the ORIGIN platform. It is feature-gated by the `crm` entitlement, meaning workspaces must purchase the CRM Suite marketplace item to access its functionality. The CRM integrates with the Forms module for automatic lead capture and includes stub support in the Webflow-like Editor Shell.

## Feature Gating

All CRM API routes are protected by three middleware layers:

1. `requireAuth()` - User must be authenticated
2. `requireWorkspaceContext()` - Valid workspace context required
3. `requireEntitlement("crm")` - Workspace must hold the "crm" entitlement (via marketplace purchase or plan inclusion)

## Database Schema

### `crm_leads`

| Column | Type | Description |
|---|---|---|
| `id` | `varchar` (PK) | UUID, auto-generated |
| `workspace_id` | `varchar` (FK) | References `workspaces.id`, cascade delete |
| `site_id` | `varchar` (FK) | References `sites.id`, set null on delete |
| `name` | `text` | Lead name |
| `email` | `text` | Lead email address |
| `source` | `text` | Origin of lead: `"manual"`, `"form"`, etc. |
| `status` | `text` | Lead status: `"new"`, `"contacted"`, `"qualified"`, `"converted"` |
| `assigned_user_id` | `varchar` (FK) | References `users.id`, set null on delete |
| `created_at` | `timestamp` | Auto-generated |

### `crm_contacts`

| Column | Type | Description |
|---|---|---|
| `id` | `varchar` (PK) | UUID, auto-generated |
| `workspace_id` | `varchar` (FK) | References `workspaces.id`, cascade delete |
| `name` | `text` | Contact name |
| `email` | `text` | Contact email address |
| `phone` | `text` | Optional phone number |
| `created_at` | `timestamp` | Auto-generated |

### `crm_notes`

| Column | Type | Description |
|---|---|---|
| `id` | `varchar` (PK) | UUID, auto-generated |
| `lead_id` | `varchar` (FK) | References `crm_leads.id`, cascade delete |
| `contact_id` | `varchar` (FK) | References `crm_contacts.id`, cascade delete |
| `content` | `text` | Note body text |
| `created_at` | `timestamp` | Auto-generated |

Notes must be associated with either a lead or a contact (at least one foreign key required).

## Server Module

**Location:** `server/modules/apps/crm/`

### Files

| File | Purpose |
|---|---|
| `index.ts` | Module factory, mounts routes at `/crm` |
| `crm.routes.ts` | Express router with all CRM endpoints |
| `crm.service.ts` | Business logic layer |
| `crm.repo.ts` | Database access layer using Drizzle ORM |

### API Endpoints

All endpoints are prefixed with `/api/crm` and gated by auth + workspace + entitlement middleware.

#### Leads

| Method | Path | Description |
|---|---|---|
| `GET` | `/leads` | List all leads for workspace |
| `GET` | `/leads/:id` | Get single lead by ID |
| `POST` | `/leads` | Create a new lead |
| `PATCH` | `/leads/:id` | Update lead fields |
| `DELETE` | `/leads/:id` | Delete a lead |
| `POST` | `/leads/:id/convert` | Convert lead to contact |

**Create Lead Body:**
```json
{
  "name": "string (required)",
  "email": "string, valid email (required)",
  "siteId": "string (optional)",
  "source": "string (optional, defaults to 'manual')",
  "status": "string (optional, defaults to 'new')",
  "assignedUserId": "string (optional)"
}
```

**Update Lead Body:**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "status": "string (optional)",
  "assignedUserId": "string or null (optional)"
}
```

#### Contacts

| Method | Path | Description |
|---|---|---|
| `GET` | `/contacts` | List all contacts for workspace |
| `GET` | `/contacts/:id` | Get single contact by ID |
| `POST` | `/contacts` | Create a new contact |
| `PATCH` | `/contacts/:id` | Update contact fields |
| `DELETE` | `/contacts/:id` | Delete a contact |

**Create Contact Body:**
```json
{
  "name": "string (required)",
  "email": "string, valid email (required)",
  "phone": "string (optional)"
}
```

#### Notes

| Method | Path | Description |
|---|---|---|
| `GET` | `/notes?leadId=X&contactId=Y` | List notes filtered by lead or contact |
| `POST` | `/notes` | Create a note |
| `DELETE` | `/notes/:id` | Delete a note |

**Create Note Body:**
```json
{
  "leadId": "string (optional, at least one required)",
  "contactId": "string (optional, at least one required)",
  "content": "string (required)"
}
```

### Lead Conversion

The `POST /leads/:id/convert` endpoint creates a new contact from the lead's name and email, then sets the lead's status to `"converted"`. The original lead record is preserved.

## Forms Integration

The Forms module can automatically create CRM leads from form submissions. This is configured via the `crmLeadMapping` JSON field on a form record.

### Configuration

When creating or updating a form, include a `crmLeadMapping` object:

```json
{
  "crmLeadMapping": {
    "nameField": "Full Name",
    "emailField": "Email Address"
  }
}
```

The field values reference the `label` property of form fields. When a public form submission is received:

1. The submission is saved normally
2. If `crmLeadMapping` is set with both `nameField` and `emailField`, the system extracts those values from the submission payload
3. A new CRM lead is created with `source: "form"` and `status: "new"`
4. Lead creation is fire-and-forget (does not block the form response)

This integration is handled in `server/modules/forms/forms.routes.ts` and calls `crmService.createLeadFromFormSubmission()`.

## Client UI

### Navigation

CRM pages appear in the sidebar under the "CRM" group:
- **Leads** (`/app/crm/leads`) - Lead management dashboard
- **Contacts** (`/app/crm/contacts`) - Contact management dashboard

### Leads Page

- Tabular list of all workspace leads with status badges
- Status filter (All, New, Contacted, Qualified, Converted)
- Create lead dialog with form validation
- Inline status updates via dropdown
- Lead-to-contact conversion action
- Delete with confirmation
- Notes panel for each lead (add/view/delete notes)

### Contacts Page

- Tabular list of all workspace contacts
- Create contact dialog with name, email, phone fields
- Edit contact via dialog
- Delete with confirmation
- Notes panel for each contact

## Editor Shell Integration

The Webflow-like Editor Shell (feature-flagged via `VITE_EDITOR_SHELL=true`) includes a CRM section in the right rail's CMS tab. This stub provides:

- **Bind to Lead fields** - Future binding of element props to lead data
- **Bind to Contact fields** - Future binding of element props to contact data
- **Lead capture form mapping** - Future visual configuration of form-to-lead mappings

The CRM section appears collapsed by default and is a visual placeholder for future deep integration between the page builder and CRM data.

## Architecture Notes

- The CRM module follows the standard server module pattern with dedicated repo, service, and routes layers
- Workspace scoping is enforced at both the service and route levels
- The entitlement gate ensures only paying workspaces can access CRM features
- Notes use a polymorphic association pattern (either `leadId` or `contactId`, validated at the service layer)
- Lead conversion is non-destructive: the original lead record is preserved with status `"converted"`
