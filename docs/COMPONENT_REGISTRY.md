# ORIGIN Component Registry

## Overview

The Component Registry is ORIGIN's global catalog of page builder components. Each registered component defines its prop schema, default presets, preview configuration, client-facing usage documentation, and developer notes.

The registry is the single source of truth that powers:
- **Builder Palette** (planned) — Components available for drag-and-drop
- **Section Presets** (planned) — Pre-configured component instances
- **Marketplace Packs** (planned) — Bundled components in marketplace items
- **Resource Docs** (active) — Component usage docs in Help & Resources

## Architecture

The registry is defined as a TypeScript module at `shared/component-registry.ts`. This file is consumed by both the server (API) and client (type safety). It is not stored in the database — it lives in code and is versioned with the application.

### Why Not a Database Table?

Component definitions are part of the platform's code, not user-generated content. Storing them in code provides:
- Type safety via TypeScript interfaces
- Version control via Git
- Build-time validation of prop schemas
- No migration overhead when updating components

## Data Model

### RegistryComponent

| Field | Type | Description |
|-------|------|-------------|
| name | string | Display name (e.g., "Hero") |
| slug | string | URL-friendly identifier |
| description | string | Short description |
| category | ComponentCategory | layout, content, media, commerce, social-proof, navigation, utility |
| icon | string | Lucide icon name |
| version | string | Semantic version |
| propSchema | ComponentPropField[] | Array of prop definitions |
| defaultPreset | ComponentPresetConfig | Default configuration |
| additionalPresets | ComponentPresetConfig[] | Optional variant presets |
| previewConfig | ComponentPreviewConfig | Preview rendering hints |
| docsMarkdown | string | Client-facing usage documentation |
| devNotes | string | Developer-facing implementation notes |
| tags | string[] | Searchable tags |
| status | "stable" \| "beta" \| "experimental" \| "deprecated" | Component maturity |

### ComponentPropField

| Field | Type | Description |
|-------|------|-------------|
| name | string | Prop name (camelCase) |
| type | string | string, number, boolean, enum, richtext, image, color, array, object |
| label | string | Human-readable label |
| description | string? | Optional description |
| required | boolean? | Whether the prop is required |
| default | unknown? | Default value |
| options | string[]? | Enum options (for type "enum") |

### ComponentPresetConfig

| Field | Type | Description |
|-------|------|-------------|
| name | string | Preset name |
| description | string | Preset description |
| props | Record<string, unknown> | Pre-configured prop values |

### ComponentPreviewConfig

| Field | Type | Description |
|-------|------|-------------|
| width | "full" \| "contained" \| "narrow" | Preview container width |
| height | "auto" \| "fixed" | Height behavior |
| fixedHeight | number? | Pixel height when height is "fixed" |
| background | "light" \| "dark" \| "transparent" | Preview background |

## Initial Components

| Component | Category | Status | Props | Presets |
|-----------|----------|--------|-------|---------|
| Hero | layout | stable | 9 | 2 |
| Feature Grid | content | stable | 5 | 1 |
| Testimonials | social-proof | stable | 5 | 1 |
| Pricing | commerce | stable | 5 | 1 |
| FAQ | content | stable | 5 | 1 |
| Gallery | media | stable | 6 | 1 |
| CTA | content | stable | 6 | 1 |
| Rich Text | content | stable | 3 | 1 |
| Divider | utility | stable | 4 | 1 |
| Spacer | utility | stable | 2 | 1 |

## API Routes

All routes prefixed with `/api/component-registry`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/component-registry` | List all components (summary: name, slug, category, status, prop count, preset count) |
| GET | `/api/component-registry/:slug` | Get full component detail (includes propSchema, presets, docs, devNotes) |

## UI

The Component Registry is accessible in the Platform Studio sidebar under "Resources" at `/app/studio/components`. It is read-only and provides:

1. **Grid View** — Browse all components with category tabs and search
2. **Detail View** — Three tabs per component:
   - Props & Presets: Prop schema table, preset cards with expandable config
   - Usage Docs: Client-facing Markdown documentation
   - Dev Notes: Developer-facing implementation notes

## Adding a New Component

To add a component to the registry:

1. Add a new `RegistryComponent` entry to the `componentRegistry` array in `shared/component-registry.ts`
2. Define the complete prop schema with types, labels, and defaults
3. Create at least one default preset
4. Write both `docsMarkdown` (client-facing) and `devNotes` (developer-facing)
5. Set the appropriate category and status
6. The component appears automatically in the API and UI

## Future Enhancements

- **Builder Integration**: Components rendered dynamically from prop values in the page builder
- **Live Preview**: In-browser preview rendering using the previewConfig
- **Custom Components**: User-defined components registered via the marketplace
- **Component Variants**: Support for component variations and A/B testing
- **Dependency Graph**: Track which components depend on others
- **Analytics**: Track component usage across sites
