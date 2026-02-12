# Theme Tokens & Layout Presets

## Overview

ORIGIN's theme system provides safe, semantic styling controls for sites. Instead of exposing raw CSS or arbitrary colors, themes use **semantic tokens** (surface, text, border, accent) and **layout presets** (header style, footer style, spacing, widths, button shape) that map to guardrailed options.

Each site has one theme record stored in the `site_themes` table. Themes support both light and dark modes with independent color tokens for each.

## Architecture

### Database

```
site_themes
├── id (PK, UUID)
├── site_id (FK → sites.id, UNIQUE)
├── tokens_json (JSONB) — ThemeTokens object
├── layout_json (JSONB) — LayoutPresets object
└── updated_at (timestamp)
```

### Module

Located at `server/modules/siteTheme/`:
- `siteTheme.service.ts` — DB operations, defaults, site ownership verification
- `siteTheme.routes.ts` — GET/PUT endpoints with zod validation
- `index.ts` — Module registration under `/api/cms`

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cms/sites/:siteId/theme` | Get theme (auto-creates with defaults if none exists) |
| PUT | `/api/cms/sites/:siteId/theme` | Update tokens, layout, or both |

Both endpoints require authentication and workspace context. Site ownership is verified against the active workspace.

## Theme Tokens

Tokens are semantic color slots. Each mode (light/dark) has 7 color tokens:

| Token | Purpose |
|-------|---------|
| `surface` | Primary background color |
| `surfaceAlt` | Secondary / alternate background |
| `text` | Primary text color |
| `textMuted` | Secondary / de-emphasized text |
| `border` | Border and divider color |
| `accent` | Brand / CTA color |
| `accentText` | Text rendered on accent surfaces |

Additional token properties:
- `fontHeading` — Font family for headings
- `fontBody` — Font family for body text
- `borderRadius` — Global corner radius (none | sm | md | lg | full)

### Token Schema (Zod)

```typescript
themeTokenModeSchema = z.object({
  surface: z.string(),
  surfaceAlt: z.string(),
  text: z.string(),
  textMuted: z.string(),
  border: z.string(),
  accent: z.string(),
  accentText: z.string(),
});

themeTokensSchema = z.object({
  light: themeTokenModeSchema,
  dark: themeTokenModeSchema,
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(),
});
```

## Layout Presets

Layout presets control structural aspects of the site without exposing arbitrary CSS:

| Preset | Options | Default |
|--------|---------|---------|
| `headerStyle` | standard, centered, minimal, transparent | standard |
| `footerStyle` | standard, minimal, columns, centered | standard |
| `sectionSpacing` | compact, comfortable, spacious | comfortable |
| `containerWidth` | narrow, standard, wide, full | standard |
| `buttonStyle` | square, rounded, pill | rounded |

### Layout Schema (Zod)

```typescript
layoutPresetsSchema = z.object({
  headerStyle: z.enum(["standard", "centered", "minimal", "transparent"]),
  footerStyle: z.enum(["standard", "minimal", "columns", "centered"]),
  sectionSpacing: z.enum(["compact", "comfortable", "spacious"]),
  containerWidth: z.enum(["narrow", "standard", "wide", "full"]),
  buttonStyle: z.enum(["square", "rounded", "pill"]),
});
```

## Guardrails

The theme system is designed with guardrails:

1. **Semantic tokens** — Users pick colors for named purposes (accent, surface), not raw CSS properties
2. **Enum presets** — Layout options are fixed enums, preventing arbitrary CSS injection
3. **Zod validation** — All input validated server-side before storage
4. **Defaults** — Missing themes auto-create with sensible defaults
5. **Workspace ownership** — Site ownership verified before any read/write

## UI

The theme editor is accessible at `/app/sites/theme` from the sidebar under "Content > Theme".

Features:
- **Token Editor** — Color pickers and hex inputs for each semantic token in light and dark modes
- **Typography & Shape** — Font selectors and border radius
- **Layout Presets** — Dropdown selectors for each layout dimension
- **Live Preview** — Side panel showing a miniature site preview with current tokens and layout applied
- **Light/Dark toggle** — Switch preview between modes
- **Reset** — Restore all tokens and layout to defaults

## PUT Request Body

```json
{
  "tokens": {
    "light": { "surface": "#fff", "surfaceAlt": "#f8f9fa", ... },
    "dark": { "surface": "#1a1a2e", ... },
    "fontHeading": "Inter",
    "fontBody": "Inter",
    "borderRadius": "md"
  },
  "layout": {
    "headerStyle": "standard",
    "footerStyle": "columns",
    "sectionSpacing": "comfortable",
    "containerWidth": "standard",
    "buttonStyle": "rounded"
  }
}
```

Either `tokens`, `layout`, or both may be provided. Omitted fields retain their current values.
