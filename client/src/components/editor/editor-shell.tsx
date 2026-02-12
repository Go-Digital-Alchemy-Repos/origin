import { memo, useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Layers,
  Paintbrush,
  Settings,
  Database,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Eye,
  Globe,
  Save,
  X,
  ChevronDown,
  GripVertical,
  Type,
  Image,
  LayoutGrid,
  List,
  Square,
  MousePointer,
  Contact,
  Users,
  ArrowRightLeft,
} from "lucide-react";
import {
  EditorPanel,
  EditorPanelHeader,
  EditorPanelBody,
  EditorTabs,
  EditorSection,
  EditorFieldRow,
  EditorSearchInput,
  EditorEmptyState,
  EditorIconButton,
} from "./editor-primitives";
import { componentRegistry } from "../../../../shared/component-registry";
import { registryToPuckConfig } from "@/lib/builder/puck-adapter";
import { componentRenderMap } from "@/lib/builder/components";
import { BUILDER_SCHEMA_VERSION, isBuilderContent, createEmptyBuilderContent } from "@/lib/builder/types";
import type { BuilderContent, PuckData } from "@/lib/builder/types";

const PuckLazy = lazy(() => import("@puckeditor/core").then((m) => ({ default: m.Puck })));
const RenderLazy = lazy(() => import("@puckeditor/core").then((m) => ({ default: m.Render })));

type ViewportSize = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<ViewportSize, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

interface EditorShellProps {
  initialContent: unknown;
  onSave: (content: BuilderContent) => void;
  onPublish?: (content: BuilderContent) => void;
  onClose: () => void;
  pageTitle?: string;
  isSaving?: boolean;
  isPublishing?: boolean;
}

function parseInitialData(raw: unknown): PuckData {
  if (isBuilderContent(raw)) return raw.data;
  if (raw && typeof raw === "object" && "content" in (raw as any)) return raw as PuckData;
  return createEmptyBuilderContent().data;
}

const componentIcons: Record<string, React.ReactNode> = {
  hero: <LayoutGrid className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  grid: <LayoutGrid className="h-3.5 w-3.5" />,
  list: <List className="h-3.5 w-3.5" />,
};

