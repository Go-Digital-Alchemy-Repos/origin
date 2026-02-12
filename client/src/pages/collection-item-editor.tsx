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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

type ItemWithRevision = CollectionItem & { latestRevision?: CollectionItemRevision };

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CollectionField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const strVal = value != null ? String(value) : "";

  switch (field.type) {
    case "text":
    case "url":
    case "image":
      return (
        <Input
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
          data-testid={`input-field-${field.key}`}
        />
      );
    case "richtext":
      return (
        <Textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
          className="min-h-[120px]"
          data-testid={`textarea-field-${field.key}`}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={strVal}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={field.description || "0"}
          data-testid={`input-field-${field.key}`}
        />
      );
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => onChange(checked)}
            data-testid={`switch-field-${field.key}`}
          />
          <span className="text-sm text-muted-foreground">
            {value ? "Yes" : "No"}
          </span>
        </div>
      );
    case "date":
      return (
        <Input
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`input-field-${field.key}`}
        />
      );
    case "select":
      return (
        <Select value={strVal} onValueChange={(v) => onChange(v)}>
          <SelectTrigger data-testid={`select-field-${field.key}`}>
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2" data-testid={`multiselect-field-${field.key}`}>
          <div className="flex flex-wrap gap-1.5">
            {field.options?.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <Badge
                  key={opt}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer toggle-elevate"
                  onClick={() => {
                    if (isSelected) {
                      onChange(selected.filter((s) => s !== opt));
                    } else {
                      onChange([...selected, opt]);
                    }
                  }}
                  data-testid={`badge-option-${opt}`}
                >
                  {opt}
                </Badge>
              );
            })}
          </div>
          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground">{selected.length} selected</p>
          )}
        </div>
      );
    }
    default:
      return (
        <Input
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`input-field-${field.key}`}
        />
      );
  }
}

export default function CollectionItemEditorPage() {
  const [, params] = useRoute("/app/collections/:collectionId/items/:itemId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const collectionId = params?.collectionId;
  const itemId = params?.itemId;

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);

  const { data: collection } = useQuery<Collection>({
    queryKey: ["/api/cms/collections", collectionId],
    enabled: !!collectionId,
  });

  const { data: itemData, isLoading } = useQuery<ItemWithRevision>({
    queryKey: ["/api/cms/collections", collectionId, "items", itemId],
    enabled: !!collectionId && !!itemId,
  });

  const { data: revisions } = useQuery<CollectionItemRevision[]>({
    queryKey: ["/api/cms/collections", collectionId, "items", itemId, "revisions"],
    enabled: !!collectionId && !!itemId && revisionsOpen,
  });

  const fields: CollectionField[] = collection?.schemaJson
    ? (Array.isArray(collection.schemaJson) ? (collection.schemaJson as CollectionField[]) : [])
    : [];

  useEffect(() => {
    if (itemData?.latestRevision?.dataJson) {
      setFormData(itemData.latestRevision.dataJson as Record<string, unknown>);
      setDirty(false);
    }
  }, [itemData]);

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/cms/collections/${collectionId}/items/${itemId}`, {
        dataJson: formData,
        note: "Draft save",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items", itemId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items", itemId, "revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items"] });
      setDirty(false);
      toast({ title: "Item saved" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cms/collections/${collectionId}/items/${itemId}/publish`, {
        dataJson: formData,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items", itemId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items", itemId, "revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items"] });
      setDirty(false);
      toast({ title: "Item published" });
    },
    onError: () => {
      toast({ title: "Failed to publish", variant: "destructive" });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (revisionId: string) => {
      const res = await apiRequest("POST", `/api/cms/collections/${collectionId}/items/${itemId}/rollback/${revisionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items", itemId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items", itemId, "revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items"] });
      toast({ title: "Rolled back to previous version" });
    },
    onError: () => {
      toast({ title: "Failed to rollback", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/cms/collections/${collectionId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/collections", collectionId, "items"] });
      toast({ title: "Item deleted" });
      setLocation(`/app/collections/${collectionId}`);
    },
    onError: () => {
      toast({ title: "Failed to delete", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Item not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation(`/app/collections/${collectionId}`)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Collection
        </Button>
      </div>
    );
  }

  const itemTitle = fields.length > 0
    ? (formData[fields[0].key] ? String(formData[fields[0].key]) : "Untitled")
    : "Untitled";

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/app/collections/${collectionId}`)}
            data-testid="button-back-collection"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="font-medium truncate text-sm" data-testid="text-item-editor-title">
              {itemTitle}
            </div>
            <div className="text-xs text-muted-foreground">
              {collection?.name}
            </div>
          </div>
          <Badge
            variant={itemData.status === "PUBLISHED" ? "default" : "secondary"}
            data-testid="badge-item-status"
          >
            {itemData.status === "PUBLISHED" ? "Published" : "Draft"}
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
              <Button variant="outline" size="sm" data-testid="button-item-revisions">
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
                    <Card key={rev.id} data-testid={`card-item-revision-${rev.id}`}>
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
                              data-testid={`button-item-rollback-${rev.id}`}
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
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid="button-delete-item"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-item-draft"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            data-testid="button-publish-item"
          >
            <Globe className="mr-1.5 h-4 w-4" />
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {fields.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  No fields defined for this collection. Go to the Schema tab to add fields.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setLocation(`/app/collections/${collectionId}`)}
                >
                  Edit Schema
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Item Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`field-${field.key}`} className="flex items-center gap-1.5">
                      {field.label}
                      {field.required && <span className="text-destructive text-xs">*</span>}
                    </Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    <FieldInput
                      field={field}
                      value={formData[field.key]}
                      onChange={(val) => handleFieldChange(field.key, val)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
