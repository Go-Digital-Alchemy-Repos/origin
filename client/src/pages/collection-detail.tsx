import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, CollectionItem, CollectionItemRevision, CollectionField } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  FileStack,
  Globe,
  FileText,
  Clock,
  Pencil,
  GripVertical,
  Settings2,
} from "lucide-react";

type ItemWithRevision = CollectionItem & { latestRevision?: CollectionItemRevision };

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "richtext", label: "Rich Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "image", label: "Image URL" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "url", label: "URL" },
];

function getItemTitle(item: ItemWithRevision, fields: CollectionField[]): string {
  if (!item.latestRevision?.dataJson) return "Untitled";
  const data = item.latestRevision.dataJson as Record<string, unknown>;
  const textField = fields.find((f) => f.type === "text");
  if (textField && data[textField.key]) return String(data[textField.key]);
  const firstKey = Object.keys(data)[0];
  if (firstKey && data[firstKey]) return String(data[firstKey]);
  return "Untitled";
}

export default function CollectionDetailPage() {
  const [, params] = useRoute("/app/collections/:collectionId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const collectionId = params?.collectionId;

  const [activeTab, setActiveTab] = useState("items");
  const [fields, setFields] = useState<CollectionField[]>([]);
  const [schemaDirty, setSchemaDirty] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: collection, isLoading: colLoading } = useQuery<Collection>({
    queryKey: ["/api/cms/collections", collectionId],
    enabled: !!collectionId,
  });

  const { data: items, isLoading: itemsLoading } = useQuery<ItemWithRevision[]>({
    queryKey: ["/api/cms/collections", collectionId, "items", { status: statusFilter !== "all" ? statusFilter : undefined }],
    enabled: !!collectionId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/cms/collections/${collectionId}/items?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load items");
      return res.json();
    },
  });

  useEffect(() => {
    if (collection?.schemaJson) {
      setFields(Array.isArray(collection.schemaJson) ? (collection.schemaJson as CollectionField[]) : []);
      setSchemaDirty(false);
    }
  }, [collection]);

  const saveSchemaMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/cms/collections/${collectionId}`, {
        schemaJson: fields,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId] });
      setSchemaDirty(false);
      toast({ title: "Schema saved" });
    },
    onError: () => {
      toast({ title: "Failed to save schema", variant: "destructive" });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/cms/collections/${collectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites"] });
      toast({ title: "Collection deleted" });
      setLocation("/app/collections");
    },
    onError: () => {
      toast({ title: "Failed to delete", variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cms/collections/${collectionId}/items`, { dataJson: {} });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items"] });
      toast({ title: "Item created" });
      setLocation(`/app/collections/${collectionId}/items/${data.item.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create item", variant: "destructive" });
    },
  });

  const handleAddField = () => {
    if (!newFieldKey || !newFieldLabel) return;
    const field: CollectionField = {
      key: newFieldKey.replace(/\s+/g, "_").toLowerCase(),
      label: newFieldLabel,
      type: newFieldType as CollectionField["type"],
      required: newFieldRequired,
    };
    if ((newFieldType === "select" || newFieldType === "multiselect") && newFieldOptions) {
      field.options = newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean);
    }
    setFields([...fields, field]);
    setSchemaDirty(true);
    setAddFieldOpen(false);
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setNewFieldOptions("");
  };

  const handleRemoveField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
    setSchemaDirty(true);
  };

  const handleLabelToKey = (val: string) => {
    setNewFieldLabel(val);
    setNewFieldKey(val.replace(/\s+/g, "_").toLowerCase().replace(/[^\w]/g, ""));
  };

  if (colLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Collection not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/app/collections")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Collections
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/app/collections")}
            data-testid="button-back-collections"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="font-medium truncate text-sm" data-testid="text-collection-title">{collection.name}</div>
            <div className="text-xs text-muted-foreground">/{collection.slug}</div>
          </div>
          <Badge variant="secondary">
            {fields.length} fields
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteCollectionMutation.mutate()}
            disabled={deleteCollectionMutation.isPending}
            data-testid="button-delete-collection"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList data-testid="tabs-collection">
              <TabsTrigger value="items" data-testid="tab-items">Items</TabsTrigger>
              <TabsTrigger value="schema" data-testid="tab-schema">
                <Settings2 className="mr-1.5 h-4 w-4" />
                Schema
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-item-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => createItemMutation.mutate()}
                  disabled={createItemMutation.isPending}
                  data-testid="button-create-item"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {createItemMutation.isPending ? "Creating..." : "New Item"}
                </Button>
              </div>

              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : !items || items.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileStack className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No items yet. Add your first item to this collection.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/app/collections/${collectionId}/items/${item.id}`)}
                      data-testid={`card-item-${item.id}`}
                    >
                      <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            {item.status === "PUBLISHED" ? (
                              <Globe className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate" data-testid={`text-item-title-${item.id}`}>
                              {getItemTitle(item, fields)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.latestRevision ? `v${item.latestRevision.version}` : "No data"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant={item.status === "PUBLISHED" ? "default" : "secondary"}
                            data-testid={`badge-item-status-${item.id}`}
                          >
                            {item.status === "PUBLISHED" ? "Published" : "Draft"}
                          </Badge>
                          {item.updatedAt && (
                            <span className="hidden text-xs text-muted-foreground sm:inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                          <Button size="icon" variant="ghost" data-testid={`button-edit-item-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schema" className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold">Schema Fields</h2>
                  <p className="text-sm text-muted-foreground">Define the structure of items in this collection.</p>
                </div>
                <div className="flex items-center gap-2">
                  {schemaDirty && (
                    <Badge variant="outline" className="text-xs">
                      Unsaved
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveSchemaMutation.mutate()}
                    disabled={!schemaDirty || saveSchemaMutation.isPending}
                    data-testid="button-save-schema"
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {saveSchemaMutation.isPending ? "Saving..." : "Save Schema"}
                  </Button>
                  <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-field">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Field
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Field</DialogTitle>
                        <DialogDescription>Add a new field to the collection schema.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="field-label">Label</Label>
                          <Input
                            id="field-label"
                            value={newFieldLabel}
                            onChange={(e) => handleLabelToKey(e.target.value)}
                            placeholder="Title"
                            data-testid="input-field-label"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="field-key">Key</Label>
                          <Input
                            id="field-key"
                            value={newFieldKey}
                            onChange={(e) => setNewFieldKey(e.target.value)}
                            placeholder="title"
                            data-testid="input-field-key"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Type</Label>
                          <Select value={newFieldType} onValueChange={setNewFieldType}>
                            <SelectTrigger data-testid="select-field-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((ft) => (
                                <SelectItem key={ft.value} value={ft.value}>
                                  {ft.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {(newFieldType === "select" || newFieldType === "multiselect") && (
                          <div className="space-y-1.5">
                            <Label htmlFor="field-options">Options (comma-separated)</Label>
                            <Input
                              id="field-options"
                              value={newFieldOptions}
                              onChange={(e) => setNewFieldOptions(e.target.value)}
                              placeholder="Option A, Option B, Option C"
                              data-testid="input-field-options"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={newFieldRequired}
                            onCheckedChange={setNewFieldRequired}
                            data-testid="switch-field-required"
                          />
                          <Label>Required</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddFieldOpen(false)}>Cancel</Button>
                        <Button
                          onClick={handleAddField}
                          disabled={!newFieldKey || !newFieldLabel}
                          data-testid="button-confirm-add-field"
                        >
                          Add Field
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {fields.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Settings2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No fields defined yet. Add fields to define the item structure.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <Card key={`${field.key}-${idx}`} data-testid={`card-field-${field.key}`}>
                      <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="text-xs text-muted-foreground">
                              <code className="bg-muted px-1 rounded text-[11px]">{field.key}</code>
                              <span className="ml-2">{FIELD_TYPES.find((ft) => ft.value === field.type)?.label || field.type}</span>
                              {field.required && <span className="ml-2 text-destructive">Required</span>}
                              {field.options && field.options.length > 0 && (
                                <span className="ml-2">({field.options.join(", ")})</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveField(idx)}
                          data-testid={`button-remove-field-${field.key}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
