import { Puck, Render } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useState, useMemo, useCallback, useEffect } from "react";
import { componentRegistry } from "../../../../shared/component-registry";
import { registryToPuckConfig } from "@/lib/builder/puck-adapter";
import { componentRenderMap } from "@/lib/builder/components";
import { BUILDER_SCHEMA_VERSION, isBuilderContent, createEmptyBuilderContent } from "@/lib/builder/types";
import type { BuilderContent, PuckData } from "@/lib/builder/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Tablet, Smartphone, X, Eye, Save, Globe } from "lucide-react";

interface PuckEditorProps {
  initialContent: unknown;
  onSave: (content: BuilderContent) => void;
  onPublish?: (content: BuilderContent) => void;
  onClose: () => void;
  pageTitle?: string;
  isSaving?: boolean;
  isPublishing?: boolean;
}

type ViewportSize = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<ViewportSize, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

function parseInitialData(raw: unknown): PuckData {
  if (isBuilderContent(raw)) {
    return raw.data;
  }
  if (raw && typeof raw === "object" && "content" in (raw as any)) {
    return raw as PuckData;
  }
  return createEmptyBuilderContent().data;
}

export default function PuckEditorWrapper({
  initialContent,
  onSave,
  onPublish,
  onClose,
  pageTitle = "Page",
  isSaving = false,
  isPublishing = false,
}: PuckEditorProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [previewMode, setPreviewMode] = useState(false);

  const config = useMemo(() => registryToPuckConfig(componentRegistry, componentRenderMap), []);
  const initialData = useMemo(() => parseInitialData(initialContent), [initialContent]);

  const [latestData, setLatestData] = useState<PuckData>(initialData);

  useEffect(() => {
    setLatestData(parseInitialData(initialContent));
  }, [initialContent]);

  const handleChange = useCallback((data: PuckData) => {
    setLatestData(data);
  }, []);

  const wrapContent = useCallback((data: PuckData): BuilderContent => {
    return {
      schemaVersion: BUILDER_SCHEMA_VERSION,
      data,
    };
  }, []);

  const handleSave = useCallback(() => {
    onSave(wrapContent(latestData));
  }, [onSave, wrapContent, latestData]);

  const handlePublish = useCallback((data: PuckData) => {
    if (onPublish) {
      onPublish(wrapContent(data));
    }
  }, [onPublish, wrapContent]);

  if (previewMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" data-testid="div-builder-preview">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2 bg-background">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Preview: {pageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewport === "desktop" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewport("desktop")}
                data-testid="button-preview-desktop"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === "tablet" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewport("tablet")}
                data-testid="button-preview-tablet"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === "mobile" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewport("mobile")}
                data-testid="button-preview-mobile"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)} data-testid="button-exit-preview">
              <X className="h-4 w-4 mr-1" />
              Exit Preview
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-muted flex justify-center py-4">
          <div
            className="bg-background shadow-lg transition-all duration-300 overflow-auto"
            style={{ width: viewportWidths[viewport], maxWidth: "100%" }}
          >
            <Render config={config} data={latestData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" data-testid="div-builder-editor">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5 bg-background shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-builder">
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate">{pageTitle}</span>
          <Badge variant="secondary" className="text-[10px]">Builder</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center border rounded-md">
            <Button
              variant={viewport === "desktop" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewport("desktop")}
              data-testid="button-viewport-desktop"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === "tablet" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewport("tablet")}
              data-testid="button-viewport-tablet"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === "mobile" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewport("mobile")}
              data-testid="button-viewport-mobile"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)} data-testid="button-preview-mode">
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} data-testid="button-builder-save">
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          {onPublish && (
            <Button size="sm" onClick={() => handlePublish(latestData)} disabled={isPublishing} data-testid="button-builder-publish">
              <Globe className="h-4 w-4 mr-1" />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden" style={{ ["--puck-viewport-width" as string]: `${viewportWidths[viewport]}px` }}>
        <Puck
          config={config}
          data={initialData}
          onChange={handleChange}
          onPublish={handlePublish}
          iframe={{
            enabled: false,
          }}
        />
      </div>
    </div>
  );
}

export function PageRenderer({ content }: { content: unknown }) {
  const config = useMemo(() => registryToPuckConfig(componentRegistry, componentRenderMap), []);

  const data = useMemo(() => {
    if (isBuilderContent(content)) return content.data;
    if (content && typeof content === "object" && "content" in (content as any)) {
      return content as PuckData;
    }
    return createEmptyBuilderContent().data;
  }, [content]);

  if (!data.content || data.content.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground" data-testid="div-empty-page">
        This page has no content blocks yet.
      </div>
    );
  }

  return (
    <div data-testid="div-page-rendered">
      <Render config={config} data={data} />
    </div>
  );
}
