# Forms System

## Overview

ORIGIN's Forms System provides a Gravity Forms-style form builder with configurable fields, spam protection, submission management, and webhook integration. Forms are scoped to sites and workspaces with full CRUD support.

## Database Tables

### `forms`

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| site_id | varchar | FK → sites.id |
| workspace_id | varchar | FK → workspaces.id |
| name | text | Form name |
| fields_json | jsonb | Array of field definitions |
| settings_json | jsonb | Form settings (submit label, success message, etc.) |
| is_active | boolean | Whether form accepts submissions (default: true) |
| created_at | timestamp | Creation timestamp |

### `form_submissions`

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| form_id | varchar | FK → forms.id (CASCADE) |
| data_json | jsonb | Submitted field values |
| ip_address | text | Submitter IP address |
| user_agent | text | Submitter user agent |
| created_at | timestamp | Submission timestamp |

### `form_rate_limits`

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| form_id | varchar | FK → forms.id |
| ip_hash | text | SHA-256 hash of IP (first 16 chars) |
| created_at | timestamp | Rate limit window timestamp |

## Field Types

Forms support a configurable set of field types defined via `formFieldSchema`:

- Text input
- Textarea
- Email
- Number
- Select/Dropdown
- Checkbox
- Radio buttons
- Date
- File upload placeholder

Each field has: `id`, `type`, `label`, `placeholder`, `required`, `options` (for select/radio/checkbox).

## Spam Protection

Two layers of spam protection:

1. **Honeypot field** — Hidden field (`_hp_field`); if filled, submission silently succeeds without storage
2. **IP rate limiting** — Configurable per-minute limit per form per IP (default: 10/minute)

## Server Module

Located at `server/modules/forms/`:

- `forms.service.ts` — CRUD operations, submission storage, rate limiting, workspace scoping
- `forms.routes.ts` — Express routes with auth middleware and public submission endpoint
- `index.ts` — Module registration

## API Endpoints

### Authenticated (require auth + workspace context)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/sites/:siteId/forms` | List forms for a site |
| POST | `/api/cms/sites/:siteId/forms` | Create a new form |
| GET | `/api/cms/forms/:formId` | Get form details |
| PATCH | `/api/cms/forms/:formId` | Update a form |
| DELETE | `/api/cms/forms/:formId` | Delete a form |
| GET | `/api/cms/forms/:formId/submissions` | List submissions (paginated) |
| DELETE | `/api/cms/forms/:formId/submissions/:submissionId` | Delete a submission |

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/public/forms/:formId/definition` | Get form field definitions for rendering |
| POST | `/api/cms/public/forms/:formId/submit` | Submit a form response |

## Webhook Integration

When `webhookUrl` is configured in form settings, each submission triggers a POST request:

```json
{
  "formId": "...",
  "formName": "...",
  "submissionId": "...",
  "payload": { "field_id": "value" },
  "submittedAt": "2025-01-01T00:00:00Z"
}
```

Webhook failures are silently ignored to prevent blocking submission responses.

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Missing workspace or invalid input |
| NOT_FOUND | 404 | Form not found or inactive |
| RATE_LIMITED | 429 | Too many submissions from this IP |

## Environment Variables

No additional environment variables required.

## Tenancy Model

- Forms are scoped to `(siteId, workspaceId)` pairs
- All authenticated endpoints verify workspace membership before returning data
- Public endpoints (`/submit`, `/definition`) only expose active forms

## Testing

1. Create a form via POST `/api/cms/sites/:siteId/forms`
2. Verify field configuration appears in the definition endpoint
3. Submit a test response via the public submit endpoint
4. Verify submission appears in the admin submissions list
5. Test honeypot by including `_hp_field` in submission (should return success but not store)
6. Test rate limiting by submitting rapidly
7. Verify webhook fires if configured
