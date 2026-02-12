import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Palette,
  Layout,
  Eye,
  Sun,
  Moon,
  RotateCcw,
  Type,
  Square,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import type { ThemeTokens, ThemeTokenMode, LayoutPresets } from "@shared/schema";

const DEFAULT_TOKENS: ThemeTokens = {
  light: {
    surface: "#ffffff",
    surfaceAlt: "#f8f9fa",
    text: "#1a1a2e",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    accent: "#2563eb",
    accentText: "#ffffff",
  },
  dark: {
    surface: "#1a1a2e",
    surfaceAlt: "#16213e",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "#334155",
    accent: "#3b82f6",
    accentText: "#ffffff",
  },
  fontHeading: "Inter",
  fontBody: "Inter",
  borderRadius: "md",
};

const DEFAULT_LAYOUT: LayoutPresets = {
  headerStyle: "standard",
  footerStyle: "standard",
  sectionSpacing: "comfortable",
  containerWidth: "standard",
  buttonStyle: "rounded",
};

const TOKEN_LABELS: Record<keyof ThemeTokenMode, string> = {
  surface: "Surface",
  surfaceAlt: "Surface Alt",
  text: "Text",
  textMuted: "Text Muted",
  border: "Border",
  accent: "Accent",
  accentText: "Accent Text",
};

const TOKEN_DESCRIPTIONS: Record<keyof ThemeTokenMode, string> = {
  surface: "Primary background color",
  surfaceAlt: "Secondary / alternate background",
  text: "Primary text color",
  textMuted: "Secondary text color",
  border: "Border and divider color",
  accent: "Brand / accent color for CTAs",
  accentText: "Text on accent-colored surfaces",
};

const FONT_OPTIONS = [
  "Inter", "System UI", "Georgia", "Merriweather", "Playfair Display",
  "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
];

type SiteOption = { id: string; name: string; slug: string };

