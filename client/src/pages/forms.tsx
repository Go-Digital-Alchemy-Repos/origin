import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Pencil,
  ClipboardList,
  ArrowLeft,
  GripVertical,
  Eye,
  Copy,
  ChevronUp,
  ChevronDown,
  Inbox,
  Settings2,
} from "lucide-react";
import type { FormField, FormSettings, Form, FormSubmission } from "@shared/schema";

type ViewMode = "list" | "editor" | "submissions";

interface FormWithMeta extends Form {
  _submissionCount?: number;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
  { value: "date", label: "Date" },
] as const;

function generateFieldId(): string {
  return "f_" + Math.random().toString(36).slice(2, 10);
}

export default function FormsPage() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewMode>("list");
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFormName, setNewFormName] = useState("");

  const { data: sitesList } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/user/sites"],
  });

  const activeSite = sitesList?.[0];

  const { data: formsList, isLoading: formsLoading } = useQuery<Form[]>({
    queryKey: ["/api/cms/sites", activeSite?.id, "forms"],
    enabled: !!activeSite?.id,
    queryFn: async () => {
      const res = await fetch(`/api/cms/sites/${activeSite!.id}/forms`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load forms");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", `/api/cms/sites/${activeSite!.id}/forms`, data);
      return res.json();
    },
    onSuccess: (form: Form) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", activeSite?.id, "forms"] });
      setShowCreateDialog(false);
      setNewFormName("");
      setActiveFormId(form.id);
      setView("editor");
      toast({ title: "Form created" });
    },
    onError: () => toast({ title: "Failed to create form", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (formId: string) => {
      await apiRequest("DELETE", `/api/cms/forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", activeSite?.id, "forms"] });
      toast({ title: "Form deleted" });
    },
    onError: () => toast({ title: "Failed to delete form", variant: "destructive" }),
  });

  if (!activeSite) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground" data-testid="div-no-site">
        No site found. Create a site first.
      </div>
    );
  }

  if (view === "editor" && activeFormId) {
    return (
      <FormEditor
        formId={activeFormId}
        siteId={activeSite.id}
        onBack={() => { setView("list"); setActiveFormId(null); }}
        onViewSubmissions={() => setView("submissions")}
      />
    );
  }

  if (view === "submissions" && activeFormId) {
    return (
      <SubmissionsViewer
        formId={activeFormId}
        onBack={() => setView("editor")}
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">Build and manage forms for {activeSite.name}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-form">
          <Plus className="h-4 w-4 mr-1.5" /> New Form
        </Button>
      </div>

      {formsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !formsList || formsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-empty-state">No forms yet. Create your first form to start collecting submissions.</p>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-form-empty">
              <Plus className="h-4 w-4 mr-1.5" /> Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {formsList.map((form) => (
            <Card key={form.id} className="hover-elevate">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => { setActiveFormId(form.id); setView("editor"); }}
                  data-testid={`card-form-${form.id}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate" data-testid={`text-form-name-${form.id}`}>{form.name}</span>
                    <Badge variant={form.isActive ? "default" : "secondary"} data-testid={`badge-form-status-${form.id}`}>
                      {form.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {((form.fieldsJson as unknown[]) || []).length} fields
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ID: {form.id.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { setActiveFormId(form.id); setView("submissions"); }}
                    data-testid={`button-view-submissions-${form.id}`}
                  >
                    <Inbox className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { setActiveFormId(form.id); setView("editor"); }}
                    data-testid={`button-edit-form-${form.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Delete this form and all its submissions?")) {
                        deleteMutation.mutate(form.id);
                      }
                    }}
                    data-testid={`button-delete-form-${form.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Form</DialogTitle>
            <DialogDescription>Give your new form a name.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              value={newFormName}
              onChange={(e) => setNewFormName(e.target.value)}
              placeholder="e.g., Contact Form"
              data-testid="input-form-name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFormName.trim()) createMutation.mutate({ name: newFormName.trim() });
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ name: newFormName.trim() })}
              disabled={!newFormName.trim() || createMutation.isPending}
              data-testid="button-save-form"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormEditor({
  formId,
  siteId,
  onBack,
  onViewSubmissions,
}: {
  formId: string;
  siteId: string;
  onBack: () => void;
  onViewSubmissions: () => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"fields" | "settings" | "preview">("fields");
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);

  const { data: form, isLoading } = useQuery<Form>({
    queryKey: ["/api/cms/forms", formId],
    queryFn: async () => {
      const res = await fetch(`/api/cms/forms/${formId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load form");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/cms/forms/${formId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/forms", formId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", siteId, "forms"] });
      toast({ title: "Form saved" });
    },
    onError: () => toast({ title: "Failed to save form", variant: "destructive" }),
  });

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const fields: FormField[] = (form.fieldsJson as FormField[]) || [];
  const settings: FormSettings = (form.settingsJson as FormSettings) || {};

  const saveFields = (newFields: FormField[]) => {
    updateMutation.mutate({ fieldsJson: newFields });
  };

  const saveSettings = (newSettings: FormSettings) => {
    updateMutation.mutate({ settingsJson: newSettings });
  };

  const addField = (field: FormField) => {
    saveFields([...fields, field]);
    setShowFieldDialog(false);
    setEditingField(null);
  };

  const updateField = (updated: FormField) => {
    saveFields(fields.map((f) => (f.id === updated.id ? updated : f)));
    setShowFieldDialog(false);
    setEditingField(null);
  };

  const removeField = (fieldId: string) => {
    saveFields(fields.filter((f) => f.id !== fieldId));
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const newFields = [...fields];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newFields.length) return;
    [newFields[idx], newFields[targetIdx]] = [newFields[targetIdx], newFields[idx]];
    saveFields(newFields);
  };

  const copyEmbedCode = () => {
    const code = `<iframe src="${window.location.origin}/api/cms/public/forms/${formId}/embed" style="width:100%;min-height:400px;border:none"></iframe>`;
    navigator.clipboard.writeText(code);
    toast({ title: "Embed code copied" });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-list">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate" data-testid="text-form-title">{form.name}</h1>
          <p className="text-xs text-muted-foreground">Form ID: {form.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="form-active" className="text-sm">Active</Label>
            <Switch
              id="form-active"
              checked={form.isActive}
              onCheckedChange={(val) => updateMutation.mutate({ isActive: val })}
              data-testid="switch-form-active"
            />
          </div>
          <Button variant="outline" size="sm" onClick={onViewSubmissions} data-testid="button-view-submissions">
            <Inbox className="h-4 w-4 mr-1.5" /> Submissions
          </Button>
          <Button variant="outline" size="sm" onClick={copyEmbedCode} data-testid="button-copy-embed">
            <Copy className="h-4 w-4 mr-1.5" /> Embed
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b">
        {(["fields", "settings", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "fields" && (
        <FieldsEditor
          fields={fields}
          onAddField={() => { setEditingField(null); setShowFieldDialog(true); }}
          onEditField={(f) => { setEditingField(f); setShowFieldDialog(true); }}
          onRemoveField={removeField}
          onMoveField={moveField}
        />
      )}

      {activeTab === "settings" && (
        <SettingsEditor settings={settings} onSave={saveSettings} />
      )}

      {activeTab === "preview" && (
        <FormPreview fields={fields} settings={settings} />
      )}

      <FieldDialog
        open={showFieldDialog}
        onOpenChange={setShowFieldDialog}
        field={editingField}
        onSave={(f) => (editingField ? updateField(f) : addField(f))}
      />
    </div>
  );
}

function FieldsEditor({
  fields,
  onAddField,
  onEditField,
  onRemoveField,
  onMoveField,
}: {
  fields: FormField[];
  onAddField: () => void;
  onEditField: (f: FormField) => void;
  onRemoveField: (id: string) => void;
  onMoveField: (idx: number, dir: -1 | 1) => void;
}) {
  return (
    <div>
      {fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-no-fields">No fields yet. Add your first field.</p>
            <Button onClick={onAddField} data-testid="button-add-first-field">
              <Plus className="h-4 w-4 mr-1.5" /> Add Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <Card key={field.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm" data-testid={`text-field-label-${field.id}`}>{field.label}</span>
                    <Badge variant="secondary" data-testid={`badge-field-type-${field.id}`}>
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
                    </Badge>
                    {field.required && <Badge variant="outline">Required</Badge>}
                  </div>
                  {field.placeholder && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">Placeholder: {field.placeholder}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" onClick={() => onMoveField(idx, -1)} disabled={idx === 0} data-testid={`button-move-up-${field.id}`}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onMoveField(idx, 1)} disabled={idx === fields.length - 1} data-testid={`button-move-down-${field.id}`}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onEditField(field)} data-testid={`button-edit-field-${field.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onRemoveField(field.id)} data-testid={`button-remove-field-${field.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={onAddField} variant="outline" className="w-full" data-testid="button-add-field">
            <Plus className="h-4 w-4 mr-1.5" /> Add Field
          </Button>
        </div>
      )}
    </div>
  );
}

function FieldDialog({
  open,
  onOpenChange,
  field,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
}) {
  const [type, setType] = useState<string>(field?.type || "text");
  const [label, setLabel] = useState(field?.label || "");
  const [placeholder, setPlaceholder] = useState(field?.placeholder || "");
  const [required, setRequired] = useState(field?.required || false);
  const [options, setOptions] = useState(field?.options?.join("\n") || "");

  const needsOptions = type === "select" || type === "radio";

  const handleSave = () => {
    if (!label.trim()) return;
    const f: FormField = {
      id: field?.id || generateFieldId(),
      type: type as FormField["type"],
      label: label.trim(),
      placeholder: placeholder.trim() || undefined,
      required,
      options: needsOptions ? options.split("\n").map((o) => o.trim()).filter(Boolean) : undefined,
    };
    onSave(f);
    setType("text");
    setLabel("");
    setPlaceholder("");
    setRequired(false);
    setOptions("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && field) {
      setType(field.type);
      setLabel(field.label);
      setPlaceholder(field.placeholder || "");
      setRequired(field.required || false);
      setOptions(field.options?.join("\n") || "");
    } else if (newOpen) {
      setType("text");
      setLabel("");
      setPlaceholder("");
      setRequired(false);
      setOptions("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{field ? "Edit Field" : "Add Field"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Field Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Full Name"
              data-testid="input-field-label"
            />
          </div>
          <div>
            <Label>Placeholder</Label>
            <Input
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Optional placeholder text"
              data-testid="input-field-placeholder"
            />
          </div>
          {needsOptions && (
            <div>
              <Label>Options (one per line)</Label>
              <Textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder={"Option 1\nOption 2\nOption 3"}
                rows={4}
                data-testid="textarea-field-options"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch
              checked={required}
              onCheckedChange={setRequired}
              id="field-required"
              data-testid="switch-field-required"
            />
            <Label htmlFor="field-required">Required</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-field">Cancel</Button>
          <Button onClick={handleSave} disabled={!label.trim()} data-testid="button-save-field">
            {field ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsEditor({
  settings,
  onSave,
}: {
  settings: FormSettings;
  onSave: (s: FormSettings) => void;
}) {
  const [emails, setEmails] = useState((settings.notifyEmails || []).join(", "));
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || "");
  const [submitLabel, setSubmitLabel] = useState(settings.submitLabel || "Submit");
  const [successMessage, setSuccessMessage] = useState(settings.successMessage || "Thank you for your submission!");
  const [honeypotEnabled, setHoneypotEnabled] = useState(settings.honeypotEnabled ?? true);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(settings.rateLimitPerMinute ?? 10);

  const handleSave = () => {
    const parsed: FormSettings = {
      notifyEmails: emails.split(",").map((e) => e.trim()).filter(Boolean),
      webhookUrl: webhookUrl.trim() || "",
      submitLabel: submitLabel.trim() || "Submit",
      successMessage: successMessage.trim() || "Thank you for your submission!",
      honeypotEnabled,
      rateLimitPerMinute: Math.max(1, Math.min(120, rateLimitPerMinute)),
    };
    onSave(parsed);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Submit Button Label</Label>
            <Input
              value={submitLabel}
              onChange={(e) => setSubmitLabel(e.target.value)}
              placeholder="Submit"
              data-testid="input-submit-label"
            />
          </div>
          <div>
            <Label>Success Message</Label>
            <Textarea
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              placeholder="Thank you!"
              rows={2}
              data-testid="textarea-success-message"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notification Emails (comma-separated)</Label>
            <Input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="admin@example.com, team@example.com"
              data-testid="input-notify-emails"
            />
            <p className="text-xs text-muted-foreground mt-1">Receive an email when a submission is received.</p>
          </div>
          <div>
            <Label>Webhook URL</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.example.com/form-submit"
              data-testid="input-webhook-url"
            />
            <p className="text-xs text-muted-foreground mt-1">POST submission data to this URL.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spam Protection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={honeypotEnabled}
              onCheckedChange={setHoneypotEnabled}
              id="honeypot"
              data-testid="switch-honeypot"
            />
            <Label htmlFor="honeypot">Honeypot field (catches bots)</Label>
          </div>
          <div>
            <Label>Rate limit (submissions per minute per IP)</Label>
            <Input
              type="number"
              value={rateLimitPerMinute}
              onChange={(e) => setRateLimitPerMinute(parseInt(e.target.value) || 10)}
              min={1}
              max={120}
              data-testid="input-rate-limit"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} data-testid="button-save-settings">
        Save Settings
      </Button>
    </div>
  );
}

function FormPreview({
  fields,
  settings,
}: {
  fields: FormField[];
  settings: FormSettings;
}) {
  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Eye className="h-8 w-8 mb-2" />
          <p className="text-sm" data-testid="text-preview-empty">Add fields to see a preview of your form.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="p-6 space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <Label className="mb-1.5 block">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.type === "text" && <Input placeholder={field.placeholder} disabled data-testid={`preview-field-${field.id}`} />}
            {field.type === "email" && <Input type="email" placeholder={field.placeholder || "email@example.com"} disabled data-testid={`preview-field-${field.id}`} />}
            {field.type === "phone" && <Input type="tel" placeholder={field.placeholder || "+1 (555) 000-0000"} disabled data-testid={`preview-field-${field.id}`} />}
            {field.type === "date" && <Input type="date" disabled data-testid={`preview-field-${field.id}`} />}
            {field.type === "textarea" && <Textarea placeholder={field.placeholder} disabled rows={3} data-testid={`preview-field-${field.id}`} />}
            {field.type === "select" && (
              <Select disabled>
                <SelectTrigger data-testid={`preview-field-${field.id}`}>
                  <SelectValue placeholder={field.placeholder || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options || []).map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === "checkbox" && (
              <div className="flex items-center gap-2" data-testid={`preview-field-${field.id}`}>
                <input type="checkbox" disabled className="h-4 w-4 rounded border-input" />
                <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
              </div>
            )}
            {field.type === "radio" && (
              <div className="space-y-1" data-testid={`preview-field-${field.id}`}>
                {(field.options || []).map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <input type="radio" disabled name={field.id} className="h-4 w-4" />
                    <span className="text-sm">{opt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <Button disabled className="w-full" data-testid="preview-submit-button">
          {settings.submitLabel || "Submit"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SubmissionsViewer({
  formId,
  onBack,
}: {
  formId: string;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data: form } = useQuery<Form>({
    queryKey: ["/api/cms/forms", formId],
    queryFn: async () => {
      const res = await fetch(`/api/cms/forms/${formId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data, isLoading } = useQuery<{ submissions: FormSubmission[]; total: number }>({
    queryKey: ["/api/cms/forms", formId, "submissions", page],
    queryFn: async () => {
      const res = await fetch(
        `/api/cms/forms/${formId}/submissions?limit=${pageSize}&offset=${page * pageSize}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subId: string) => {
      await apiRequest("DELETE", `/api/cms/forms/${formId}/submissions/${subId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/forms", formId, "submissions", page] });
      toast({ title: "Submission deleted" });
    },
  });

  const fields: FormField[] = (form?.fieldsJson as FormField[]) || [];
  const submissions = data?.submissions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-editor">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold" data-testid="text-submissions-title">Submissions</h1>
          <p className="text-sm text-muted-foreground">{form?.name} — {total} total</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground" data-testid="text-no-submissions">No submissions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  {fields.slice(0, 5).map((f) => (
                    <TableHead key={f.id}>{f.label}</TableHead>
                  ))}
                  {fields.length > 5 && <TableHead>...</TableHead>}
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => {
                  const payload = (sub.payloadJson || {}) as Record<string, unknown>;
                  return (
                    <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "—"}
                      </TableCell>
                      {fields.slice(0, 5).map((f) => (
                        <TableCell key={f.id} className="text-sm max-w-[200px] truncate">
                          {String(payload[f.id] ?? payload[f.label] ?? "—")}
                        </TableCell>
                      ))}
                      {fields.length > 5 && (
                        <TableCell className="text-xs text-muted-foreground">+{fields.length - 5} more</TableCell>
                      )}
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this submission?")) deleteMutation.mutate(sub.id);
                          }}
                          data-testid={`button-delete-submission-${sub.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground" data-testid="text-page-info">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
