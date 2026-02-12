import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Blocks,
  Search,
  ArrowLeft,
  Image as ImageIcon,
  Grid3x3,
  MessageSquare,
  CreditCard,
  HelpCircle,
  Type,
  Megaphone,
  Minus,
  MoveVertical,
  ChevronRight,
  Code2,
  BookOpen,
  Settings2,
  Layers,
} from "lucide-react";

type ComponentSummary = {
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  status: string;
  tags: string[];
  propCount: number;
  presetCount: number;
};

type PropField = {
  name: string;
  type: string;
  label: string;
  description?: string;
  required?: boolean;
  default?: unknown;
  options?: string[];
};

type PresetConfig = {
  name: string;
  description: string;
  props: Record<string, unknown>;
};

type PreviewConfig = {
  width: string;
  height: string;
  fixedHeight?: number;
  background?: string;
};

type ComponentDetail = {
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  status: string;
  tags: string[];
  propSchema: PropField[];
  defaultPreset: PresetConfig;
  additionalPresets?: PresetConfig[];
  previewConfig: PreviewConfig;
  docsMarkdown: string;
  devNotes: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  "grid-3x3": Grid3x3,
  "message-square": MessageSquare,
  "credit-card": CreditCard,
  "help-circle": HelpCircle,
  type: Type,
  megaphone: Megaphone,
  minus: Minus,
  "move-vertical": MoveVertical,
  blocks: Blocks,
  layers: Layers,
};

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  content: "Content",
  media: "Media",
  commerce: "Commerce",
  "social-proof": "Social Proof",
  navigation: "Navigation",
  utility: "Utility",
};

const statusColors: Record<string, string> = {
  stable: "default",
  beta: "secondary",
  experimental: "outline",
  deprecated: "destructive",
};

export default function ComponentRegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { data: components, isLoading } = useQuery<ComponentSummary[]>({
    queryKey: ["/api/component-registry"],
  });

  const { data: detail, isLoading: detailLoading } = useQuery<ComponentDetail>({
    queryKey: ["/api/component-registry", selectedSlug],
    enabled: !!selectedSlug,
  });

  const filtered = components?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = [...new Set(components?.map((c) => c.category) || [])];

  if (selectedSlug && detail) {
    return <ComponentDetailView detail={detail} onBack={() => setSelectedSlug(null)} isLoading={detailLoading} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-registry-title">Component Registry</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Global component definitions powering the page builder, section presets, and marketplace packs.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-components"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all" data-testid="tab-all-components">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} data-testid={`tab-${cat}`}>
              {categoryLabels[cat] || cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ComponentGrid components={filtered} isLoading={isLoading} onSelect={setSelectedSlug} />
        </TabsContent>
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <ComponentGrid
              components={filtered?.filter((c) => c.category === cat)}
              isLoading={isLoading}
              onSelect={setSelectedSlug}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ComponentGrid({
  components,
  isLoading,
  onSelect,
}: {
  components?: ComponentSummary[];
  isLoading: boolean;
  onSelect: (slug: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!components?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Blocks className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No components found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {components.map((comp) => {
        const IconComp = iconMap[comp.icon] || Blocks;
        return (
          <Card
            key={comp.slug}
            className="hover-elevate cursor-pointer"
            onClick={() => onSelect(comp.slug)}
            data-testid={`card-component-${comp.slug}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <IconComp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{comp.name}</h3>
                    <Badge variant={statusColors[comp.status] as any}>
                      {comp.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {comp.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">v{comp.version}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {categoryLabels[comp.category] || comp.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{comp.propCount} props</span>
                      <span>{comp.presetCount} presets</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ComponentDetailView({
  detail,
  onBack,
  isLoading,
}: {
  detail: ComponentDetail;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const IconComp = iconMap[detail.icon] || Blocks;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-registry">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <IconComp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-component-name">{detail.name}</h1>
            <Badge variant={statusColors[detail.status] as any}>{detail.status}</Badge>
            <span className="text-xs text-muted-foreground">v{detail.version}</span>
          </div>
          <p className="text-sm text-muted-foreground">{detail.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {detail.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Props & Presets
          </TabsTrigger>
          <TabsTrigger value="docs" data-testid="tab-docs">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Usage Docs
          </TabsTrigger>
          <TabsTrigger value="dev" data-testid="tab-dev-notes">
            <Code2 className="mr-1.5 h-3.5 w-3.5" />
            Dev Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div>
            <h2 className="text-sm font-semibold mb-3">Prop Schema ({detail.propSchema.length} props)</h2>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Default</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.propSchema.map((prop) => (
                    <tr key={prop.name} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono">{prop.name}</code>
                          {prop.required && (
                            <span className="text-destructive text-[10px]">*</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {prop.type}
                        </Badge>
                        {prop.options && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {prop.options.map((opt) => (
                              <span key={opt} className="text-[10px] text-muted-foreground">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        {prop.default !== undefined && prop.default !== null ? (
                          <code className="text-xs font-mono text-muted-foreground">
                            {String(prop.default)}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground hidden md:table-cell">
                        {prop.description || prop.label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Presets</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PresetCard preset={detail.defaultPreset} isDefault />
              {detail.additionalPresets?.map((preset) => (
                <PresetCard key={preset.name} preset={preset} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Preview Config</h2>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Width</span>
                    <p className="font-medium">{detail.previewConfig.width}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Height</span>
                    <p className="font-medium">
                      {detail.previewConfig.height}
                      {detail.previewConfig.fixedHeight && ` (${detail.previewConfig.fixedHeight}px)`}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Background</span>
                    <p className="font-medium">{detail.previewConfig.background || "auto"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Category</span>
                    <p className="font-medium">{categoryLabels[detail.category] || detail.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer content={detail.docsMarkdown} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dev" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer content={detail.devNotes} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PresetCard({ preset, isDefault }: { preset: PresetConfig; isDefault?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card data-testid={`card-preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{preset.name}</h3>
            {isDefault && (
              <Badge variant="secondary" className="text-[10px]">Default</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-toggle-preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
            <span className="ml-1 text-xs">{expanded ? "Hide" : "Show"} Config</span>
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
        {expanded && (
          <pre className="mt-3 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">
            {JSON.stringify(preset.props, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-lg font-bold mt-4 mb-2 first:mt-0">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-sm font-semibold mt-3 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        listItems.push(<li key={i} className="text-sm text-muted-foreground">{formatInline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc pl-5 space-y-0.5 mb-2">{listItems}</ul>);
      continue;
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="overflow-auto rounded-md bg-muted p-3 text-xs font-mono my-2">
          {codeLines.join("\n")}
        </pre>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(<p key={i} className="text-sm text-muted-foreground mb-1">{formatInline(line)}</p>);
    }
    i++;
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    let firstMatch: { index: number; length: number; node: React.ReactNode } | null = null;

    if (boldMatch && boldMatch.index !== undefined) {
      const candidate = { index: boldMatch.index, length: boldMatch[0].length, node: <strong key={key++}>{boldMatch[1]}</strong> };
      if (!firstMatch || candidate.index < firstMatch.index) firstMatch = candidate;
    }
    if (codeMatch && codeMatch.index !== undefined) {
      const candidate = { index: codeMatch.index, length: codeMatch[0].length, node: <code key={key++} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{codeMatch[1]}</code> };
      if (!firstMatch || candidate.index < firstMatch.index) firstMatch = candidate;
    }

    if (firstMatch) {
      if (firstMatch.index > 0) {
        parts.push(remaining.slice(0, firstMatch.index));
      }
      parts.push(firstMatch.node);
      remaining = remaining.slice(firstMatch.index + firstMatch.length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
