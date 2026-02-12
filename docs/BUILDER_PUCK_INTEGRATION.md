# Page Builder — Puck Integration

## Overview

ORIGIN uses [Puck](https://puckeditor.com) (`@puckeditor/core`) as its visual drag-and-drop page builder. The integration is modular — Puck-specific code is isolated in `client/src/lib/builder/` and `client/src/components/builder/`, so it can be swapped for another editor engine without touching the CMS layer.

## Architecture

```
shared/component-registry.ts    ← Global registry (source of truth)
        ↓
client/src/lib/builder/
├── types.ts                     ← BuilderContent schema + validation
├── puck-adapter.ts              ← Registry → Puck config mapper
├── components.tsx               ← React implementations for builder preview + render
└── renderer.tsx                 ← Shared renderer (content_json → React output)

client/src/components/builder/
└── PuckEditor.tsx               ← Puck editor wrapper with responsive preview

client/src/pages/page-editor.tsx ← Page editor with "Open Builder" button
```

## Content Format (content_json)

All builder output is stored in `page_revisions.content_json` using a versioned envelope:

```json
{
  "schemaVersion": 1,
  "data": {
    "content": [
      {
        "type": "hero",
        "props": {
          "id": "abc123",
          "headline": "Welcome",
          "subheading": "Get started today",
          "ctaLabel": "Sign Up",
          "alignment": "center",
          "minHeight": "large"
        }
      },
      {
        "type": "feature-grid",
        "props": {
          "id": "def456",
          "heading": "Features",
          "columns": "3",
          "variant": "cards",
          "features": "[{\"icon\":\"zap\",\"title\":\"Fast\",\"description\":\"Lightning fast.\"}]"
        }
      }
    ],
    "root": {}
  }
}
```

### Key Properties

| Field | Description |
|-------|-------------|
| `schemaVersion` | Integer version for forward compatibility |
| `data.content` | Ordered array of blocks |
| `data.content[].type` | Component slug from the Global Component Registry |
| `data.content[].props.id` | Puck-generated unique ID per block instance |
| `data.root` | Page-level settings (reserved for future use) |

## Component Mapping

The `puck-adapter.ts` module translates registry `ComponentPropField` types to Puck field types:

| Registry Type | Puck Field Type | Notes |
|---------------|-----------------|-------|
| `string` | `text` | Single-line text input |
| `richtext` | `textarea` | Multi-line text |
| `number` | `number` | Numeric input with optional min/max |
| `boolean` | `radio` | Yes/No radio group |
| `enum` | `select` | Dropdown from `options[]` |
| `image` | `text` | URL text input (media picker planned) |
| `color` | `text` | Hex color input (theme token picker planned) |
| `array` | `textarea` | JSON textarea (structured array editor planned) |
| `object` | `textarea` | JSON textarea |

### Guardrails

- **No raw CSS**: Components only accept semantic props (alignment enums, variant names, theme token references)
- **Enum-restricted controls**: All style-affecting props use `enum` type with predefined safe options
- **Schema validation**: `validateBuilderContent()` checks version compatibility before save
- **Registry validation**: `validateContentCompatibility()` verifies all component types exist in the current registry

## Using the Builder

### Opening the Builder

1. Navigate to **Pages** → click a page → page editor opens
2. Click **"Open Builder"** button in the toolbar
3. The full-screen Puck editor opens with the component palette on the left

### Adding Blocks

- Drag components from the left panel onto the canvas
- Components are grouped by registry category (layout, content, media, etc.)
- Each component starts with its default preset props

### Editing Props

- Click any block on the canvas to select it
- The right panel shows the block's prop inspector
- Edit text, toggle options, change enums via the inspector fields

### Responsive Preview

- Use the Desktop / Tablet / Mobile viewport buttons in the toolbar
- Click **Preview** to see the page without the editor UI
- Preview mode also supports viewport switching

### Saving

- **Save Draft**: Saves content to a new revision (keeps last 10)
- **Publish**: Saves and marks the page as published
- Both actions wrap the Puck data in the `BuilderContent` envelope with `schemaVersion`

## Rendering Pages

The `ContentRenderer` component and `renderContentToReact()` function convert stored `content_json` back to React:

```tsx
import { ContentRenderer } from "@/lib/builder/renderer";

function PageView({ contentJson }) {
  return <ContentRenderer contentJson={contentJson} />;
}
```

Or use the Puck `<Render>` component directly via `PageRenderer`:

```tsx
import { PageRenderer } from "@/components/builder/PuckEditor";

function PageView({ contentJson }) {
  return <PageRenderer content={contentJson} />;
}
```

Both approaches resolve component slugs from the same `componentRenderMap`.

## Theme Token Integration

Components are designed to consume the site's semantic theme tokens:

- **Colors**: Components use Tailwind utility classes that map to CSS custom properties (e.g., `text-foreground`, `bg-background`, `text-muted-foreground`, `border-border`)
- **The Hero block** uses a deep navy gradient as its default background, with white text overlay
- **Cards, buttons, badges** use shadcn/ui components that automatically respect the active theme

When the site theme system is extended to inject per-site CSS custom properties at render time, all builder components will automatically reflect those tokens.

## Swapping the Builder Engine

To replace Puck with another editor:

1. Create a new adapter in `client/src/lib/builder/` that maps registry components to the new engine's config format
2. Create a new editor wrapper in `client/src/components/builder/` that implements the same interface as `PuckEditor.tsx`:
   - `initialContent: unknown`
   - `onSave: (content: BuilderContent) => void`
   - `onPublish?: (content: BuilderContent) => void`
   - `onClose: () => void`
3. Keep the `BuilderContent` envelope format — only change `data` structure as needed
4. The `ContentRenderer` in `renderer.tsx` is engine-agnostic and only needs `componentRenderMap`

## Available Components

All components from the Global Component Registry are available in the builder:

| Component | Category | Description |
|-----------|----------|-------------|
| Hero | layout | Full-width hero section with CTA buttons |
| Feature Grid | content | Grid of features/benefits with icons |
| Testimonials | social-proof | Customer reviews with ratings |
| Pricing | commerce | Pricing table with plan comparison |
| FAQ | content | Expandable accordion Q&A |
| Gallery | media | Image gallery with grid/masonry layouts |
| CTA | content | Call-to-action banner |
| Rich Text | content | Markdown content block |
| Divider | utility | Visual separator |
| Spacer | utility | Invisible vertical spacing |
