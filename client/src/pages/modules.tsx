import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Search,
  Download,
  CheckCircle2,
  Globe,
  Shield,
  BarChart3,
  Palette,
  Code2,
  FileText,
  Zap,
  Mail,
  ImageIcon,
  ShoppingCart,
  MessageSquare,
  Calendar,
} from "lucide-react";
import type { OriginModule } from "@shared/schema";
import { useState } from "react";

const iconMap: Record<string, any> = {
  globe: Globe,
  shield: Shield,
  "bar-chart": BarChart3,
  palette: Palette,
  code: Code2,
  "file-text": FileText,
  zap: Zap,
  mail: Mail,
  image: ImageIcon,
  "shopping-cart": ShoppingCart,
  "message-square": MessageSquare,
  calendar: Calendar,
  package: Package,
};

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: modules, isLoading } = useQuery<OriginModule[]>({
    queryKey: ["/api/modules"],
  });

  const filteredModules = modules?.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(modules?.map((m) => m.category) || [])];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-modules-title">Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and manage platform modules. Install only what you need.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-modules"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-modules">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} data-testid={`tab-${cat}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ModuleGrid modules={filteredModules} isLoading={isLoading} />
        </TabsContent>
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <ModuleGrid
              modules={filteredModules?.filter((m) => m.category === cat)}
              isLoading={isLoading}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ModuleGrid({ modules, isLoading }: { modules?: OriginModule[]; isLoading: boolean }) {
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

  if (!modules?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No modules found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((mod) => {
        const IconComp = iconMap[mod.icon || "package"] || Package;
        return (
          <Card
            key={mod.id}
            className="hover-elevate"
            data-testid={`card-module-${mod.slug}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <IconComp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{mod.name}</h3>
                    {mod.isCore && (
                      <Badge variant="secondary" className="text-[10px]">
                        Core
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {mod.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">v{mod.version}</span>
                    {mod.isActive ? (
                      <Badge variant="default">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-3 w-3" />
                        Install
                      </Button>
                    )}
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