const LeftRail = memo(function LeftRail() {
  const [activeTab, setActiveTab] = useState("add");
  const [search, setSearch] = useState("");

  const tabs = useMemo(() => [
    { id: "add", label: "Add", icon: <Plus className="h-3 w-3" /> },
    { id: "navigator", label: "Navigator", icon: <Layers className="h-3 w-3" /> },
  ], []);

  const components = useMemo(() => {
    return Object.entries(componentRegistry).map(([key, comp]) => ({
      key,
      label: comp.label || key,
      category: comp.category || "general",
    }));
  }, []);

  const filteredComponents = useMemo(() => {
    if (!search) return components;
    return components.filter((c) =>
      c.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [components, search]);

  return (
    <EditorPanel className="w-[240px] shrink-0" data-testid="editor-left-rail">
      <EditorTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <EditorSearchInput
        placeholder={activeTab === "add" ? "Search components..." : "Search layers..."}
        value={search}
        onChange={setSearch}
      />
      <EditorPanelBody>
        {activeTab === "add" && (
          <div className="px-2 pb-2 space-y-0.5">
            {filteredComponents.length === 0 ? (
              <EditorEmptyState
                icon={<Square className="h-5 w-5" />}
                title="No components found"
                description="Try a different search term"
              />
            ) : (
              filteredComponents.map((comp) => (
                <div
                  key={comp.key}
                  data-testid={`editor-component-${comp.key}`}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md",
                    "text-[12px] text-[hsl(var(--editor-text))]",
                    "cursor-grab transition-colors duration-150",
                    "hover:bg-[hsl(var(--editor-panel2))]"
                  )}
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded text-[hsl(var(--editor-muted))]"
                    style={{ backgroundColor: "hsl(var(--editor-panel2))" }}
                  >
                    {componentIcons[comp.category] || <Square className="h-3 w-3" />}
                  </div>
                  <span className="truncate">{comp.label}</span>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === "navigator" && (
          <EditorEmptyState
            icon={<Layers className="h-5 w-5" />}
            title="Layer navigator"
            description="Visual layer tree will appear here when content is added"
          />
        )}
      </EditorPanelBody>
    </EditorPanel>
  );
});

const RightRail = memo(function RightRail() {
  const [activeTab, setActiveTab] = useState("style");

  const tabs = useMemo(() => [
    { id: "style", label: "Style", icon: <Paintbrush className="h-3 w-3" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-3 w-3" /> },
    { id: "cms", label: "CMS", icon: <Database className="h-3 w-3" /> },
  ], []);

  return (
    <EditorPanel className="w-[260px] shrink-0" data-testid="editor-right-rail">
      <EditorTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <EditorPanelBody>
        {activeTab === "style" && (
          <>
            <EditorSection title="Layout">
              <EditorFieldRow label="Display">
                <Select defaultValue="block">
                  <SelectTrigger className="h-7 text-xs" data-testid="editor-field-display">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                  </SelectContent>
                </Select>
              </EditorFieldRow>
              <EditorFieldRow label="Width">
                <Input
                  placeholder="auto"
                  className="h-7 text-xs bg-transparent border-[hsl(var(--editor-border))]"
                  data-testid="editor-field-width"
                />
              </EditorFieldRow>
              <EditorFieldRow label="Height">
                <Input
                  placeholder="auto"
                  className="h-7 text-xs bg-transparent border-[hsl(var(--editor-border))]"
                  data-testid="editor-field-height"
                />
              </EditorFieldRow>
            </EditorSection>
            <EditorSection title="Spacing">
              <div className="grid grid-cols-2 gap-2">
                <EditorFieldRow label="Margin">
                  <Input
                    placeholder="0"
                    className="h-7 text-xs bg-transparent border-[hsl(var(--editor-border))]"
                    data-testid="editor-field-margin"
                  />
                </EditorFieldRow>
                <EditorFieldRow label="Padding">
                  <Input
                    placeholder="0"
                    className="h-7 text-xs bg-transparent border-[hsl(var(--editor-border))]"
                    data-testid="editor-field-padding"
                  />
                </EditorFieldRow>
              </div>
            </EditorSection>
            <EditorSection title="Typography" defaultOpen={false}>
              <EditorFieldRow label="Font Size">
                <Input
                  placeholder="16px"
                  className="h-7 text-xs bg-transparent border-[hsl(var(--editor-border))]"
                  data-testid="editor-field-font-size"
                />
              </EditorFieldRow>
              <EditorFieldRow label="Color">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-md border"
                    style={{
                      backgroundColor: "hsl(var(--editor-text))",
                      borderColor: "hsl(var(--editor-border))",
                    }}
                  />
                  <Input
                    placeholder="#000000"
                    className="h-7 text-xs bg-transparent border-[hsl(var(--editor-border))] flex-1"
                    data-testid="editor-field-color"
                  />
                </div>
              </EditorFieldRow>
            </EditorSection>
          </>
        )}
        {activeTab === "settings" && (
          <EditorSection title="Element Settings">
            <EditorEmptyState
              icon={<Settings className="h-5 w-5" />}
              title="Select an element"
              description="Click on an element in the canvas to see its settings"
            />
          </EditorSection>
        )}
        {activeTab === "cms" && (
          <>
            <EditorSection title="CMS Bindings">
              <EditorEmptyState
                icon={<Database className="h-5 w-5" />}
                title="CMS bindings"
                description="Connect element properties to CMS collection fields"
              />
            </EditorSection>
            <EditorSection title="CRM" defaultOpen={false}>
              <div className="space-y-2" data-testid="editor-crm-section">
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md",
                    "text-[12px] text-[hsl(var(--editor-muted))]",
                    "cursor-default"
                  )}
                >
                  <Contact className="h-3.5 w-3.5" />
                  <span>Bind to Lead fields</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md",
                    "text-[12px] text-[hsl(var(--editor-muted))]",
                    "cursor-default"
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Bind to Contact fields</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md",
                    "text-[12px] text-[hsl(var(--editor-muted))]",
                    "cursor-default"
                  )}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>Lead capture form mapping</span>
                </div>
                <p className="text-[11px] text-[hsl(var(--editor-muted))] px-2 opacity-60">
                  Select a CRM-bound component to configure data bindings
                </p>
              </div>
            </EditorSection>
          </>
        )}
      </EditorPanelBody>
    </EditorPanel>
  );
});

const CanvasOverlay = memo(function CanvasOverlay({ enabled = false }: { enabled?: boolean }) {
  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10" data-testid="editor-canvas-overlay">
      <div
        className="absolute border-2 rounded-sm transition-all duration-150"
        style={{
          top: 120,
          left: 40,
          width: 400,
          height: 80,
          borderColor: "hsl(var(--editor-hover-outline))",
          backgroundColor: "hsl(var(--editor-hover-outline) / 0.04)",
        }}
      >
        <div
          className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-medium rounded-t-sm text-white"
          style={{ backgroundColor: "hsl(var(--editor-hover-outline))" }}
        >
          Section
        </div>
      </div>
      <div
        className="absolute border-2 rounded-sm transition-all duration-150"
        style={{
          top: 240,
          left: 80,
          width: 320,
          height: 60,
          borderColor: "hsl(var(--editor-select-outline))",
          backgroundColor: "hsl(var(--editor-select-outline) / 0.06)",
        }}
      >
        <div
          className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-medium rounded-t-sm text-white"
          style={{ backgroundColor: "hsl(var(--editor-select-outline))" }}
        >
          Heading
        </div>
        <div className="absolute -right-1 -bottom-1 w-2 h-2 rounded-full border-2 border-white"
          style={{ backgroundColor: "hsl(var(--editor-select-outline))" }}
        />
        <div className="absolute -left-1 -bottom-1 w-2 h-2 rounded-full border-2 border-white"
          style={{ backgroundColor: "hsl(var(--editor-select-outline))" }}
        />
        <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full border-2 border-white"
          style={{ backgroundColor: "hsl(var(--editor-select-outline))" }}
        />
        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full border-2 border-white"
          style={{ backgroundColor: "hsl(var(--editor-select-outline))" }}
        />
      </div>
    </div>
  );
});

const TopToolbar = memo(function TopToolbar({
  pageTitle,
  viewport,
  onViewportChange,
  onClose,
  onSave,
  onPublish,
  onPreview,
  isSaving,
  isPublishing,
  previewMode,
}: {
  pageTitle: string;
  viewport: ViewportSize;
  onViewportChange: (v: ViewportSize) => void;
  onClose: () => void;
  onSave: () => void;
  onPublish?: () => void;
  onPreview: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  previewMode: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 h-10 shrink-0"
      style={{
        backgroundColor: "hsl(var(--editor-toolbar))",
        borderBottom: "1px solid hsl(var(--editor-border))",
      }}
      data-testid="editor-toolbar"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-[hsl(var(--editor-muted))] hover:text-[hsl(var(--editor-text))]"
          data-testid="button-editor-close"
        >
          <X className="h-4 w-4" />
        </Button>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-default"
          style={{ backgroundColor: "hsl(var(--editor-panel2))" }}
          data-testid="editor-page-selector"
        >
          <span className="text-[12px] font-medium text-[hsl(var(--editor-text))] truncate max-w-[140px]">
            {pageTitle}
          </span>
          <ChevronDown className="h-3 w-3 text-[hsl(var(--editor-muted))]" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div
          className="flex items-center rounded-md p-0.5"
          style={{ backgroundColor: "hsl(var(--editor-panel2))" }}
        >
          <EditorIconButton
            active={viewport === "desktop"}
            onClick={() => onViewportChange("desktop")}
            tooltip="Desktop"
            data-testid="button-editor-desktop"
          >
            <Monitor className="h-3.5 w-3.5" />
          </EditorIconButton>
          <EditorIconButton
            active={viewport === "tablet"}
            onClick={() => onViewportChange("tablet")}
            tooltip="Tablet"
            data-testid="button-editor-tablet"
          >
            <Tablet className="h-3.5 w-3.5" />
          </EditorIconButton>
          <EditorIconButton
            active={viewport === "mobile"}
            onClick={() => onViewportChange("mobile")}
            tooltip="Mobile"
            data-testid="button-editor-mobile"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </EditorIconButton>
        </div>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: "hsl(var(--editor-border))" }} />

        <EditorIconButton disabled tooltip="Undo" data-testid="button-editor-undo">
          <Undo2 className="h-3.5 w-3.5" />
        </EditorIconButton>
        <EditorIconButton disabled tooltip="Redo" data-testid="button-editor-redo">
          <Redo2 className="h-3.5 w-3.5" />
        </EditorIconButton>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="h-7 text-[12px] text-[hsl(var(--editor-muted))] hover:text-[hsl(var(--editor-text))]"
          data-testid="button-editor-preview"
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Preview
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="h-7 text-[12px]"
          data-testid="button-editor-save"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
        {onPublish && (
          <Button
            size="sm"
            onClick={onPublish}
            disabled={isPublishing}
            className="h-7 text-[12px]"
            data-testid="button-editor-publish"
          >
            <Globe className="h-3.5 w-3.5 mr-1" />
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        )}
      </div>
    </div>
  );
});

