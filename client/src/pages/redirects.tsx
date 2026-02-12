import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowRightLeft,
  Upload,
  ArrowRight,
  Lightbulb,
  Check,
  X,
} from "lucide-react";
import type { Redirect, RedirectSuggestion } from "@shared/schema";

export default function RedirectsPage() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);

  const { data: sitesList } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/user/sites"],
  });

  const activeSite = sitesList?.[0];

  const { data: redirectsList, isLoading } = useQuery<Redirect[]>({
    queryKey: [`/api/cms/sites/${activeSite?.id}/redirects`],
    enabled: !!activeSite?.id,
  });

  const { data: suggestions } = useQuery<RedirectSuggestion[]>({
    queryKey: [`/api/cms/sites/${activeSite?.id}/redirect-suggestions`],
    enabled: !!activeSite?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cms/redirects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${activeSite?.id}/redirects`] });
      toast({ title: "Redirect deleted" });
    },
    onError: () => toast({ title: "Failed to delete redirect", variant: "destructive" }),
  });

  const acceptSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/cms/redirect-suggestions/${id}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${activeSite?.id}/redirects`] });
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${activeSite?.id}/redirect-suggestions`] });
      toast({ title: "Suggestion accepted" });
    },
    onError: () => toast({ title: "Failed to accept suggestion", variant: "destructive" }),
  });

  const dismissSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cms/redirect-suggestions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${activeSite?.id}/redirect-suggestions`] });
      toast({ title: "Suggestion dismissed" });
    },
    onError: () => toast({ title: "Failed to dismiss suggestion", variant: "destructive" }),
  });

  if (!activeSite) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground" data-testid="div-no-site">
        No site found. Create a site first.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Redirects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage URL redirects for {activeSite.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)} data-testid="button-import-csv">
            <Upload className="h-4 w-4 mr-1.5" /> Import CSV
          </Button>
          <Button onClick={() => { setEditingRedirect(null); setShowCreateDialog(true); }} data-testid="button-create-redirect">
            <Plus className="h-4 w-4 mr-1.5" /> Add Redirect
          </Button>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm">Suggested Redirects</span>
              <Badge variant="secondary">{suggestions.length}</Badge>
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm" data-testid={`suggestion-${s.id}`}>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs flex-1 min-w-0 truncate">{s.fromPath}</code>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <code className="bg-muted px-2 py-0.5 rounded text-xs flex-1 min-w-0 truncate">{s.toUrl}</code>
                  <Badge variant="outline" className="shrink-0">{s.source}</Badge>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => acceptSuggestionMutation.mutate(s.id)}
                      disabled={acceptSuggestionMutation.isPending}
                      data-testid={`button-accept-suggestion-${s.id}`}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => dismissSuggestionMutation.mutate(s.id)}
                      disabled={dismissSuggestionMutation.isPending}
                      data-testid={`button-dismiss-suggestion-${s.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !redirectsList || redirectsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowRightLeft className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-empty-state">
              No redirects yet. Add redirects to manage SEO-safe URL changes.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(true)} data-testid="button-import-csv-empty">
                <Upload className="h-4 w-4 mr-1.5" /> Import CSV
              </Button>
              <Button onClick={() => { setEditingRedirect(null); setShowCreateDialog(true); }} data-testid="button-create-redirect-empty">
                <Plus className="h-4 w-4 mr-1.5" /> Add Redirect
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From Path</TableHead>
                <TableHead>To URL</TableHead>
                <TableHead className="w-[80px]">Code</TableHead>
                <TableHead className="w-[100px]">Created</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {redirectsList.map((r) => (
                <TableRow key={r.id} data-testid={`row-redirect-${r.id}`}>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded" data-testid={`text-from-path-${r.id}`}>{r.fromPath}</code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm truncate block max-w-[300px]" data-testid={`text-to-url-${r.id}`}>{r.toUrl}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.code === 301 ? "default" : "secondary"} data-testid={`badge-code-${r.id}`}>
                      {r.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingRedirect(r); setShowCreateDialog(true); }}
                        data-testid={`button-edit-redirect-${r.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this redirect?")) {
                            deleteMutation.mutate(r.id);
                          }
                        }}
                        data-testid={`button-delete-redirect-${r.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <RedirectDialog
        open={showCreateDialog}
        onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setEditingRedirect(null); }}
        redirect={editingRedirect}
        siteId={activeSite.id}
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        siteId={activeSite.id}
      />
    </div>
  );
}

function RedirectDialog({
  open,
  onOpenChange,
  redirect,
  siteId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirect: Redirect | null;
  siteId: string;
}) {
  const { toast } = useToast();
  const [fromPath, setFromPath] = useState(redirect?.fromPath || "");
  const [toUrl, setToUrl] = useState(redirect?.toUrl || "");
  const [code, setCode] = useState(String(redirect?.code || 301));

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFromPath(redirect?.fromPath || "");
      setToUrl(redirect?.toUrl || "");
      setCode(String(redirect?.code || 301));
    }
    onOpenChange(newOpen);
  };

  const createMutation = useMutation({
    mutationFn: async (data: { fromPath: string; toUrl: string; code: number }) => {
      const res = await apiRequest("POST", `/api/cms/sites/${siteId}/redirects`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${siteId}/redirects`] });
      onOpenChange(false);
      toast({ title: "Redirect created" });
    },
    onError: () => toast({ title: "Failed to create redirect", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { fromPath: string; toUrl: string; code: number }) => {
      const res = await apiRequest("PATCH", `/api/cms/redirects/${redirect!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${siteId}/redirects`] });
      onOpenChange(false);
      toast({ title: "Redirect updated" });
    },
    onError: () => toast({ title: "Failed to update redirect", variant: "destructive" }),
  });

  const handleSave = () => {
    if (!fromPath.trim() || !toUrl.trim()) return;
    const data = { fromPath: fromPath.trim(), toUrl: toUrl.trim(), code: parseInt(code) };
    if (redirect) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{redirect ? "Edit Redirect" : "Add Redirect"}</DialogTitle>
          <DialogDescription>
            {redirect ? "Update this redirect rule." : "Create a new URL redirect for your site."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>From Path</Label>
            <Input
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="/old-page"
              data-testid="input-from-path"
            />
            <p className="text-xs text-muted-foreground mt-1">The path on your site that should redirect (e.g., /old-page)</p>
          </div>
          <div>
            <Label>To URL</Label>
            <Input
              value={toUrl}
              onChange={(e) => setToUrl(e.target.value)}
              placeholder="/new-page or https://example.com/page"
              data-testid="input-to-url"
            />
            <p className="text-xs text-muted-foreground mt-1">Where visitors should be sent</p>
          </div>
          <div>
            <Label>Status Code</Label>
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger data-testid="select-redirect-code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301 - Permanent</SelectItem>
                <SelectItem value="302">302 - Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-redirect">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!fromPath.trim() || !toUrl.trim() || isPending}
            data-testid="button-save-redirect"
          >
            {isPending ? "Saving..." : redirect ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  open,
  onOpenChange,
  siteId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
}) {
  const { toast } = useToast();
  const [csvText, setCsvText] = useState("");

  const importMutation = useMutation({
    mutationFn: async (csv: string) => {
      const res = await apiRequest("POST", `/api/cms/sites/${siteId}/redirects/import`, { csv });
      return res.json();
    },
    onSuccess: (data: { created: number; skipped: number }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${siteId}/redirects`] });
      onOpenChange(false);
      setCsvText("");
      toast({
        title: "Import complete",
        description: `${data.created} created, ${data.skipped} skipped (duplicates)`,
      });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" }),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Redirects from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste CSV content. Format: from_path, to_url, code (optional).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Upload CSV File</Label>
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              data-testid="input-csv-file"
            />
          </div>
          <div>
            <Label>Or paste CSV content</Label>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"/old-page, /new-page, 301\n/blog/old-post, /blog/new-post, 301"}
              rows={8}
              data-testid="textarea-csv-content"
            />
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">CSV Format:</p>
            <code>from_path, to_url, code</code>
            <p className="mt-1">Header row is optional. Code defaults to 301 if not specified. Max 1000 rows per import. Duplicate paths are skipped.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-import">Cancel</Button>
          <Button
            onClick={() => importMutation.mutate(csvText)}
            disabled={!csvText.trim() || importMutation.isPending}
            data-testid="button-run-import"
          >
            {importMutation.isPending ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
