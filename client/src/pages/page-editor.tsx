import { useState, useEffect, lazy, Suspense } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Save,
  Globe,
  History,
  RotateCcw,
  Clock,
  Blocks,
  FileText,
  Code2,
  Search,
  Share2,
} from "lucide-react";
import type { BuilderContent } from "@/lib/builder/types";
import { isBuilderContent } from "@/lib/builder/types";

const PuckEditorWrapper = lazy(() => import("@/components/builder/PuckEditor"));

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
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [indexable, setIndexable] = useState(true);
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

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
      setCanonicalUrl(pageData.canonicalUrl || "");
      setIndexable(pageData.indexable ?? true);
      setOgTitle(pageData.ogTitle || "");
      setOgDescription(pageData.ogDescription || "");
      setOgImage(pageData.ogImage || "");
      if (pageData.latestRevision) {
        setContentJson(JSON.stringify(pageData.latestRevision.contentJson, null, 2));
      }
      setDirty(false);
    }
  }, [pageData]);

  const saveMutation = useMutation({
    mutationFn: async (overrideContent?: unknown) => {
      let parsed: unknown = {};
      if (overrideContent !== undefined) {
        parsed = overrideContent;
      } else {
        try {
          parsed = JSON.parse(contentJson);
        } catch {
          parsed = {};
        }
      }
      const res = await apiRequest("PATCH", `/api/cms/pages/${pageId}`, {
        title,
        slug,
        contentJson: parsed,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        canonicalUrl: canonicalUrl || undefined,
        indexable,
        ogTitle: ogTitle || undefined,
        ogDescription: ogDescription || undefined,
        ogImage: ogImage || undefined,
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
    mutationFn: async (overrideContent?: unknown) => {
      let parsed: unknown = {};
      if (overrideContent !== undefined) {
        parsed = overrideContent;
      } else {
        try {
          parsed = JSON.parse(contentJson);
        } catch {
          parsed = {};
        }
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

  const handleBuilderSave = (content: BuilderContent) => {
    saveMutation.mutate(content);
    setContentJson(JSON.stringify(content, null, 2));
  };

  const handleBuilderPublish = (content: BuilderContent) => {
    publishMutation.mutate(content);
    setContentJson(JSON.stringify(content, null, 2));
  };

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

  const currentContentParsed = (() => {
    try {
      return JSON.parse(contentJson);
    } catch {
      return {};
    }
  })();

  const hasBuilderContent = isBuilderContent(currentContentParsed);

  if (builderOpen) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        <PuckEditorWrapper
          initialContent={currentContentParsed}
          onSave={handleBuilderSave}
          onPublish={handleBuilderPublish}
          onClose={() => {
            setBuilderOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/cms/pages", pageId] });
          }}
          pageTitle={pageData.title}
          isSaving={saveMutation.isPending}
          isPublishing={publishMutation.isPending}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
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
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="default"
            size="sm"
            onClick={() => setBuilderOpen(true)}
            data-testid="button-open-builder"
          >
            <Blocks className="mr-1.5 h-4 w-4" />
            Open Builder
          </Button>
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
                            <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => saveMutation.mutate(undefined)}
            disabled={saveMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            size="sm"
            onClick={() => publishMutation.mutate(undefined)}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-page-editor">
            <TabsList>
              <TabsTrigger value="details" data-testid="tab-details">
                <FileText className="h-4 w-4 mr-1" />
                Details
              </TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content">
                <Code2 className="h-4 w-4 mr-1" />
                Content JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-4">
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
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Engine Optimization
                  </CardTitle>
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
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Recommended: 50-60 characters</span>
                      <span className={seoTitle.length > 60 ? "text-destructive" : ""}>{seoTitle.length}/60</span>
                    </div>
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
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Recommended: 150-160 characters</span>
                      <span className={seoDescription.length > 160 ? "text-destructive" : ""}>{seoDescription.length}/160</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="canonical-url">Canonical URL</Label>
                    <Input
                      id="canonical-url"
                      value={canonicalUrl}
                      onChange={(e) => handleFieldChange(setCanonicalUrl)(e.target.value)}
                      placeholder="https://example.com/page (leave blank for auto)"
                      data-testid="input-canonical-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      If left empty, a canonical URL will be generated automatically.
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="indexable">Allow search engine indexing</Label>
                      <p className="text-xs text-muted-foreground">
                        When off, search engines will be told not to index this page.
                      </p>
                    </div>
                    <Switch
                      id="indexable"
                      checked={indexable}
                      onCheckedChange={(checked) => {
                        setIndexable(checked);
                        setDirty(true);
                      }}
                      data-testid="switch-indexable"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Open Graph (Social Sharing)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="og-title">OG Title</Label>
                    <Input
                      id="og-title"
                      value={ogTitle}
                      onChange={(e) => handleFieldChange(setOgTitle)(e.target.value)}
                      placeholder="Override title shown when shared on social media"
                      data-testid="input-og-title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="og-description">OG Description</Label>
                    <Textarea
                      id="og-description"
                      value={ogDescription}
                      onChange={(e) => handleFieldChange(setOgDescription)(e.target.value)}
                      placeholder="Override description shown when shared on social media"
                      className="min-h-[80px]"
                      data-testid="input-og-description"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="og-image">OG Image URL</Label>
                    <Input
                      id="og-image"
                      value={ogImage}
                      onChange={(e) => handleFieldChange(setOgImage)(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-og-image"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 1200x630px. Falls back to site default if empty.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {hasBuilderContent && (
                <Card>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Blocks className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">Visual Builder Content</div>
                        <div className="text-xs text-muted-foreground">
                          {(currentContentParsed as BuilderContent).data?.content?.length || 0} blocks
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setBuilderOpen(true)} data-testid="button-edit-in-builder">
                        Edit in Builder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="content" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content (JSON)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={contentJson}
                    onChange={(e) => handleFieldChange(setContentJson)(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    data-testid="textarea-content-json"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