export default function SiteThemePage() {
  const { toast } = useToast();

  const { data: meData } = useQuery<{
    user: { id: string; role: string };
    activeWorkspaceId: string | null;
  }>({ queryKey: ["/api/user/me"] });

  const workspaceId = meData?.activeWorkspaceId;

  const { data: sitesList = [] } = useQuery<SiteOption[]>({
    queryKey: ["/api/user/sites"],
    enabled: !!workspaceId,
  });

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const activeSiteId = selectedSiteId || sitesList[0]?.id || null;

  const { data: themeData, isLoading: themeLoading } = useQuery<{
    tokens: ThemeTokens;
    layout: LayoutPresets;
    id: string;
  }>({
    queryKey: ["/api/cms/sites", activeSiteId, "theme"],
    enabled: !!activeSiteId,
  });

  const [tokens, setTokens] = useState<ThemeTokens | null>(null);
  const [layout, setLayout] = useState<LayoutPresets | null>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  const currentTokens = tokens ?? themeData?.tokens ?? DEFAULT_TOKENS;
  const currentLayout = layout ?? themeData?.layout ?? DEFAULT_LAYOUT;

  const hasChanges = useMemo(() => {
    if (!themeData) return false;
    return (
      JSON.stringify(currentTokens) !== JSON.stringify(themeData.tokens) ||
      JSON.stringify(currentLayout) !== JSON.stringify(themeData.layout)
    );
  }, [currentTokens, currentLayout, themeData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/cms/sites/${activeSiteId}/theme`, {
        tokens: currentTokens,
        layout: currentLayout,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", activeSiteId, "theme"] });
      setTokens(null);
      setLayout(null);
      toast({ title: "Theme saved", description: "Your theme changes have been applied." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save theme.", variant: "destructive" });
    },
  });

  function updateTokenColor(mode: "light" | "dark", key: keyof ThemeTokenMode, value: string) {
    const base = { ...currentTokens };
    base[mode] = { ...base[mode], [key]: value };
    setTokens(base);
  }

  function updateTokenMeta(key: "fontHeading" | "fontBody" | "borderRadius", value: string) {
    setTokens({ ...currentTokens, [key]: value });
  }

  function updateLayout(key: keyof LayoutPresets, value: string) {
    setLayout({ ...currentLayout, [key]: value } as LayoutPresets);
  }

  function resetToDefaults() {
    setTokens(DEFAULT_TOKENS);
    setLayout(DEFAULT_LAYOUT);
  }

  const previewTokens = currentTokens[previewMode];

  if (!workspaceId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground" data-testid="text-theme-no-workspace">Select a workspace to manage site themes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/app/sites">
            <Button variant="ghost" size="icon" data-testid="button-back-sites">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold" data-testid="text-theme-title">Site Theme</h1>
            <p className="text-xs text-muted-foreground">Customize tokens and layout for your site</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sitesList.length > 1 && (
            <Select
              value={activeSiteId || ""}
              onValueChange={(val) => {
                setSelectedSiteId(val);
                setTokens(null);
                setLayout(null);
              }}
            >
              <SelectTrigger className="w-48" data-testid="select-site">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sitesList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            data-testid="button-reset-theme"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            data-testid="button-save-theme"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saveMutation.isPending ? "Saving..." : "Save Theme"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {themeLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Tabs defaultValue="tokens">
              <TabsList data-testid="tabs-theme">
                <TabsTrigger value="tokens" data-testid="tab-tokens">
                  <Palette className="mr-1.5 h-3.5 w-3.5" />
                  Tokens
                </TabsTrigger>
                <TabsTrigger value="layout" data-testid="tab-layout">
                  <Layout className="mr-1.5 h-3.5 w-3.5" />
                  Layout
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tokens" className="mt-4 space-y-6">
                <TokenModeEditor
                  label="Light Mode"
                  icon={<Sun className="h-4 w-4" />}
                  mode="light"
                  values={currentTokens.light}
                  onChange={(key, val) => updateTokenColor("light", key, val)}
                />
                <TokenModeEditor
                  label="Dark Mode"
                  icon={<Moon className="h-4 w-4" />}
                  mode="dark"
                  values={currentTokens.dark}
                  onChange={(key, val) => updateTokenColor("dark", key, val)}
                />
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Typography & Shape</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Heading Font</Label>
                        <Select
                          value={currentTokens.fontHeading || "Inter"}
                          onValueChange={(v) => updateTokenMeta("fontHeading", v)}
                        >
                          <SelectTrigger data-testid="select-font-heading">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Body Font</Label>
                        <Select
                          value={currentTokens.fontBody || "Inter"}
                          onValueChange={(v) => updateTokenMeta("fontBody", v)}
                        >
                          <SelectTrigger data-testid="select-font-body">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Border Radius</Label>
                        <Select
                          value={currentTokens.borderRadius || "md"}
                          onValueChange={(v) => updateTokenMeta("borderRadius", v)}
                        >
                          <SelectTrigger data-testid="select-border-radius">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="md">Medium</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                            <SelectItem value="full">Full</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout" className="mt-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Layout Presets</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <LayoutSelect
                        label="Header Style"
                        value={currentLayout.headerStyle}
                        onChange={(v) => updateLayout("headerStyle", v)}
                        options={[
                          { value: "standard", label: "Standard" },
                          { value: "centered", label: "Centered" },
                          { value: "minimal", label: "Minimal" },
                          { value: "transparent", label: "Transparent" },
                        ]}
                        testId="select-header-style"
                      />
                      <LayoutSelect
                        label="Footer Style"
                        value={currentLayout.footerStyle}
                        onChange={(v) => updateLayout("footerStyle", v)}
                        options={[
                          { value: "standard", label: "Standard" },
                          { value: "minimal", label: "Minimal" },
                          { value: "columns", label: "Columns" },
                          { value: "centered", label: "Centered" },
                        ]}
                        testId="select-footer-style"
                      />
                      <LayoutSelect
                        label="Section Spacing"
                        value={currentLayout.sectionSpacing}
                        onChange={(v) => updateLayout("sectionSpacing", v)}
                        options={[
                          { value: "compact", label: "Compact" },
                          { value: "comfortable", label: "Comfortable" },
                          { value: "spacious", label: "Spacious" },
                        ]}
                        testId="select-section-spacing"
                      />
                      <LayoutSelect
                        label="Container Width"
                        value={currentLayout.containerWidth}
                        onChange={(v) => updateLayout("containerWidth", v)}
                        options={[
                          { value: "narrow", label: "Narrow (768px)" },
                          { value: "standard", label: "Standard (1024px)" },
                          { value: "wide", label: "Wide (1280px)" },
                          { value: "full", label: "Full Width" },
                        ]}
                        testId="select-container-width"
                      />
                      <LayoutSelect
                        label="Button Style"
                        value={currentLayout.buttonStyle}
                        onChange={(v) => updateLayout("buttonStyle", v)}
                        options={[
                          { value: "square", label: "Square" },
                          { value: "rounded", label: "Rounded" },
                          { value: "pill", label: "Pill" },
                        ]}
                        testId="select-button-style"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="hidden w-[380px] shrink-0 border-l lg:block">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={previewMode === "light" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setPreviewMode("light")}
                data-testid="button-preview-light"
              >
                <Sun className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={previewMode === "dark" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setPreviewMode("dark")}
                data-testid="button-preview-dark"
              >
                <Moon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <ThemePreview tokens={previewTokens} layout={currentLayout} fontHeading={currentTokens.fontHeading} fontBody={currentTokens.fontBody} borderRadius={currentTokens.borderRadius} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TokenModeEditor({
  label,
  icon,
  mode,
  values,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  mode: "light" | "dark";
  values: ThemeTokenMode;
  onChange: (key: keyof ThemeTokenMode, val: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-sm">{label}</h3>
          <Badge variant="secondary" className="text-[10px]">{mode}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(TOKEN_LABELS) as (keyof ThemeTokenMode)[]).map((key) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{TOKEN_LABELS[key]}</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="color"
                    value={values[key]}
                    onChange={(e) => onChange(key, e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-md border"
                    style={{ padding: 0 }}
                    data-testid={`color-${mode}-${key}`}
                  />
                </div>
                <Input
                  value={values[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="h-8 flex-1 font-mono text-xs"
                  data-testid={`input-${mode}-${key}`}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{TOKEN_DESCRIPTIONS[key]}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LayoutSelect({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  testId: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ThemePreview({
  tokens,
  layout,
  fontHeading,
  fontBody,
  borderRadius,
}: {
  tokens: ThemeTokenMode;
  layout: LayoutPresets;
  fontHeading?: string;
  fontBody?: string;
  borderRadius?: string;
}) {
  const br =
    borderRadius === "none" ? "0"
    : borderRadius === "sm" ? "4px"
    : borderRadius === "lg" ? "12px"
    : borderRadius === "full" ? "9999px"
    : "8px";

  const btnBr =
    layout.buttonStyle === "square" ? "0"
    : layout.buttonStyle === "pill" ? "9999px"
    : br;

  const containerMax =
    layout.containerWidth === "narrow" ? "280px"
    : layout.containerWidth === "wide" ? "360px"
    : layout.containerWidth === "full" ? "100%"
    : "320px";

  const sectionPad =
    layout.sectionSpacing === "compact" ? "12px"
    : layout.sectionSpacing === "spacious" ? "28px"
    : "20px";

  return (
    <div
      className="overflow-hidden border rounded-md"
      style={{
        backgroundColor: tokens.surface,
        color: tokens.text,
        fontFamily: fontBody || "Inter, sans-serif",
        maxWidth: containerMax,
        margin: "0 auto",
      }}
      data-testid="div-theme-preview"
    >
      <div
        style={{
          backgroundColor: layout.headerStyle === "transparent" ? "transparent" : tokens.surfaceAlt,
          borderBottom: `1px solid ${tokens.border}`,
          padding: layout.headerStyle === "minimal" ? "8px 12px" : "12px 16px",
          display: "flex",
          alignItems: layout.headerStyle === "centered" ? "center" : "flex-start",
          justifyContent: layout.headerStyle === "centered" ? "center" : "space-between",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontFamily: fontHeading || "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            color: tokens.text,
          }}
        >
          My Site
        </span>
        {layout.headerStyle !== "minimal" && (
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: tokens.textMuted }}>
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        )}
      </div>

      <div style={{ padding: sectionPad }}>
        <h2
          style={{
            fontFamily: fontHeading || "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            marginBottom: "6px",
          }}
        >
          Welcome
        </h2>
        <p style={{ fontSize: "11px", color: tokens.textMuted, marginBottom: "12px", lineHeight: 1.5 }}>
          This is a preview of how your site theme tokens and layout presets look together.
        </p>
        <button
          style={{
            backgroundColor: tokens.accent,
            color: tokens.accentText,
            border: "none",
            borderRadius: btnBr,
            padding: "6px 16px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "default",
          }}
        >
          Get Started
        </button>
      </div>

      <div
        style={{
          backgroundColor: tokens.surfaceAlt,
          padding: sectionPad,
          borderTop: `1px solid ${tokens.border}`,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {["Feature A", "Feature B"].map((f) => (
            <div
              key={f}
              style={{
                backgroundColor: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: br,
                padding: "10px",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "11px", marginBottom: "2px" }}>{f}</div>
              <div style={{ fontSize: "10px", color: tokens.textMuted }}>Description text</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${tokens.border}`,
          padding: layout.footerStyle === "minimal" ? "8px 12px" : "12px 16px",
          textAlign: layout.footerStyle === "centered" ? "center" : "left",
          display: layout.footerStyle === "columns" ? "flex" : "block",
          gap: layout.footerStyle === "columns" ? "16px" : undefined,
          backgroundColor: tokens.surfaceAlt,
        }}
      >
        {layout.footerStyle === "columns" ? (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", fontWeight: 600, marginBottom: "2px" }}>Company</div>
              <div style={{ fontSize: "9px", color: tokens.textMuted }}>About</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", fontWeight: 600, marginBottom: "2px" }}>Links</div>
              <div style={{ fontSize: "9px", color: tokens.textMuted }}>Blog</div>
            </div>
          </>
        ) : (
          <span style={{ fontSize: "10px", color: tokens.textMuted }}>My Site 2026</span>
        )}
      </div>
    </div>
  );
}
