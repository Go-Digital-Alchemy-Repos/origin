import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UserPlus,
  Mail,
  StickyNote,
  ArrowLeft,
} from "lucide-react";
import type { CrmLead, CrmNote } from "@shared/schema";
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

const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  source: z.string().default("manual"),
  status: z.string().default("new"),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const noteFormSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

const statusColors: Record<string, string> = {
  new: "default",
  contacted: "secondary",
  qualified: "default",
  converted: "outline",
  lost: "destructive",
};

function formatDate(d: string | Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CrmLeadsPage() {
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const { data: leads, isLoading } = useQuery<CrmLead[]>({
    queryKey: ["/api/crm/leads"],
  });

  const notesLeadId = selectedLead?.id;
  const { data: notes } = useQuery<CrmNote[]>({
    queryKey: [`/api/crm/notes?leadId=${notesLeadId}`],
    enabled: !!notesLeadId,
  });

  const createForm = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: "", email: "", source: "manual", status: "new" },
  });

  const editForm = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: "", email: "", source: "manual", status: "new" },
  });

  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { content: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      const res = await apiRequest("POST", "/api/crm/leads", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Lead Created", description: "New lead added." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      const res = await apiRequest("PATCH", `/api/crm/leads/${selectedLead!.id}`, data);
      return res.json();
    },
    onSuccess: (updated: CrmLead) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      setShowEditDialog(false);
      setSelectedLead(updated);
      toast({ title: "Updated", description: "Lead updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/crm/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      setSelectedLead(null);
      toast({ title: "Deleted", description: "Lead removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/crm/leads/${id}/convert`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      setSelectedLead(null);
      toast({ title: "Converted", description: "Lead converted to contact." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiRequest("POST", "/api/crm/notes", { ...data, leadId: selectedLead!.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/notes?leadId=${selectedLead?.id}`] });
      noteForm.reset();
      toast({ title: "Note Added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/crm/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/notes?leadId=${selectedLead?.id}`] });
    },
  });

  if (selectedLead) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)} data-testid="button-back-to-leads">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Leads
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold" data-testid="text-lead-name">{selectedLead.name}</h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span data-testid="text-lead-email">{selectedLead.email}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusColors[selectedLead.status] as any || "outline"} data-testid="badge-lead-status">
                      {selectedLead.status}
                    </Badge>
                    <Badge variant="outline">{selectedLead.source}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3">Notes</h2>
                <Form {...noteForm}>
                  <form
                    onSubmit={noteForm.handleSubmit((data) => addNoteMutation.mutate(data))}
                    className="flex gap-2 mb-4"
                  >
                    <FormField
                      control={noteForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Add a note..." data-testid="input-note-content" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={addNoteMutation.isPending} data-testid="button-add-note">
                      <StickyNote className="mr-1.5 h-3.5 w-3.5" />
                      Add
                    </Button>
                  </form>
                </Form>
                {!notes || notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="flex items-start justify-between gap-2 border rounded-md p-3" data-testid={`note-row-${note.id}`}>
                        <div>
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(note.createdAt)}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          data-testid={`button-delete-note-${note.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
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
                    editForm.reset({
                      name: selectedLead.name,
                      email: selectedLead.email,
                      source: selectedLead.source,
                      status: selectedLead.status,
                    });
                    setShowEditDialog(true);
                  }}
                  data-testid="button-edit-lead"
                >
                  Edit Lead
                </Button>

                {selectedLead.status !== "converted" && (
                  <Button
                    className="w-full"
                    onClick={() => convertMutation.mutate(selectedLead.id)}
                    disabled={convertMutation.isPending}
                    data-testid="button-convert-lead"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {convertMutation.isPending ? "Converting..." : "Convert to Contact"}
                  </Button>
                )}

                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(selectedLead.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-lead"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Lead
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Details</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd>{selectedLead.source}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="capitalize">{selectedLead.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDate(selectedLead.createdAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>Update lead information.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} data-testid="input-edit-lead-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} data-testid="input-edit-lead-email" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-edit-lead-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-lead">
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-leads-title">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and manage potential customers.</p>
        </div>
        <Button onClick={() => { createForm.reset({ name: "", email: "", source: "manual", status: "new" }); setShowCreateDialog(true); }} data-testid="button-create-lead">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
      ) : !leads || leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No leads yet. Add your first lead or connect a form to automatically capture leads.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                    data-testid={`row-lead-${lead.id}`}
                  >
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{lead.source}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={statusColors[lead.status] as any || "outline"} className="text-xs">
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(lead.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>Create a new lead to track.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField control={createForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="John Doe" data-testid="input-create-lead-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="john@example.com" data-testid="input-create-lead-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-create-lead-source"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-lead">
                  {createMutation.isPending ? "Adding..." : "Add Lead"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
