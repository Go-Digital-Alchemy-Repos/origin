import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, ExternalLink, MoreVertical, Eye, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sites = [
  {
    id: "1",
    name: "Marketing Homepage",
    domain: "mycompany.com",
    status: "live" as const,
    pages: 12,
    views: "8.2k",
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Developer Blog",
    domain: "blog.mycompany.com",
    status: "live" as const,
    pages: 34,
    views: "5.1k",
    lastUpdated: "5 hours ago",
  },
  {
    id: "3",
    name: "Product Landing",
    domain: "launch.mycompany.com",
    status: "draft" as const,
    pages: 3,
    views: "---",
    lastUpdated: "1 day ago",
  },
];

export default function SitesPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-sites-title">Sites</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your websites and web applications.
          </p>
        </div>
        <Button data-testid="button-new-site">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Site
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <Card key={site.id} className="hover-elevate" data-testid={`card-site-${site.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{site.name}</h3>
                    <p className="text-xs text-muted-foreground">{site.domain}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid={`button-site-menu-${site.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-3.5 w-3.5" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Visit Site
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{site.pages} pages</span>
                  <span>{site.views} views</span>
                </div>
                <Badge variant={site.status === "live" ? "default" : "secondary"}>
                  {site.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Updated {site.lastUpdated}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