export default function EditorShell({
  initialContent,
  onSave,
  onPublish,
  onClose,
  pageTitle = "Page",
  isSaving = false,
  isPublishing = false,
}: EditorShellProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [previewMode, setPreviewMode] = useState(false);
  const [showOverlay] = useState(false);

  const config = useMemo(() => registryToPuckConfig(componentRegistry, componentRenderMap), []);
  const initialData = useMemo(() => parseInitialData(initialContent), [initialContent]);
  const [latestData, setLatestData] = useState<PuckData>(initialData);

  useEffect(() => {
    setLatestData(parseInitialData(initialContent));
  }, [initialContent]);

  const handleChange = useCallback((data: PuckData) => {
    setLatestData(data);
  }, []);

  const wrapContent = useCallback((data: PuckData): BuilderContent => ({
    schemaVersion: BUILDER_SCHEMA_VERSION,
    data,
  }), []);

  const handleSave = useCallback(() => {
    onSave(wrapContent(latestData));
  }, [onSave, wrapContent, latestData]);

  const handlePublish = useCallback(() => {
    if (onPublish) onPublish(wrapContent(latestData));
  }, [onPublish, wrapContent, latestData]);

  const handlePuckPublish = useCallback((data: PuckData) => {
    if (onPublish) onPublish(wrapContent(data));
  }, [onPublish, wrapContent]);

  if (previewMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "hsl(var(--editor-bg))" }} data-testid="editor-preview-mode">
        <div
          className="flex items-center justify-between gap-2 px-3 h-10 shrink-0"
          style={{
            backgroundColor: "hsl(var(--editor-toolbar))",
            borderBottom: "1px solid hsl(var(--editor-border))",
          }}
        >
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[hsl(var(--editor-muted))]" />
            <span className="text-[12px] font-medium text-[hsl(var(--editor-text))]">
              Preview: {pageTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center rounded-md p-0.5"
              style={{ backgroundColor: "hsl(var(--editor-panel2))" }}
            >
              <EditorIconButton
                active={viewport === "desktop"}
                onClick={() => setViewport("desktop")}
                data-testid="button-preview-desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </EditorIconButton>
              <EditorIconButton
                active={viewport === "tablet"}
                onClick={() => setViewport("tablet")}
                data-testid="button-preview-tablet"
              >
                <Tablet className="h-3.5 w-3.5" />
              </EditorIconButton>
              <EditorIconButton
                active={viewport === "mobile"}
                onClick={() => setViewport("mobile")}
                data-testid="button-preview-mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </EditorIconButton>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(false)}
              className="h-7 text-[12px]"
              data-testid="button-exit-preview"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Exit Preview
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex justify-center py-6" style={{ backgroundColor: "hsl(var(--editor-canvas))" }}>
          <div
            className="bg-white dark:bg-[hsl(220,18%,8%)] shadow-lg transition-all duration-300 overflow-auto"
            style={{ width: viewportWidths[viewport], maxWidth: "100%" }}
          >
            <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--editor-accent))] border-t-transparent" /></div>}>
              <RenderLazy config={config} data={latestData} />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "hsl(var(--editor-bg))" }} data-testid="editor-shell">
      <TopToolbar
        pageTitle={pageTitle}
        viewport={viewport}
        onViewportChange={setViewport}
        onClose={onClose}
        onSave={handleSave}
        onPublish={onPublish ? handlePublish : undefined}
        onPreview={() => setPreviewMode(true)}
        isSaving={isSaving}
        isPublishing={isPublishing}
        previewMode={previewMode}
      />

      <div className="flex flex-1 min-h-0">
        <LeftRail />

        <div className="flex-1 flex flex-col min-w-0 relative">
          <div
            className="flex-1 overflow-auto flex justify-center py-6 px-6"
            style={{ backgroundColor: "hsl(var(--editor-canvas))" }}
            data-testid="editor-canvas-area"
          >
            <div
              className="relative bg-white dark:bg-[hsl(220,18%,8%)] shadow-lg transition-all duration-300 h-fit min-h-full"
              style={{ width: viewportWidths[viewport], maxWidth: "100%" }}
            >
              <CanvasOverlay enabled={showOverlay} />
              {(!initialData.content || initialData.content.length === 0) && latestData.content?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center" data-testid="editor-empty-canvas">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "hsl(var(--editor-accent) / 0.08)" }}
                  >
                    <MousePointer className="h-7 w-7 text-[hsl(var(--editor-accent))]" />
                  </div>
                  <p className="text-sm font-medium text-[hsl(var(--editor-text))] mb-1">
                    Drop components here
                  </p>
                  <p className="text-[12px] text-[hsl(var(--editor-muted))]">
                    Drag components from the left panel to start building
                  </p>
                </div>
              ) : (
                <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--editor-accent))] border-t-transparent" /></div>}>
                  <PuckLazy
                    config={config}
                    data={initialData}
                    onChange={handleChange}
                    onPublish={handlePuckPublish}
                    iframe={{ enabled: false }}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </div>

        <RightRail />
      </div>
    </div>
  );
}
