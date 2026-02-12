import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Tag,
  History,
  Ban,
  Undo2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import type { MarketplaceItem, MarketplaceChangelog } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ item }: { item: MarketplaceItem }) {
  if (item.deprecated) {
    return <Badge variant="destructive" data-testid={`badge-deprecated-${item.id}`}>Deprecated</Badge>;
  }
  if (item.status === "published") {
    return <Badge variant="default" data-testid={`badge-status-${item.id}`}>Published</Badge>;
  }
  return <Badge variant="secondary" data-testid={`badge-status-${item.id}`}>{item.status}</Badge>;
}

function VersionBumpDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MarketplaceItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [bumpType, setBumpType] = useState<string>("patch");
  const [notes, setNotes] = useState("");

  const bumpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/marketplace/items/${item.id}/bump-version`, {
        bumpType,
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/admin/items"] });
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/items/${item.id}/changelogs`] });
      toast({ title: "Version bumped", description: `Item version updated successfully.` });
      setNotes("");
      setBumpType("patch");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bump Version</DialogTitle>
          <DialogDescription>
            Current version: <span className="font-mono font-semibold">{item.version}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Bump Type</label>
            <Select value={bumpType} onValueChange={setBumpType}>
              <SelectTrigger data-testid="select-bump-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patch">Patch (bug fixes)</SelectItem>
                <SelectItem value="minor">Minor (new features)</SelectItem>
                <SelectItem value="major">Major (breaking changes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Changelog Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what changed in this version..."
              className="mt-1"
              data-testid="input-changelog-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-bump">
            Cancel
          </Button>
          <Button
            onClick={() => bumpMutation.mutate()}
            disabled={!notes.trim() || bumpMutation.isPending}
            data-testid="button-confirm-bump"
          >
            {bumpMutation.isPending ? "Updating..." : "Bump Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeprecateDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MarketplaceItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState(item.deprecationMessage ?? "");

  const deprecateMutation = useMutation({
    mutationFn: async () => {
      const endpoint = item.deprecated ? "undeprecate" : "deprecate";
      const body = item.deprecated ? {} : { message: message.trim() || undefined };
      const res = await apiRequest("POST", `/api/marketplace/items/${item.id}/${endpoint}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/admin/items"] });
      const action = item.deprecated ? "restored" : "deprecated";
      toast({ title: `Item ${action}`, description: `Marketplace item has been ${action}.` });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.deprecated ? "Restore Item" : "Deprecate Item"}</DialogTitle>
          <DialogDescription>
            {item.deprecated
              ? "This will make the item available for new installations again."
              : "Deprecated items remain installed for existing users but are hidden from new installations."}
          </DialogDescription>
        </DialogHeader>
        {!item.deprecated && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Deprecation Message (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. This module has been replaced by..."
              className="mt-1"
              data-testid="input-deprecation-message"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-deprecate">
            Cancel
          </Button>
          <Button
            variant={item.deprecated ? "default" : "destructive"}
            onClick={() => deprecateMutation.mutate()}
            disabled={deprecateMutation.isPending}
            data-testid="button-confirm-deprecate"
          >
            {deprecateMutation.isPending
              ? "Processing..."
              : item.deprecated
                ? "Restore Item"
                : "Deprecate Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangelogPanel({ itemId }: { itemId: string }) {
  const { data: changelogs, isLoading } = useQuery<MarketplaceChangelog[]>({
    queryKey: [`/api/marketplace/items/${itemId}/changelogs`],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!changelogs?.length) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-changelogs">
        No changelog entries yet.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="changelog-list">
      {changelogs.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 text-sm">
          <Badge variant="outline" className="shrink-0 font-mono text-xs">
            v{entry.version}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="text-foreground">{entry.notes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.changeType} &middot;{" "}
              {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "Unknown"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemDetailView({
  item,
  onBack,
}: {
  item: MarketplaceItem;
  onBack: () => void;
}) {
  const [showBumpDialog, setShowBumpDialog] = useState(false);
  const [showDeprecateDialog, setShowDeprecateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-list">
          <ArrowLeft />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate" data-testid="text-item-name">{item.name}</h2>
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        </div>
        <StatusBadge item={item} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" /> Version Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-muted-foreground">Current Version</span>
                <span className="font-mono font-semibold" data-testid="text-current-version">v{item.version}</span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-muted-foreground">Min Platform Version</span>
                <span className="font-mono" data-testid="text-min-platform">
                  {item.minPlatformVersion ? `v${item.minPlatformVersion}` : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary">{item.type}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-muted-foreground">Billing</span>
                <Badge variant="secondary">{item.billingType}</Badge>
              </div>
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              <Button size="sm" onClick={() => setShowBumpDialog(true)} data-testid="button-bump-version">
                <ArrowUpCircle className="w-4 h-4 mr-1" /> Bump Version
              </Button>
              {item.deprecated ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeprecateDialog(true)}
                  data-testid="button-restore-item"
                >
                  <Undo2 className="w-4 h-4 mr-1" /> Restore
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeprecateDialog(true)}
                  data-testid="button-deprecate-item"
                >
                  <Ban className="w-4 h-4 mr-1" /> Deprecate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Deprecation Status
            </h3>
            {item.deprecated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <Ban className="w-4 h-4" />
                  <span data-testid="text-deprecated-label">This item is deprecated</span>
                </div>
                {item.deprecationMessage && (
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md" data-testid="text-deprecation-message">
                    {item.deprecationMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span data-testid="text-active-label">Active and available for installation</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <History className="w-4 h-4" /> Changelog
          </h3>
          <ChangelogPanel itemId={item.id} />
        </CardContent>
      </Card>

      <VersionBumpDialog item={item} open={showBumpDialog} onOpenChange={setShowBumpDialog} />
      <DeprecateDialog item={item} open={showDeprecateDialog} onOpenChange={setShowDeprecateDialog} />
    </div>
  );
}

export default function StudioMarketplacePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const { data: items, isLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/marketplace/admin/items"],
  });

  const filteredItems = items?.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "deprecated" && item.deprecated) ||
      (filter === "published" && item.status === "published" && !item.deprecated) ||
      (filter === "draft" && item.status === "draft");
    return matchesSearch && matchesFilter;
  });

  if (selectedItem) {
    const freshItem = items?.find((i) => i.id === selectedItem.id);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ItemDetailView
          item={freshItem ?? selectedItem}
          onBack={() => setSelectedItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-page-title">
          <Store className="w-6 h-6" /> Marketplace Catalog
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage marketplace items, versions, and deprecation status.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-items"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !filteredItems?.length ? (
        <div className="text-center py-12 text-muted-foreground" data-testid="text-no-items">
          No marketplace items found.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedItem(item)}
              data-testid={`card-item-${item.id}`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate" data-testid={`text-item-name-${item.id}`}>
                      {item.name}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      v{item.version}
                    </Badge>
                    <StatusBadge item={item} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
