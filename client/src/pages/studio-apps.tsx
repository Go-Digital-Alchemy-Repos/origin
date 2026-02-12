import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Box,
  Search,
  ExternalLink,
  ShieldCheck,
  Code2,
  CircleDot,
} from "lucide-react";
import { getAllApps, type OriginAppDefinition } from "@shared/originApps";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    published: { label: "Published", variant: "default" },
    draft: { label: "Draft", variant: "secondary" },
    deprecated: { label: "Deprecated", variant: "destructive" },
  };
  const v = variants[status] || { label: status, variant: "outline" as const };
  return <Badge variant={v.variant} data-testid={`badge-status-${status}`}>{v.label}</Badge>;
}

function AppCard({ app }: { app: OriginAppDefinition }) {
  return (
    <Card data-testid={`card-app-${app.key}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Box className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base" data-testid={`text-app-name-${app.key}`}>{app.name}</CardTitle>
            <CardDescription className="mt-1" data-testid={`text-app-desc-${app.key}`}>{app.description}</CardDescription>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" />
            <span>v{app.version}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{app.entitlementKey}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CircleDot className="h-3.5 w-3.5" />
            <span>{app.nav.length} nav item{app.nav.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{app.serverRoutePrefix}</span>
          </div>
        </div>
        {app.marketplace && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{app.marketplace.category}</Badge>
            <Badge variant="outline">{app.marketplace.billingType}</Badge>
            {app.marketplace.features.slice(0, 3).map((f) => (
              <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudioAppsPage() {
  const [search, setSearch] = useState("");
  const apps = getAllApps();

  const filtered = apps.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.key.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = apps.filter((a) => a.status === "published").length;
  const draftCount = apps.filter((a) => a.status === "draft").length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Apps Catalog</h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-description">
          Manage ORIGIN App Add-ons. Apps appear in workspace navigation when published and entitled.
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-apps"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{publishedCount} Published</Badge>
          <Badge variant="secondary">{draftCount} Draft</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Box className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No apps found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate a new app with: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">npx tsx scripts/generate-origin-app.ts</code>
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((app) => <AppCard key={app.key} app={app} />)
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate New App</CardTitle>
          <CardDescription>
            Use the CLI to scaffold a new ORIGIN App Add-on. Generated apps are inert until published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 font-mono text-sm">
            <p>npx tsx scripts/generate-origin-app.ts \</p>
            <p className="pl-4">--key my-app \</p>
            <p className="pl-4">--name "My App" \</p>
            <p className="pl-4">--entitlement apps.my-app</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
