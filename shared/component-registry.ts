import { z } from "zod";

export const componentCategoryEnum = z.enum([
  "layout",
  "content",
  "media",
  "commerce",
  "social-proof",
  "navigation",
  "utility",
]);

export type ComponentCategory = z.infer<typeof componentCategoryEnum>;

export interface ComponentPropField {
  name: string;
  type: "string" | "number" | "boolean" | "enum" | "richtext" | "image" | "color" | "array" | "object";
  label: string;
  description?: string;
  required?: boolean;
  default?: unknown;
  options?: string[];
  min?: number;
  max?: number;
}

export interface ComponentPresetConfig {
  name: string;
  description: string;
  props: Record<string, unknown>;
}

export interface ComponentPreviewConfig {
  width: "full" | "contained" | "narrow";
  height: "auto" | "fixed";
  fixedHeight?: number;
  background?: "light" | "dark" | "transparent";
}

export interface RegistryComponent {
  name: string;
  slug: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  version: string;
  propSchema: ComponentPropField[];
  defaultPreset: ComponentPresetConfig;
  additionalPresets?: ComponentPresetConfig[];
  previewConfig: ComponentPreviewConfig;
  docsMarkdown: string;
  devNotes: string;
  tags: string[];
  status: "stable" | "beta" | "experimental" | "deprecated";
}

