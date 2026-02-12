import { componentRenderMap } from "./components";
import type { BuilderContent, PuckContentItem } from "./types";
import { isBuilderContent, createEmptyBuilderContent } from "./types";

interface RendererProps {
  contentJson: unknown;
  className?: string;
}

function resolveContent(raw: unknown): PuckContentItem[] {
  if (isBuilderContent(raw)) {
    return raw.data.content || [];
  }
  if (raw && typeof raw === "object" && "content" in (raw as any)) {
    return (raw as any).content || [];
  }
  return [];
}

export function renderContentToReact(contentJson: unknown): React.ReactNode[] {
  const blocks = resolveContent(contentJson);

  return blocks.map((block, idx) => {
    const Component = componentRenderMap[block.type];
    if (!Component) {
      return (
        <div key={block.props?.id || idx} className="p-4 border border-dashed border-destructive/50 rounded-md text-sm text-destructive">
          Unknown component: {block.type}
        </div>
      );
    }

    const { id, ...rest } = block.props || {};

    const resolvedProps: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rest)) {
      resolvedProps[key] = val;
    }

    return <Component key={id || idx} {...resolvedProps} />;
  });
}

export function ContentRenderer({ contentJson, className }: RendererProps) {
  const nodes = renderContentToReact(contentJson);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground" data-testid="div-empty-render">
        No content blocks to render.
      </div>
    );
  }

  return (
    <div className={className} data-testid="div-content-rendered">
      {nodes}
    </div>
  );
}

export function validateContentCompatibility(
  contentJson: unknown,
  availableComponents: string[],
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const blocks = resolveContent(contentJson);

  for (const block of blocks) {
    if (!availableComponents.includes(block.type)) {
      warnings.push(`Component "${block.type}" is not in the current registry`);
    }
  }

  if (isBuilderContent(contentJson)) {
    const { schemaVersion } = contentJson;
    if (schemaVersion > 1) {
      warnings.push(`Content uses schema version ${schemaVersion}, current is 1`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
