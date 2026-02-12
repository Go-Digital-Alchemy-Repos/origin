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
  Package,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Upload,
  Eye,
  CheckCircle2,
  XCircle,
  Layers,
  Palette,
  FileText,
  Database,
  BookOpen,
} from "lucide-react";
import type { SiteKit, SiteKitAsset } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const kitFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().min(1, "Description is required"),
  version: z.string().default("1.0.0"),
  coverImage: z.string().optional(),
});

type KitFormValues = z.infer<typeof kitFormSchema>;

const assetFormSchema = z.object({
  assetType: z.string().min(1, "Asset type is required"),
  assetRef: z.string().min(1, "Asset reference is required"),
  label: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

const assetTypeLabels: Record<string, string> = {
  theme_preset: "Theme Preset",
  page_template: "Page Template",
  section_preset: "Section Preset",
  collection_schema: "Collection Schema",
  starter_content: "Starter Content",
};

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  theme_preset: Palette,
  page_template: FileText,
  section_preset: Layers,
  collection_schema: Database,
  starter_content: BookOpen,
};

function statusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge variant="default" data-testid="badge-status-published">Published</Badge>;
    case "draft":
      return <Badge variant="secondary" data-testid="badge-status-draft">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function SiteKitsPage() {
  const [selectedKit, setSelectedKit] = useState<SiteKit | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const { toast } = useToast();

  const { data: kits, isLoading } = useQuery<SiteKit[]>({
    queryKey: ["/api/site-kits"],
  });

  const { data: assets } = useQuery<SiteKitAsset[]>({
    queryKey: ["/api/site-kits", selectedKit?.id, "assets"],
    enabled: !!selectedKit,
  });

  const { data: manifest } = useQuery<any>({
    queryKey: ["/api/site-kits", selectedKit?.id, "manifest"],
    enabled: !!selectedKit && showPreviewDialog,
  });

  const createForm = useForm<KitFormValues>({
    resolver: zodResolver(kitFormSchema),
    defaultValues: { name: "", slug: "", description: "", version: "1.0.0", coverImage: "" },
  });

  const editForm = useForm<KitFormValues>({
    resolver: zodResolver(kitFormSchema),
    defaultValues: { name: "", slug: "", description: "", version: "1.0.0", coverImage: "" },
  });

  const assetForm = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: { assetType: "", assetRef: "", label: "", sortOrder: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: KitFormValues) => {
      const res = await apiRequest("POST", "/api/site-kits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-kits"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Created", description: "Site kit created successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create site kit", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: KitFormValues) => {
      const res = await apiRequest("PATCH", `/api/site-kits/${selectedKit!.id}`, data);
      return res.json();
    },
    onSuccess: (updated: SiteKit) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-kits"] });
      setShowEditDialog(false);
      setSelectedKit(updated);
      toast({ title: "Updated", description: "Site kit updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/site-kits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-kits"] });
      setSelectedKit(null);
      toast({ title: "Deleted", description: "Site kit deleted." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/site-kits/${id}/publish`);
      return res.json();
    },
    onSuccess: (updated: SiteKit) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-kits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/items"] });
      setSelectedKit(updated);
      toast({ title: "Published", description: "Site kit published to marketplace." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to publish", variant: "destructive" });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/site-kits/${id}/unpublish`);
      return res.json();
    },
    onSuccess: (updated: SiteKit) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-kits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/items"] });
      setSelectedKit(updated);
      toast({ title: "Unpublished", description: "Site kit removed from marketplace." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to unpublish", variant: "destructive" });
    },
  });

  const addAssetMutation = useMutation({
    mutationFn: async (data: AssetFormValues) => {
      const res = await apiRequest("POST", `/api/site-kits/${selectedKit!.id}/assets`, {
        ...data,
        siteKitId: selectedKit!.id,
        configJson: {},
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-kits", selectedKit?.id, "assets"] });
      setShowAddAssetDialog(false);
      assetForm.reset();
      toast({ title: "Added", description: "Asset added to kit." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add asset", variant: "destructive" });
    },
  });

  const removeAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      await apiRequest("DELETE", `/api/site-kits/assets/${assetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-kits", selectedKit?.id, "assets"] });
      toast({ title: "Removed", description: "Asset removed from kit." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to remove asset", variant: "destructive" });
    },
  });

  if (selectedKit) {
    return (
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedKit(null)}
          data-testid="button-back-to-kits"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Site Kits
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight" data-testid="text-kit-name">
                        {selectedKit.name}
                      </h1>
                      {statusBadge(selectedKit.status)}
                      <Badge variant="outline">v{selectedKit.version}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedKit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="text-lg font-semibold">Kit Assets</h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      assetForm.reset({ assetType: "", assetRef: "", label: "", sortOrder: 0 });
                      setShowAddAssetDialog(true);
                    }}
                    data-testid="button-add-asset"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Asset
                  </Button>
                </div>
                {!assets || assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">No assets added yet. Add theme presets, page templates, sections, and more.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assets.map((asset) => {
                      const AssetIcon = assetTypeIcons[asset.assetType] || Layers;
                      return (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between gap-3 rounded-md border p-3"
                          data-testid={`asset-row-${asset.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <AssetIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{asset.label || asset.assetRef}</p>
                              <p className="text-xs text-muted-foreground">
                                {assetTypeLabels[asset.assetType] || asset.assetType}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeAssetMutation.mutate(asset.id)}
                            disabled={removeAssetMutation.isPending}
                            data-testid={`button-remove-asset-${asset.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
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
                  onClick={() => {
                    setShowPreviewDialog(true);
                  }}
                  data-testid="button-preview-kit"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Kit
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    editForm.reset({
                      name: selectedKit.name,
                      slug: selectedKit.slug,
                      description: selectedKit.description,
                      version: selectedKit.version,
                      coverImage: selectedKit.coverImage || "",
                    });
                    setShowEditDialog(true);
                  }}
                  data-testid="button-edit-kit"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>

                {selectedKit.status === "draft" ? (
                  <Button
                    className="w-full"
                    onClick={() => publishMutation.mutate(selectedKit.id)}
                    disabled={publishMutation.isPending}
                    data-testid="button-publish-kit"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {publishMutation.isPending ? "Publishing..." : "Publish to Marketplace"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => unpublishMutation.mutate(selectedKit.id)}
                    disabled={unpublishMutation.isPending}
                    data-testid="button-unpublish-kit"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {unpublishMutation.isPending ? "Unpublishing..." : "Unpublish"}
                  </Button>
                )}

                {selectedKit.status === "draft" && (
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(selectedKit.id)}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-kit"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteMutation.isPending ? "Deleting..." : "Delete Kit"}
                  </Button>
                )}

                {selectedKit.status === "published" && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Live on Marketplace</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Kit Summary</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="capitalize">{selectedKit.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd>{selectedKit.version}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Assets</dt>
                    <dd>{assets?.length || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Slug</dt>
                    <dd className="font-mono text-xs">{selectedKit.slug}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showAddAssetDialog} onOpenChange={setShowAddAssetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Asset</DialogTitle>
              <DialogDescription>Add a theme preset, page template, section, collection schema, or starter content to this kit.</DialogDescription>
            </DialogHeader>
            <Form {...assetForm}>
              <form onSubmit={assetForm.handleSubmit((data) => addAssetMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={assetForm.control}
                  name="assetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="theme_preset">Theme Preset</SelectItem>
                          <SelectItem value="page_template">Page Template</SelectItem>
                          <SelectItem value="section_preset">Section Preset</SelectItem>
                          <SelectItem value="collection_schema">Collection Schema</SelectItem>
                          <SelectItem value="starter_content">Starter Content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assetForm.control}
                  name="assetRef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Reference</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., component slug or JSON ref" data-testid="input-asset-ref" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assetForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Human-readable label" data-testid="input-asset-label" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assetForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" data-testid="input-asset-sort" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddAssetDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addAssetMutation.isPending} data-testid="button-submit-asset">
                    {addAssetMutation.isPending ? "Adding..." : "Add Asset"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Site Kit</DialogTitle>
              <DialogDescription>Update the site kit details.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-slug" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-edit-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-version" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Kit Preview: {selectedKit.name}</DialogTitle>
              <DialogDescription>Preview what this kit includes before publishing.</DialogDescription>
            </DialogHeader>
            {manifest ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{manifest.summary.themePresets}</p>
                        <p className="text-xs text-muted-foreground">Theme Presets</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{manifest.summary.pageTemplates}</p>
                        <p className="text-xs text-muted-foreground">Page Templates</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{manifest.summary.sectionPresets}</p>
                        <p className="text-xs text-muted-foreground">Section Presets</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{manifest.summary.collectionSchemas}</p>
                        <p className="text-xs text-muted-foreground">Collection Schemas</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {manifest.summary.starterContent > 0 && (
                  <Card>
                    <CardContent className="p-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{manifest.summary.starterContent} starter content items</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <p className="text-xs text-muted-foreground">
                  Installing this kit creates new pages and content. It does not overwrite any existing pages or data.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)} data-testid="button-close-preview">
                Close
              </Button>
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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-site-kits-title">Site Kits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage, and publish bundled site kits to the marketplace.
          </p>
        </div>
        <Button
          onClick={() => {
            createForm.reset({ name: "", slug: "", description: "", version: "1.0.0", coverImage: "" });
            setShowCreateDialog(true);
          }}
          data-testid="button-create-kit"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create Kit
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="mt-3 h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !kits || kits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No site kits yet. Create your first kit to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <Card
              key={kit.id}
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedKit(kit)}
              data-testid={`card-kit-${kit.slug}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{kit.name}</h3>
                      {statusBadge(kit.status)}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{kit.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">v{kit.version}</span>
                  <Badge variant="outline" className="text-[10px]">{kit.slug}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Site Kit</DialogTitle>
            <DialogDescription>Define a new site kit bundle with theme, templates, and content.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Modern Business" data-testid="input-create-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., modern-business" data-testid="input-create-slug" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="A brief description of this site kit..." data-testid="input-create-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1.0.0" data-testid="input-create-version" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                  {createMutation.isPending ? "Creating..." : "Create Kit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