export const componentRegistry: RegistryComponent[] = [
  {
    name: "Hero",
    slug: "hero",
    description: "Full-width hero section with headline, subheading, CTA buttons, and background image support.",
    category: "layout",
    icon: "image",
    version: "1.0.0",
    propSchema: [
      { name: "headline", type: "string", label: "Headline", required: true, default: "Build Something Amazing" },
      { name: "subheading", type: "string", label: "Subheading", default: "Start your journey with a platform designed for scale." },
      { name: "ctaLabel", type: "string", label: "CTA Button Label", default: "Get Started" },
      { name: "ctaHref", type: "string", label: "CTA Link", default: "#" },
      { name: "secondaryCtaLabel", type: "string", label: "Secondary CTA Label", default: "Learn More" },
      { name: "secondaryCtaHref", type: "string", label: "Secondary CTA Link", default: "#" },
      { name: "backgroundImage", type: "image", label: "Background Image", description: "Optional background image. A dark wash gradient is applied automatically." },
      { name: "alignment", type: "enum", label: "Text Alignment", options: ["left", "center", "right"], default: "center" },
      { name: "minHeight", type: "enum", label: "Minimum Height", options: ["small", "medium", "large", "fullscreen"], default: "large" },
    ],
    defaultPreset: {
      name: "Default",
      description: "Centered hero with headline, subheading, and two CTA buttons.",
      props: {
        headline: "Build Something Amazing",
        subheading: "Start your journey with a platform designed for scale.",
        ctaLabel: "Get Started",
        ctaHref: "#",
        secondaryCtaLabel: "Learn More",
        secondaryCtaHref: "#",
        alignment: "center",
        minHeight: "large",
      },
    },
    additionalPresets: [
      {
        name: "Left Aligned",
        description: "Hero with left-aligned text, ideal for split layouts.",
        props: {
          headline: "Your Story Starts Here",
          subheading: "Craft beautiful websites without limits.",
          ctaLabel: "Start Free",
          ctaHref: "#",
          alignment: "left",
          minHeight: "medium",
        },
      },
    ],
    previewConfig: { width: "full", height: "fixed", fixedHeight: 500, background: "dark" },
    docsMarkdown: `# Hero Section

The Hero component creates a full-width banner section, typically used at the top of a page.

## Usage

Add a Hero section from the builder palette. Configure the headline, subheading, and call-to-action buttons.

## Options

- **Headline**: The main title text displayed prominently.
- **Subheading**: Supporting text below the headline.
- **CTA Buttons**: Primary and secondary action buttons with customizable labels and links.
- **Background Image**: Optional image with automatic dark wash overlay for text readability.
- **Alignment**: Left, center, or right text alignment.
- **Height**: Small, medium, large, or fullscreen.

## Tips

- Use concise, action-oriented headlines.
- Background images work best at 1920x1080 or larger.
- The dark wash ensures light text is always readable on any image.`,
    devNotes: `## Hero Component — Developer Notes

### Rendering
- Background image uses CSS \`background-size: cover\` with \`background-position: center\`.
- Dark wash gradient: \`linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4))\` overlay.
- Text is always rendered in light colors over the wash, independent of theme.

### Responsive
- On mobile (<768px), \`minHeight\` "fullscreen" maps to \`100svh\`, others scale proportionally.
- CTA buttons stack vertically on mobile.

### Accessibility
- \`<h1>\` for headline, \`<p>\` for subheading.
- CTA buttons are standard \`<a>\` tags with \`role="button"\`.
- Background image is decorative (\`aria-hidden\`).

### Performance
- Background images should be lazy-loaded when below the fold.
- Consider using \`<picture>\` with responsive srcset for optimized delivery.`,
    tags: ["hero", "banner", "header", "cta", "landing"],
    status: "stable",
  },
  {
    name: "Feature Grid",
    slug: "feature-grid",
    description: "Grid layout showcasing features or benefits with icons, titles, and descriptions.",
    category: "content",
    icon: "grid-3x3",
    version: "1.0.0",
    propSchema: [
      { name: "heading", type: "string", label: "Section Heading", default: "Features" },
      { name: "subheading", type: "string", label: "Section Subheading", default: "Everything you need to succeed." },
      { name: "columns", type: "enum", label: "Columns", options: ["2", "3", "4"], default: "3" },
      { name: "features", type: "array", label: "Features", description: "List of features with icon, title, and description." },
      { name: "variant", type: "enum", label: "Style Variant", options: ["cards", "minimal", "bordered"], default: "cards" },
    ],
    defaultPreset: {
      name: "Default",
      description: "3-column feature grid with card styling.",
      props: {
        heading: "Features",
        subheading: "Everything you need to succeed.",
        columns: "3",
        variant: "cards",
        features: [
          { icon: "zap", title: "Fast", description: "Lightning-fast performance out of the box." },
          { icon: "shield", title: "Secure", description: "Enterprise-grade security built in." },
          { icon: "palette", title: "Beautiful", description: "Stunning design with zero effort." },
        ],
      },
    },
    previewConfig: { width: "contained", height: "auto", background: "light" },
    docsMarkdown: `# Feature Grid

Display features, benefits, or services in a responsive grid layout.

## Usage

Add a Feature Grid section and configure the number of columns and style variant.

## Options

- **Heading / Subheading**: Section title and description above the grid.
- **Columns**: 2, 3, or 4 columns (responsive).
- **Features**: Each feature has an icon (Lucide name), title, and description.
- **Variant**: Cards (elevated), minimal (flat), or bordered.

## Tips

- Keep feature descriptions concise (1-2 sentences).
- Use consistent icon styles across all features.
- 3 or 6 features work best visually for a 3-column layout.`,
    devNotes: `## Feature Grid — Developer Notes

### Data Structure
Each feature item: \`{ icon: string, title: string, description: string }\`.
Icons are resolved from the Lucide icon set at render time.

### Layout
- Uses CSS Grid with \`grid-template-columns: repeat(N, 1fr)\`.
- Responsive: collapses to 1 column on mobile, 2 on tablet.
- Card variant uses \`<Card>\` component with consistent padding.

### Extensibility
- Custom icon rendering can be swapped via the component registry's icon resolver.
- Feature items support optional \`href\` for linking (planned v1.1).`,
    tags: ["features", "grid", "benefits", "services"],
    status: "stable",
  },
  {
    name: "Testimonials",
    slug: "testimonials",
    description: "Customer testimonials displayed in a carousel or grid with avatars, names, and ratings.",
    category: "social-proof",
    icon: "message-square",
    version: "1.0.0",
    propSchema: [
      { name: "heading", type: "string", label: "Section Heading", default: "What Our Customers Say" },
      { name: "layout", type: "enum", label: "Layout", options: ["grid", "carousel", "stacked"], default: "grid" },
      { name: "columns", type: "enum", label: "Columns (Grid)", options: ["2", "3"], default: "3" },
      { name: "showRating", type: "boolean", label: "Show Star Rating", default: true },
      { name: "testimonials", type: "array", label: "Testimonials", description: "List of testimonial entries." },
    ],
    defaultPreset: {
      name: "Default",
      description: "3-column testimonial grid with ratings.",
      props: {
        heading: "What Our Customers Say",
        layout: "grid",
        columns: "3",
        showRating: true,
        testimonials: [
          { name: "Sarah Chen", role: "CEO, TechStart", quote: "Transformed our web presence completely.", rating: 5, avatar: "" },
          { name: "Marcus Johnson", role: "Designer, Creative Co", quote: "The best builder I've ever used.", rating: 5, avatar: "" },
          { name: "Emily Rodriguez", role: "Marketing Director", quote: "Saved us months of development time.", rating: 5, avatar: "" },
        ],
      },
    },
    previewConfig: { width: "contained", height: "auto", background: "light" },
    docsMarkdown: `# Testimonials

Showcase customer feedback with quotes, names, roles, and optional star ratings.

## Usage

Add testimonials with the customer's quote, name, role/company, and rating.

## Options

- **Layout**: Grid, carousel, or stacked.
- **Columns**: 2 or 3 columns for grid layout.
- **Show Rating**: Toggle star ratings on or off.
- **Testimonials**: Each entry has name, role, quote, rating (1-5), and optional avatar.

## Tips

- Use real customer quotes for authenticity.
- Avatars add credibility but are optional.
- 3 testimonials is the ideal minimum.`,
    devNotes: `## Testimonials — Developer Notes

### Data Structure
Each testimonial: \`{ name: string, role: string, quote: string, rating: number, avatar?: string }\`.

### Carousel
- Carousel variant uses CSS scroll-snap with touch support.
- Auto-advance can be configured via metadata (default: off).

### Accessibility
- Carousel uses \`role="region"\` with \`aria-label\`.
- Star ratings use \`aria-label="N out of 5 stars"\`.`,
    tags: ["testimonials", "reviews", "social-proof", "carousel"],
    status: "stable",
  },
  {
    name: "Pricing",
    slug: "pricing",
    description: "Pricing table with plan comparison, feature lists, and call-to-action buttons.",
    category: "commerce",
    icon: "credit-card",
    version: "1.0.0",
    propSchema: [
      { name: "heading", type: "string", label: "Section Heading", default: "Simple, Transparent Pricing" },
      { name: "subheading", type: "string", label: "Subheading", default: "Choose the plan that fits your needs." },
      { name: "showToggle", type: "boolean", label: "Show Monthly/Annual Toggle", default: true },
      { name: "highlightPlan", type: "string", label: "Highlighted Plan Name", default: "Pro" },
      { name: "plans", type: "array", label: "Plans", description: "List of pricing plans." },
    ],
    defaultPreset: {
      name: "Default",
      description: "3-plan pricing table with monthly/annual toggle.",
      props: {
        heading: "Simple, Transparent Pricing",
        subheading: "Choose the plan that fits your needs.",
        showToggle: true,
        highlightPlan: "Pro",
        plans: [
          { name: "Starter", monthlyPrice: 29, annualPrice: 290, features: ["5 pages", "1 form", "Basic SEO"], ctaLabel: "Start Free" },
          { name: "Pro", monthlyPrice: 79, annualPrice: 790, features: ["Unlimited pages", "10 forms", "Advanced SEO", "Priority support"], ctaLabel: "Get Pro" },
          { name: "Enterprise", monthlyPrice: 199, annualPrice: 1990, features: ["Everything in Pro", "Custom integrations", "Dedicated support", "SLA"], ctaLabel: "Contact Sales" },
        ],
      },
    },
    previewConfig: { width: "contained", height: "auto", background: "light" },
    docsMarkdown: `# Pricing

Display pricing plans with feature comparison and call-to-action buttons.

## Usage

Configure your pricing plans with names, prices, features, and CTAs.

## Options

- **Monthly/Annual Toggle**: Let visitors switch between billing periods.
- **Highlighted Plan**: Visually emphasize the recommended plan.
- **Plans**: Each plan has a name, monthly/annual price, feature list, and CTA button.

## Tips

- Highlight your most popular plan to guide user decisions.
- Keep feature lists scannable (5-7 items max per plan).
- Use clear, action-oriented CTA labels.`,
    devNotes: `## Pricing — Developer Notes

### Toggle State
- Monthly/annual toggle is client-side state only.
- Prices are stored as integers (cents) and formatted at render time.

### Highlighting
- The highlighted plan gets a \`border-primary\` ring and a "Most Popular" badge.
- Only one plan can be highlighted at a time.

### Stripe Integration
- CTA buttons can link to Stripe Checkout URLs when billing module is configured.
- \`ctaHref\` prop supports dynamic URL generation via the billing API.`,
    tags: ["pricing", "plans", "comparison", "commerce"],
    status: "stable",
  },
  {
    name: "FAQ",
    slug: "faq",
    description: "Frequently asked questions with expandable accordion items and optional search.",
    category: "content",
    icon: "help-circle",
    version: "1.0.0",
    propSchema: [
      { name: "heading", type: "string", label: "Section Heading", default: "Frequently Asked Questions" },
      { name: "subheading", type: "string", label: "Subheading", default: "Find answers to common questions." },
      { name: "showSearch", type: "boolean", label: "Show Search Filter", default: false },
      { name: "allowMultiple", type: "boolean", label: "Allow Multiple Open", default: false },
      { name: "items", type: "array", label: "FAQ Items", description: "Question and answer pairs." },
    ],
    defaultPreset: {
      name: "Default",
      description: "Simple FAQ accordion with 5 questions.",
      props: {
        heading: "Frequently Asked Questions",
        subheading: "Find answers to common questions.",
        showSearch: false,
        allowMultiple: false,
        items: [
          { question: "How do I get started?", answer: "Sign up for a free account and follow the onboarding guide." },
          { question: "Can I use my own domain?", answer: "Yes, custom domains are supported on all paid plans." },
          { question: "Is there a free plan?", answer: "We offer a free starter plan with essential features." },
          { question: "How do I contact support?", answer: "Reach us via the Help & Resources page or email support." },
          { question: "Can I export my site?", answer: "Full site export is available on Pro and Enterprise plans." },
        ],
      },
    },
    previewConfig: { width: "contained", height: "auto", background: "transparent" },
    docsMarkdown: `# FAQ

Display frequently asked questions in an expandable accordion format.

## Usage

Add question and answer pairs. Visitors click to expand each answer.

## Options

- **Search Filter**: Optional search bar to filter questions by keyword.
- **Allow Multiple Open**: Let visitors expand multiple answers simultaneously.
- **FAQ Items**: Each item has a question and an answer (supports rich text in answers).

## Tips

- Order questions from most to least common.
- Keep answers concise and link to detailed docs when needed.
- 5-10 questions is the ideal range.`,
    devNotes: `## FAQ — Developer Notes

### Accordion
- Uses Radix Accordion primitive (\`type="single"\` or \`type="multiple"\`).
- Smooth height animation via CSS \`grid-template-rows\` transition.

### Search
- Client-side fuzzy search filters both question and answer text.
- Uses case-insensitive substring matching (no external library needed).

### Rich Text
- Answer field supports basic Markdown rendering (bold, italic, links, lists).
- Rendered via a shared Markdown component.`,
    tags: ["faq", "accordion", "questions", "support"],
    status: "stable",
  },
  {
    name: "Gallery",
    slug: "gallery",
    description: "Image gallery with masonry, grid, or carousel layouts and lightbox support.",
    category: "media",
    icon: "image",
    version: "1.0.0",
    propSchema: [
      { name: "heading", type: "string", label: "Section Heading", default: "Gallery" },
      { name: "layout", type: "enum", label: "Layout", options: ["grid", "masonry", "carousel"], default: "grid" },
      { name: "columns", type: "enum", label: "Columns", options: ["2", "3", "4"], default: "3" },
      { name: "enableLightbox", type: "boolean", label: "Enable Lightbox", default: true },
      { name: "aspectRatio", type: "enum", label: "Aspect Ratio", options: ["square", "landscape", "portrait", "auto"], default: "landscape" },
      { name: "images", type: "array", label: "Images", description: "Gallery images with src, alt, and optional caption." },
    ],
    defaultPreset: {
      name: "Default",
      description: "3-column image grid with lightbox.",
      props: {
        heading: "Gallery",
        layout: "grid",
        columns: "3",
        enableLightbox: true,
        aspectRatio: "landscape",
        images: [],
      },
    },
    previewConfig: { width: "contained", height: "auto", background: "transparent" },
    docsMarkdown: `# Gallery

Display images in a grid, masonry, or carousel layout with optional lightbox.

## Usage

Upload images and choose a layout. Click any image to view it in a lightbox.

## Options

- **Layout**: Grid (uniform), masonry (variable height), or carousel (scrollable).
- **Columns**: 2, 3, or 4 columns for grid and masonry.
- **Lightbox**: Click-to-enlarge with navigation arrows.
- **Aspect Ratio**: Square, landscape, portrait, or auto (original).

## Tips

- Use consistent image dimensions for grid layout.
- Masonry layout works best with mixed-size images.
- Add alt text to every image for accessibility.`,
    devNotes: `## Gallery — Developer Notes

### Layouts
- Grid: CSS Grid with fixed aspect ratio via \`aspect-ratio\` property.
- Masonry: CSS columns or CSS Grid with \`grid-auto-rows: 1px\` + span calculation.
- Carousel: Horizontal scroll-snap container.

### Lightbox
- Renders in a portal overlay with keyboard navigation (arrow keys, Escape).
- Preloads adjacent images for smooth navigation.

### Performance
- Images use \`loading="lazy"\` by default.
- Thumbnails served at optimized sizes; lightbox loads full resolution.
- Consider using \`srcset\` for responsive image delivery.`,
    tags: ["gallery", "images", "masonry", "lightbox", "media"],
    status: "stable",
  },
  {
    name: "CTA",
    slug: "cta",
    description: "Call-to-action banner with headline, supporting text, and action buttons.",
    category: "content",
    icon: "megaphone",
    version: "1.0.0",
    propSchema: [
      { name: "headline", type: "string", label: "Headline", required: true, default: "Ready to Get Started?" },
      { name: "description", type: "string", label: "Description", default: "Join thousands of teams building with ORIGIN." },
      { name: "ctaLabel", type: "string", label: "Button Label", default: "Start Free Trial" },
      { name: "ctaHref", type: "string", label: "Button Link", default: "#" },
      { name: "variant", type: "enum", label: "Style", options: ["default", "gradient", "outlined"], default: "gradient" },
      { name: "alignment", type: "enum", label: "Alignment", options: ["left", "center"], default: "center" },
    ],
    defaultPreset: {
      name: "Default",
      description: "Centered gradient CTA banner.",
      props: {
        headline: "Ready to Get Started?",
        description: "Join thousands of teams building with ORIGIN.",
        ctaLabel: "Start Free Trial",
        ctaHref: "#",
        variant: "gradient",
        alignment: "center",
      },
    },
    previewConfig: { width: "full", height: "auto", background: "dark" },
    docsMarkdown: `# Call to Action (CTA)

A prominent banner to drive visitors toward a key action.

## Usage

Place CTA sections between content sections or at the bottom of the page.

## Options

- **Headline**: Short, action-oriented text.
- **Description**: Supporting context (1-2 sentences).
- **Button**: Customizable label and link.
- **Style**: Default (card), gradient (primary colors), or outlined (border only).
- **Alignment**: Left or center aligned.

## Tips

- Use contrasting colors to make the CTA stand out.
- Keep the message focused on a single action.
- Place CTAs after establishing value (features, testimonials).`,
    devNotes: `## CTA — Developer Notes

### Variants
- Default: Uses \`bg-card\` with standard padding.
- Gradient: Uses primary gradient background with light text.
- Outlined: Transparent background with \`border-2 border-primary\`.

### Responsiveness
- On mobile, content stacks vertically with centered alignment.
- Button is full-width on mobile.`,
    tags: ["cta", "banner", "action", "conversion"],
    status: "stable",
  },
  {
    name: "Rich Text",
    slug: "rich-text",
    description: "Free-form rich text content block with Markdown rendering and typography styling.",
    category: "content",
    icon: "type",
    version: "1.0.0",
    propSchema: [
      { name: "content", type: "richtext", label: "Content", required: true, default: "## Hello World\n\nStart writing your content here." },
      { name: "maxWidth", type: "enum", label: "Max Width", options: ["narrow", "medium", "wide", "full"], default: "medium" },
      { name: "alignment", type: "enum", label: "Text Alignment", options: ["left", "center", "right"], default: "left" },
    ],
    defaultPreset: {
      name: "Default",
      description: "Medium-width left-aligned content block.",
      props: {
        content: "## Hello World\n\nStart writing your content here. You can use **bold**, *italic*, [links](https://example.com), and more.\n\n- List item one\n- List item two\n- List item three",
        maxWidth: "medium",
        alignment: "left",
      },
    },
    previewConfig: { width: "contained", height: "auto", background: "transparent" },
    docsMarkdown: `# Rich Text

A free-form content block that renders Markdown with beautiful typography.

## Usage

Write or paste Markdown content. Supports headings, paragraphs, lists, links, images, code blocks, and more.

## Options

- **Content**: Markdown text with full formatting support.
- **Max Width**: Narrow, medium, wide, or full width.
- **Alignment**: Left, center, or right text alignment.

## Tips

- Use headings to structure long content.
- Keep line lengths readable (medium width is recommended).
- Rich Text blocks are ideal for privacy policies, about pages, and blog content.`,
    devNotes: `## Rich Text — Developer Notes

### Markdown Rendering
- Uses a shared Markdown renderer (react-markdown or similar).
- Supports GFM (GitHub Flavored Markdown): tables, task lists, strikethrough.
- Code blocks use \`<pre><code>\` with syntax highlighting via Prism.

### Typography
- Uses the \`prose\` Tailwind typography plugin classes.
- Dark mode: \`prose-invert\`.

### Security
- HTML in Markdown is sanitized (no script tags, no event handlers).
- Links open in new tab with \`rel="noopener noreferrer"\`.`,
    tags: ["text", "markdown", "content", "prose", "typography"],
    status: "stable",
  },
  {
    name: "Divider",
    slug: "divider",
    description: "Visual separator with line, space, or decorative styles to break up page sections.",
    category: "utility",
    icon: "minus",
    version: "1.0.0",
    propSchema: [
      { name: "variant", type: "enum", label: "Style", options: ["line", "space", "dashed", "dotted", "gradient"], default: "line" },
      { name: "spacing", type: "enum", label: "Spacing", options: ["small", "medium", "large", "xlarge"], default: "medium" },
      { name: "width", type: "enum", label: "Line Width", options: ["full", "half", "third"], default: "full" },
      { name: "color", type: "color", label: "Line Color", description: "Custom color for the divider line." },
    ],
    defaultPreset: {
      name: "Default",
      description: "Simple horizontal line with medium spacing.",
      props: {
        variant: "line",
        spacing: "medium",
        width: "full",
      },
    },
    previewConfig: { width: "contained", height: "auto", background: "transparent" },
    docsMarkdown: `# Divider

A visual separator to create breathing room between sections.

## Usage

Place between content sections to visually separate them.

## Options

- **Style**: Line (solid), space (invisible), dashed, dotted, or gradient.
- **Spacing**: Small, medium, large, or extra large vertical padding.
- **Line Width**: Full width, half, or third.
- **Color**: Optional custom color for the divider line.

## Tips

- Use "space" variant for invisible breathing room.
- Consistent divider usage creates visual rhythm on the page.
- Gradient dividers add a subtle decorative touch.`,
    devNotes: `## Divider — Developer Notes

### Rendering
- Line variant: \`<hr>\` with appropriate border styling.
- Space variant: Empty \`<div>\` with vertical padding only.
- Gradient: \`background: linear-gradient(to right, transparent, var(--border), transparent)\`.

### Spacing Map
- small: \`py-4\` (16px)
- medium: \`py-8\` (32px)
- large: \`py-12\` (48px)
- xlarge: \`py-16\` (64px)

### Accessibility
- \`<hr>\` elements include \`role="separator"\` and \`aria-hidden="true"\` for decorative dividers.`,
    tags: ["divider", "spacer", "separator", "utility"],
    status: "stable",
  },
  {
    name: "Spacer",
    slug: "spacer",
    description: "Invisible spacing block to add precise vertical space between sections.",
    category: "utility",
    icon: "move-vertical",
    version: "1.0.0",
    propSchema: [
      { name: "height", type: "enum", label: "Height", options: ["xs", "sm", "md", "lg", "xl", "2xl"], default: "md" },
      { name: "responsiveCollapse", type: "boolean", label: "Collapse on Mobile", default: false, description: "Reduce spacing on smaller screens." },
    ],
    defaultPreset: {
      name: "Default",
      description: "Medium vertical spacer.",
      props: {
        height: "md",
        responsiveCollapse: false,
      },
    },
    previewConfig: { width: "full", height: "auto", background: "transparent" },
    docsMarkdown: `# Spacer

An invisible block that adds precise vertical space between sections.

## Usage

Insert a Spacer between sections to control vertical rhythm and breathing room.

## Options

- **Height**: XS (8px), SM (16px), MD (32px), LG (48px), XL (64px), 2XL (96px).
- **Collapse on Mobile**: Optionally reduce spacing on smaller screens.

## Tips

- Use spacers instead of margin hacks for consistent spacing.
- "Collapse on Mobile" prevents excessive whitespace on small screens.
- Pair with Dividers for visual separation + spacing control.`,
    devNotes: `## Spacer — Developer Notes

### Height Map
- xs: 8px
- sm: 16px
- md: 32px
- lg: 48px
- xl: 64px
- 2xl: 96px

### Responsive Collapse
When \`responsiveCollapse\` is true:
- xs/sm: remain unchanged
- md: collapses to sm on mobile
- lg: collapses to md on mobile
- xl: collapses to lg on mobile
- 2xl: collapses to xl on mobile

### Rendering
- Simple \`<div>\` with \`height\` or Tailwind spacing class.
- \`aria-hidden="true"\` since it's purely visual.`,
    tags: ["spacer", "spacing", "utility", "layout"],
    status: "stable",
  },
];
