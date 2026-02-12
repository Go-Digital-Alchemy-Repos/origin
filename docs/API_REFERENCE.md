# ORIGIN API Reference

## Base URL

All endpoints are prefixed with `/api`.

## Health

### GET /api/health

Check platform health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T10:00:00.000Z",
  "database": "connected"
}
```

## Documentation

### GET /api/docs

List all published documentation entries, ordered by sort order.

**Response:** Array of DocEntry objects.

### GET /api/docs/:slug

Get a single documentation entry by slug.

**Parameters:**
- `slug` (path) — URL-friendly identifier

**Response:** DocEntry object or 404.

### POST /api/docs

Create a new documentation entry.

**Body:**
```json
{
  "title": "My Doc",
  "slug": "my-doc",
  "content": "Markdown content...",
  "category": "guides",
  "type": "developer",
  "tags": ["example"],
  "sortOrder": 10,
  "isPublished": true
}
```

## Modules

### GET /api/modules

List all registered platform modules.

**Response:** Array of OriginModule objects.

### GET /api/modules/:slug

Get a single module by slug.

**Parameters:**
- `slug` (path) — Module slug identifier

**Response:** OriginModule object or 404.

## Error Format

All errors follow this standard shape:

```json
{
  "error": {
    "message": "Human readable error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Error Codes

| Code             | HTTP Status | Description              |
|------------------|-------------|--------------------------|
| VALIDATION_ERROR | 400         | Invalid request data     |
| NOT_FOUND        | 404         | Resource not found       |
| INTERNAL_ERROR   | 500         | Unexpected server error  |
