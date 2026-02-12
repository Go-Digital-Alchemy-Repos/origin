import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Page, PageRevision } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Save,
  Globe,
  History,
  RotateCcw,
  Clock,
  User,
  FileText,
} from "lucide-react";

type PageWithRevision = Page & { latestRevision?: PageRevision };

export default function PageEditorPage() {
  const [, params] = useRoute("/app/pages/:pageId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const pageId = params?.pageId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentJson, setContentJson] = useState("{}");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [dirty, setDirty] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);

  const { data: pageData, isLoading } = useQuery<PageWithRevision>({
    queryKey: ["/api/cms/pages", pageId],
    enabled: !!pageId,
  });

  const { data: revisions } = useQuery<PageRevision[]>({
    queryKey: ["/api/cms/pages", pageId, "revisions"],
    enabled: !!pageId && revisionsOpen,
  });

  useEffect(() => {
    if (pageData) {
      setTitle(pageData.title);
      setSlug(pageData.slug);
      setSeoTitle(pageData.seoTitle || "");
      setSeoDescription(pageData.seoDescription || "");
      if (pageData.latestRevision) {
        setContentJson(JSON.stringify(pageData.latestRevision.contentJson, null, 2));
      }
      setDirty(false);
    }
  }, [pageData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let parsed: unknown = {};
      try {
        parsed = JSON.parse(contentJson);
      } catch {
        parsed = {};
      }
      const res = await apiRequest("PATCH", `/api/cms/pages/${pageId}`, {
        title,
        slug,
        contentJson: parsed,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        note: "Draft save",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages", pageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages", pageId, "revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites"] });
      setDirty(false);
      toast({ title: "Page saved" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      let parsed: unknown = {};
      try {
        parsed = JSON.parse(contentJson);
      } catch {
        parsed = {};
      }
      const res = await apiRequest("POST", `/api/cms/pages/${pageId}/publish`, { contentJson: parsed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages", pageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages", pageId, "revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites"] });
      setDirty(false);
      toast({ title: "Page published" });
    },
    onError: () => {
      toast({ title: "Failed to publish", variant: "destructive" });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (revisionId: string) => {
      const res = await apiRequest("POST", `/api/cms/pages/${pageId}/rollback/${revisionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages", pageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages", pageId, "revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites"] });
      toast({ title: "Rolled back to previous version" });
    },
    onError: () => {
      toast({ title: "Failed to rollback", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Page not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/app/pages")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Pages
        </Button>
      </div>
    );
  }

  const handleFieldChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setDirty(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/app/pages")}
            data-testid="button-back-pages"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="font-medium truncate text-sm" data-testid="text-editor-title">{pageData.title}</div>
            <div className="text-xs text-muted-foreground">/{pageData.slug}</div>
          </div>
          <Badge
            variant={pageData.status === "PUBLISHED" ? "default" : "secondary"}
            data-testid="badge-page-status"
          >
            {pageData.status === "PUBLISHED" ? "Published" : "Draft"}
          </Badge>
          {dirty && (
            <Badge variant="outline" className="text-xs">
              Unsaved
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={revisionsOpen} onOpenChange={setRevisionsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-revisions">
                <History className="mr-1.5 h-4 w-4" />
                Revisions
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Revision History</SheetTitle>
                <SheetDescription>
                  View and rollback to previous versions. Max 10 revisions kept.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {!revisions || revisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No revisions yet.</p>
                ) : (
                  revisions.map((rev, idx) => (
                    <Card key={rev.id} data-testid={`card-revision-${rev.id}`}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">v{rev.version}</span>
                              {idx === 0 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Current
                                </Badge>
                              )}
                            </div>
                            {rev.note && (
                              <p className="text-xs text-muted-foreground mt-0.5">{rev.note}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(rev.createdAt!).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {idx !== 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rollbackMutation.mutate(rev.id)}
                              disabled={rollbackMutation.isPending}
                              data-testid={`button-rollback-${rev.id}`}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            data-testid="button-publish"
          >
            <Globe className="mr-1.5 h-4 w-4" />
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => handleFieldChange(setTitle)(e.target.value)}
                  data-testid="input-edit-title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={slug}
                  onChange={(e) => handleFieldChange(setSlug)(e.target.value)}
                  data-testid="input-edit-slug"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={contentJson}
                onChange={(e) => handleFieldChange(setContentJson)(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                data-testid="textarea-content-json"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(e) => handleFieldChange(setSeoTitle)(e.target.value)}
                  placeholder="Page title for search engines"
                  data-testid="input-seo-title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-description">SEO Description</Label>
                <Textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(e) => handleFieldChange(setSeoDescription)(e.target.value)}
                  placeholder="Brief page description for search results"
                  className="min-h-[80px]"
                  data-testid="input-seo-description"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
