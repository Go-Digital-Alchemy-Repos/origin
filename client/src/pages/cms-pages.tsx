import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Page, Site } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  FileText,
  Globe,
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

export default function CmsPagesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

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

  const {
    data: pagesList,
    isLoading,
  } = useQuery<Page[]>({
    queryKey: ["/api/cms/sites", activeSite?.id, "pages", { search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined }],
    enabled: !!activeSite?.id,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/cms/sites/${activeSite!.id}/pages?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load pages");
      return res.json();
    },
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: { title: string; slug: string }) => {
      const res = await apiRequest("POST", `/api/cms/sites/${activeSite!.id}/pages`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites"] });
      setCreateOpen(false);
      setNewTitle("");
      setNewSlug("");
      toast({ title: "Page created" });
      setLocation(`/app/pages/${data.page.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create page", variant: "destructive" });
    },
  });

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    setNewSlug(slugify(val));
  };

  if (!activeSite) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
        <p className="mt-2 text-muted-foreground">
          No site found. Create a site first to manage pages.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-pages-title">Pages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage pages for <span className="font-medium">{activeSite.name}</span>
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-page">
              <Plus className="mr-1.5 h-4 w-4" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>Add a new page to your site.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="page-title">Title</Label>
                <Input
                  id="page-title"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Home"
                  data-testid="input-page-title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="page-slug">Slug</Label>
                <Input
                  id="page-slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="home"
                  data-testid="input-page-slug"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button
                onClick={() => createPageMutation.mutate({ title: newTitle, slug: newSlug })}
                disabled={!newTitle || !newSlug || createPageMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createPageMutation.isPending ? "Creating..." : "Create Page"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-pages"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !pagesList || pagesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No pages yet. Create your first page to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pagesList.map((page) => (
            <Card
              key={page.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation(`/app/pages/${page.id}`)}
              data-testid={`card-page-${page.id}`}
            >
              <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    {page.status === "PUBLISHED" ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate" data-testid={`text-page-title-${page.id}`}>
                      {page.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">/{page.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={page.status === "PUBLISHED" ? "default" : "secondary"}
                    data-testid={`badge-status-${page.id}`}
                  >
                    {page.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Badge>
                  {page.updatedAt && (
                    <span className="hidden text-xs text-muted-foreground sm:inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  <Button size="icon" variant="ghost" data-testid={`button-edit-page-${page.id}`}>
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
