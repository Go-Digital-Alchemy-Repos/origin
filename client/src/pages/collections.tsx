import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, Site } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  FileStack,
  Clock,
  Pencil,
} from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function CollectionsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: meData } = useQuery<{
    user: { id: string };
    activeWorkspaceId: string | null;
    workspaces: Array<{ id: string; name: string; slug: string; plan: string }>;
  }>({ queryKey: ["/api/user/me"] });

  useEffect(() => {
    if (meData && !meData.activeWorkspaceId && meData.workspaces.length > 0) {
      apiRequest("POST", "/api/user/select-workspace", { workspaceId: meData.workspaces[0].id })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/user/me"] }));
    }
  }, [meData]);

  const { data: sitesList } = useQuery<Site[]>({
    queryKey: ["/api/user/sites"],
    enabled: !!meData?.activeWorkspaceId,
  });

  const activeSite = sitesList?.[0];

  const { data: collectionsList, isLoading } = useQuery<Collection[]>({
    queryKey: ["/api/cms/sites", activeSite?.id, "collections", { search: search || undefined }],
    enabled: !!activeSite?.id,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/cms/sites/${activeSite!.id}/collections?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load collections");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const res = await apiRequest("POST", `/api/cms/sites/${activeSite!.id}/collections`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites"] });
      setCreateOpen(false);
      setNewName("");
      setNewSlug("");
      setNewDesc("");
      toast({ title: "Collection created" });
      setLocation(`/app/collections/${data.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create collection", variant: "destructive" });
    },
  });

  const handleNameChange = (val: string) => {
    setNewName(val);
    setNewSlug(slugify(val));
  };

  if (!activeSite) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <p className="mt-2 text-muted-foreground">
          No site found. Create a site first to manage collections.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-collections-title">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define custom content types for <span className="font-medium">{activeSite.name}</span>
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-collection">
              <Plus className="mr-1.5 h-4 w-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>Define a new custom content type.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="col-name">Name</Label>
                <Input
                  id="col-name"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Blog Posts"
                  data-testid="input-collection-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col-slug">Slug</Label>
                <Input
                  id="col-slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="blog-posts"
                  data-testid="input-collection-slug"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col-desc">Description (optional)</Label>
                <Textarea
                  id="col-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="A brief description of this collection..."
                  className="min-h-[60px]"
                  data-testid="input-collection-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} data-testid="button-cancel-create-collection">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate({ name: newName, slug: newSlug, description: newDesc || undefined })}
                disabled={!newName || !newSlug || createMutation.isPending}
                data-testid="button-confirm-create-collection"
              >
                {createMutation.isPending ? "Creating..." : "Create Collection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-collections"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !collectionsList || collectionsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileStack className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No collections yet. Create your first collection to define a content type.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {collectionsList.map((col) => (
            <Card
              key={col.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation(`/app/collections/${col.id}`)}
              data-testid={`card-collection-${col.id}`}
            >
              <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileStack className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate" data-testid={`text-collection-name-${col.id}`}>
                      {col.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      /{col.slug}
                      {col.description && <span className="ml-2">{col.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary">
                    {Array.isArray(col.schemaJson) ? (col.schemaJson as unknown[]).length : 0} fields
                  </Badge>
                  {col.updatedAt && (
                    <span className="hidden text-xs text-muted-foreground sm:inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(col.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  <Button size="icon" variant="ghost" data-testid={`button-edit-collection-${col.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
