# AI Copilot Context System

## Overview

The AI Copilot Context System enriches AI interactions with workspace-specific data, enabling the copilot to provide contextually relevant suggestions. The system gathers entitlements, installed apps, site pages, collections, and menus to build a rich context that is injected into prompt templates before sending to the LLM.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  AI Copilot Module                │
│  server/modules/aiCopilot/                       │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Context      │  │ Prompt Templates         │  │
│  │ Builder      │──│ - General Assistant      │  │
│  │              │  │ - Content Strategy       │  │
│  │ Gathers:     │  │ - Lead Capture & CRM    │  │
│  │ - Entitle.   │  │ - Site Optimization      │  │
│  │ - Installs   │  │                          │  │
│  │ - Sites      │  │ Each template has:       │  │
│  │ - Pages      │  │ - systemPrompt           │  │
│  │ - Collections│  │ - contextInjection(ctx)  │  │
│  │ - Menus      │  │                          │  │
│  └──────────────┘  └──────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Routes (aiCopilot.routes.ts)                 ││
│  │ GET  /templates     — list templates         ││
│  │ GET  /context       — raw workspace context  ││
│  │ POST /context/preview — preview prompt build ││
│  │ POST /chat          — send message to LLM    ││
│  │ POST /suggest       — rule-based suggestions ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `server/modules/aiCopilot/index.ts` | Module entry, mounts routes at `/ai-copilot` |
| `server/modules/aiCopilot/context-builder.ts` | Gathers workspace data into `WorkspaceContext` |
| `server/modules/aiCopilot/prompt-templates.ts` | Defines prompt templates and context formatters |
| `server/modules/aiCopilot/aiCopilot.routes.ts` | API routes for templates, context, chat, suggest |

## Context Builder

The `buildWorkspaceContext(workspaceId)` function queries the following in parallel:

| Data Source | Table | Fields Gathered |
|-------------|-------|-----------------|
| Entitlements | `entitlements` | `features[]`, `limits{}` |
| Installed Apps | `marketplace_installs` JOIN `marketplace_items` | `name`, `slug`, `type`, `enabled` |
| Sites | `sites` | `id`, `name`, `slug`, `status` |
| Pages | `pages` (per site) | `title`, `slug`, `status` |
| Collections | `collections` | `name`, `slug` |
| Menus | `menus` | `name`, `slot` |

A `deriveCapabilities()` function maps features and installed apps to capability flags (e.g., `crm`, `forms`, `blog`, `seo`, `collections`, `marketplace`).

### WorkspaceContext Shape

```typescript
interface WorkspaceContext {
  workspace: { id: string; features: string[]; limits: Record<string, unknown> };
  installedApps: Array<{ name: string; slug: string; type: string; enabled: boolean }>;
  sites: Array<{
    id: string; name: string; slug: string; status: string;
    pageCount: number;
    pages: Array<{ title: string; slug: string; status: string }>;
  }>;
  collections: Array<{ name: string; slug: string }>;
  menus: Array<{ name: string; slot: string | null }>;
  capabilities: string[];
}
```

## Prompt Templates

Each template defines:

- `systemPrompt` — The LLM system message establishing the assistant's role
- `contextInjection(ctx)` — A function that formats the workspace context into a structured block appended to the system prompt

### Available Templates

| ID | Name | Focus | Context Injection |
|----|------|-------|-------------------|
| `general-assistant` | General Assistant | Full workspace context | All data: features, apps, sites, pages, collections, menus |
| `content-strategy` | Content Strategy | Content planning | Sites, pages, collections, blog/SEO flags |
| `lead-capture` | Lead Capture & CRM | Lead generation | CRM/Forms status, sites, pages, installed apps |
| `site-optimization` | Site Optimization | Structure improvement | Sites, pages, menus, collections, capabilities |

### Example: CRM-Aware Context Injection

When CRM is enabled, the lead-capture template injects:

```
## Lead Capture Context

**CRM Enabled:** Yes — lead and contact management available
**Forms Enabled:** Yes — form builder available for lead capture

### Sites & Pages (potential lead capture locations)
- Site "My Business" (my-business, published): 5 page(s)
  Pages: Home [PUBLISHED], About [PUBLISHED], Contact [PUBLISHED], Services [PUBLISHED], Blog [DRAFT]

### Installed Apps
- CRM Suite (app, active)
- Live Chat Widget (widget, active)
```

## API Reference

All endpoints require `requireAuth()`.

### `GET /api/ai-copilot/templates`

Returns available prompt templates (id, name, description).

### `GET /api/ai-copilot/context`

Requires: `requireWorkspaceContext()`

Returns the raw `WorkspaceContext` for the active workspace.

### `POST /api/ai-copilot/context/preview`

Requires: `requireWorkspaceContext()`, `validateBody()`

Body: `{ templateId?: string }` (defaults to `"general-assistant"`)

Returns the fully assembled system prompt and context summary without calling the LLM.

### `POST /api/ai-copilot/chat`

Requires: `requireWorkspaceContext()`, `validateBody()`, `OPENAI_API_KEY` env var

Body: `{ message: string, templateId?: string }`

Builds the context, assembles the prompt, and sends to OpenAI `gpt-4o-mini`. Returns the assistant response with context summary.

Returns `503 AI_NOT_CONFIGURED` if `OPENAI_API_KEY` is not set.

### `POST /api/ai-copilot/suggest`

Requires: `requireWorkspaceContext()`

Returns rule-based suggestions (no LLM call) based on workspace state:

- CRM enabled but no contact page → suggest lead capture form
- Blog available but no posts → suggest starting blog
- Draft pages exist → suggest publishing
- No menus configured → suggest navigation setup
- No sites → suggest creating first site

## Suggestion Engine

The `/suggest` endpoint uses deterministic rules (no LLM) to provide instant recommendations:

| Condition | Suggestion Type | Example |
|-----------|----------------|---------|
| CRM active, no contact page | `lead-capture` | "Add a contact form for lead capture" |
| CRM active | `crm-workflow` | "Set up lead nurturing workflow" |
| CRM not active | `upsell` | "Enable CRM for lead management" |
| Blog active, no collections | `content` | "Start your blog" |
| SEO active, draft pages | `seo` | "Publish N draft pages" |
| No menus, has sites | `navigation` | "Set up site navigation" |
| No sites | `getting-started` | "Create your first site" |

## Configuration

| Env Variable | Required | Description |
|-------------|----------|-------------|
| `OPENAI_API_KEY` | For `/chat` only | OpenAI API key for LLM-powered responses |

The `/templates`, `/context`, `/context/preview`, and `/suggest` endpoints work without an API key. Only `/chat` requires it.

## Design Decisions

1. **Non-destructive:** The module only reads workspace data — it never modifies entitlements, installs, pages, or any other resources.
2. **Parallel queries:** Context builder runs all data queries in parallel for performance.
3. **Template-driven:** Adding new copilot personas only requires adding a new entry to the `promptTemplates` array.
4. **Graceful degradation:** The suggest endpoint works without any API key, providing value even without LLM access.
5. **Standard error shapes:** All errors follow the `{ error: { message, code } }` convention.
