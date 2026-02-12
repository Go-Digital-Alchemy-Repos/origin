import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Search, Globe, FileCode, Image } from "lucide-react";

interface SeoSettings {
  id: string;
  siteId: string;
  titleSuffix: string | null;
  defaultOgImage: string | null;
  defaultIndexable: boolean;
  robotsTxt: string | null;
}

export default function SiteSeoPage() {
  const { toast } = useToast();

  const [titleSuffix, setTitleSuffix] = useState("");
  const [defaultOgImage, setDefaultOgImage] = useState("");
  const [defaultIndexable, setDefaultIndexable] = useState(true);
  const [robotsTxt, setRobotsTxt] = useState("");
  const [dirty, setDirty] = useState(false);

  const { data: meData } = useQuery<{
    user: { id: string };
    activeWorkspaceId: string | null;
    workspaces: Array<{ id: string; name: string; slug: string }>;
  }>({ queryKey: ["/api/user/me"] });

  useEffect(() => {
    if (meData && !meData.activeWorkspaceId && meData.workspaces.length > 0) {
      apiRequest("POST", "/api/user/select-workspace", { workspaceId: meData.workspaces[0].id })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/user/me"] }));
    }
  }, [meData]);

  const { data: sites } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/user/sites"],
    enabled: !!meData?.activeWorkspaceId,
  });

  const siteId = sites?.[0]?.id;

  const { data: settings, isLoading } = useQuery<SeoSettings>({
    queryKey: ["/api/cms/sites", siteId, "seo"],
    enabled: !!siteId,
  });

  useEffect(() => {
    if (settings) {
      setTitleSuffix(settings.titleSuffix || "");
      setDefaultOgImage(settings.defaultOgImage || "");
      setDefaultIndexable(settings.defaultIndexable ?? true);
      setRobotsTxt(settings.robotsTxt || "User-agent: *\nAllow: /\n");
    } else if (sites?.[0]) {
      setTitleSuffix(sites[0].name);
      setRobotsTxt("User-agent: *\nAllow: /\n");
    }
  }, [settings, sites]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/cms/sites/${siteId}/seo`, {
        titleSuffix: titleSuffix || null,
        defaultOgImage: defaultOgImage || null,
        defaultIndexable,
        robotsTxt: robotsTxt || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", siteId, "seo"] });
      setDirty(false);
      toast({ title: "SEO settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save SEO settings", variant: "destructive" });
    },
  });

  if (!siteId && !isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No site found. Create a site first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleChange = <T,>(setter: (v: T) => void) => (val: T) => {
    setter(val);
    setDirty(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Search className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium text-sm" data-testid="text-seo-heading">SEO Settings</div>
            <div className="text-xs text-muted-foreground">Site-wide search engine defaults</div>
          </div>
          {dirty && (
            <Badge variant="outline" className="text-xs">Unsaved</Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid="button-save-seo"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Title & Indexing Defaults
              </CardTitle>
              <CardDescription>
                These settings apply to all pages unless overridden at the page level.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title-suffix">Title Suffix</Label>
                <Input
                  id="title-suffix"
                  value={titleSuffix}
                  onChange={(e) => handleChange(setTitleSuffix)(e.target.value)}
                  placeholder="My Website"
                  data-testid="input-title-suffix"
                />
                <p className="text-xs text-muted-foreground">
                  Appended to all page titles: "Page Title | {titleSuffix || "Your Site Name"}"
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="default-indexable">Default indexing</Label>
                  <p className="text-xs text-muted-foreground">
                    When on, new pages will be indexable by search engines by default.
                  </p>
                </div>
                <Switch
                  id="default-indexable"
                  checked={defaultIndexable}
                  onCheckedChange={(checked) => handleChange(setDefaultIndexable)(checked)}
                  data-testid="switch-default-indexable"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4" />
                Default Open Graph Image
              </CardTitle>
              <CardDescription>
                Used when a page does not have its own OG image set.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="default-og-image">Default OG Image URL</Label>
                <Input
                  id="default-og-image"
                  value={defaultOgImage}
                  onChange={(e) => handleChange(setDefaultOgImage)(e.target.value)}
                  placeholder="https://example.com/default-share-image.jpg"
                  data-testid="input-default-og-image"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended size: 1200x630px. Used as fallback for social media sharing.
                </p>
              </div>
              {defaultOgImage && (
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={defaultOgImage}
                    alt="OG Image Preview"
                    className="w-full max-h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    data-testid="img-og-preview"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                robots.txt
              </CardTitle>
              <CardDescription>
                Controls how search engine crawlers access your site. The sitemap URL is appended automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="robots-txt">robots.txt Content</Label>
                <Textarea
                  id="robots-txt"
                  value={robotsTxt}
                  onChange={(e) => handleChange(setRobotsTxt)(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="User-agent: *&#10;Allow: /"
                  data-testid="textarea-robots-txt"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Generated Files</CardTitle>
              <CardDescription>
                These files are automatically generated and served for your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">sitemap.xml</div>
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from all published pages with last modified dates.
                  </p>
                </div>
                <Badge variant="secondary">Auto</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">robots.txt</div>
                  <p className="text-xs text-muted-foreground">
                    Served from the content above with sitemap reference appended.
                  </p>
                </div>
                <Badge variant="secondary">Custom</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
