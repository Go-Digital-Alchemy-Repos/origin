import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  Search,
  ChevronRight,
  ArrowLeft,
  Package,
  Layers,
  Component,
  Box,
  Puzzle,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MarketplaceItem, MarketplaceInstall } from "@shared/schema";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  "site-kit": "Site Kits",
  section: "Sections",
  widget: "Widgets",
  app: "Apps",
  "add-on": "Add-ons",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "site-kit": Package,
  section: Layers,
  widget: Component,
  app: Box,
  "add-on": Puzzle,
};

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const { toast } = useToast();

  const { data: items, isLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/marketplace/items"],
  });

  const { data: installs } = useQuery<MarketplaceInstall[]>({
    queryKey: ["/api/marketplace/installs"],
  });

  const installMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiRequest("POST", "/api/marketplace/install", { itemId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/installs"] });
      toast({ title: "Installed", description: "Item has been installed to your workspace." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to install", variant: "destructive" });
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiRequest("POST", "/api/marketplace/uninstall", { itemId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/installs"] });
      toast({ title: "Uninstalled", description: "Item has been disabled in your workspace." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to uninstall", variant: "destructive" });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiRequest("POST", "/api/marketplace/preview/start", { itemId });
      return res.json();
    },
    onSuccess: () => {
      setPreviewOpen(true);
    },
  });

  const installedMap = new Map<string, MarketplaceInstall>();
  (installs || []).forEach((inst) => {
    installedMap.set(inst.itemId, inst);
  });

  const filteredItems = (items || []).filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = tab === "all" || tab === "installed" || item.type === tab;
    return matchesSearch && matchesTab;
  });

  const displayItems = tab === "installed"
    ? filteredItems.filter((item) => {
        const install = installedMap.get(item.id);
        return install?.enabled;
      })
    : filteredItems;

  if (selectedItem) {
    const install = installedMap.get(selectedItem.id);
    const isInstalled = install?.enabled;
    const TypeIcon = typeIcons[selectedItem.type] || Puzzle;

    return (
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedItem(null)}
          className="mb-4"
          data-testid="button-back-to-marketplace"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Marketplace
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <TypeIcon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight" data-testid="text-item-name">
                        {selectedItem.name}
                      </h1>
                      <Badge variant="secondary">{typeLabels[selectedItem.type]}</Badge>
                      {selectedItem.isFree ? (
                        <Badge variant="outline">Free</Badge>
                      ) : (
                        <Badge variant="default">${(selectedItem.price / 100).toFixed(2)}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">by {selectedItem.author}</p>
                    <p className="mt-1 text-xs text-muted-foreground">v{selectedItem.version}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedItem.longDescription || selectedItem.description}
                  </p>
                </div>
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {selectedItem.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => previewMutation.mutate(selectedItem.id)}
                  disabled={previewMutation.isPending}
                  data-testid="button-preview-item"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {previewMutation.isPending ? "Starting..." : "Preview"}
                </Button>

                {isInstalled ? (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => uninstallMutation.mutate(selectedItem.id)}
                    disabled={uninstallMutation.isPending}
                    data-testid="button-uninstall-item"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {uninstallMutation.isPending ? "Removing..." : "Uninstall"}
                  </Button>
                ) : selectedItem.isFree ? (
                  <Button
                    className="w-full"
                    onClick={() => installMutation.mutate(selectedItem.id)}
                    disabled={installMutation.isPending}
                    data-testid="button-install-item"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {installMutation.isPending ? "Installing..." : "Install Free"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => installMutation.mutate(selectedItem.id)}
                    disabled={installMutation.isPending}
                    data-testid="button-purchase-item"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {installMutation.isPending ? "Processing..." : `Purchase — $${(selectedItem.price / 100).toFixed(2)}`}
                  </Button>
                )}

                {isInstalled && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Installed</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Details</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd>{typeLabels[selectedItem.type]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd>{selectedItem.version}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Author</dt>
                    <dd>{selectedItem.author}</dd>
                  </div>
                  {selectedItem.category && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Category</dt>
                      <dd>{selectedItem.category}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preview: {selectedItem.name}</DialogTitle>
              <DialogDescription>
                This is a non-destructive preview. No changes will be applied to your workspace until you install.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Preview Mode</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                The visual preview engine will render a non-destructive overlay of how "{selectedItem.name}" would look on your site. This feature is coming soon.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)} data-testid="button-close-preview">
                Close Preview
              </Button>
              {selectedItem.isFree ? (
                <Button
                  onClick={() => {
                    installMutation.mutate(selectedItem.id);
                    setPreviewOpen(false);
                  }}
                  data-testid="button-preview-install"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    installMutation.mutate(selectedItem.id);
                    setPreviewOpen(false);
                  }}
                  data-testid="button-preview-purchase"
                >
                  Purchase & Install
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-marketplace-title">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and install site kits, sections, widgets, apps, and add-ons.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-marketplace"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="site-kit" data-testid="tab-site-kits">Site Kits</TabsTrigger>
          <TabsTrigger value="section" data-testid="tab-sections">Sections</TabsTrigger>
          <TabsTrigger value="widget" data-testid="tab-widgets">Widgets</TabsTrigger>
          <TabsTrigger value="app" data-testid="tab-apps">Apps</TabsTrigger>
          <TabsTrigger value="add-on" data-testid="tab-addons">Add-ons</TabsTrigger>
          <TabsTrigger value="installed" data-testid="tab-installed">Installed</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="mt-3 h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-full" />
                    <Skeleton className="mt-1 h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {tab === "installed" ? "No installed items yet." : "No items found."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayItems.map((item) => {
                const TypeIcon = typeIcons[item.type] || Puzzle;
                const install = installedMap.get(item.id);
                const isInstalled = install?.enabled;

                return (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedItem(item)}
                    data-testid={`card-marketplace-${item.slug}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <TypeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{item.name}</h3>
                            {isInstalled && (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {typeLabels[item.type]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">v{item.version}</span>
                        </div>
                        {item.isFree ? (
                          <Badge variant="secondary" className="text-[10px]">Free</Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px]">${(item.price / 100).toFixed(2)}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
