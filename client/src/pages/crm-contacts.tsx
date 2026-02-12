import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Mail,
  Phone,
  StickyNote,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import type { CrmContact, CrmNote } from "@shared/schema";
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

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const noteFormSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

function formatDate(d: string | Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CrmContactsPage() {
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery<CrmContact[]>({
    queryKey: ["/api/crm/contacts"],
  });

  const notesContactId = selectedContact?.id;
  const { data: notes } = useQuery<CrmNote[]>({
    queryKey: [`/api/crm/notes?contactId=${notesContactId}`],
    enabled: !!notesContactId,
  });

  const createForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const editForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const noteForm = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { content: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const res = await apiRequest("POST", "/api/crm/contacts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Contact Created" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const res = await apiRequest("PATCH", `/api/crm/contacts/${selectedContact!.id}`, data);
      return res.json();
    },
    onSuccess: (updated: CrmContact) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      setShowEditDialog(false);
      setSelectedContact(updated);
      toast({ title: "Updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/crm/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      setSelectedContact(null);
      toast({ title: "Deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiRequest("POST", "/api/crm/notes", { ...data, contactId: selectedContact!.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/notes?contactId=${selectedContact?.id}`] });
      noteForm.reset();
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/crm/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/notes?contactId=${selectedContact?.id}`] });
    },
  });

  if (selectedContact) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)} data-testid="button-back-to-contacts">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Contacts
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold" data-testid="text-contact-name">{selectedContact.name}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span data-testid="text-contact-email">{selectedContact.email}</span>
                  </div>
                  {selectedContact.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <span data-testid="text-contact-phone">{selectedContact.phone}</span>
                    </div>
                  )}
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
                    <FormField control={noteForm.control} name="content" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl><Input {...field} placeholder="Add a note..." data-testid="input-contact-note" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={addNoteMutation.isPending} data-testid="button-add-contact-note">
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
                      <div key={note.id} className="flex items-start justify-between gap-2 border rounded-md p-3" data-testid={`contact-note-${note.id}`}>
                        <div>
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(note.createdAt)}</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteNoteMutation.mutate(note.id)}>
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
                    editForm.reset({ name: selectedContact.name, email: selectedContact.email, phone: selectedContact.phone || "" });
                    setShowEditDialog(true);
                  }}
                  data-testid="button-edit-contact"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Contact
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(selectedContact.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-contact"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Details</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDate(selectedContact.createdAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>Update contact information.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} data-testid="input-edit-contact-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} data-testid="input-edit-contact-email" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="Optional" data-testid="input-edit-contact-phone" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-contact">
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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-contacts-title">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your converted leads and manual contacts.</p>
        </div>
        <Button onClick={() => { createForm.reset({ name: "", email: "", phone: "" }); setShowCreateDialog(true); }} data-testid="button-create-contact">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
      ) : !contacts || contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No contacts yet. Add contacts manually or convert leads.</p>
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
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedContact(contact)}
                    data-testid={`row-contact-${contact.id}`}
                  >
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell className="text-muted-foreground">{contact.phone || "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(contact.createdAt)}</TableCell>
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
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Create a new contact.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField control={createForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="Jane Smith" data-testid="input-create-contact-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="jane@example.com" data-testid="input-create-contact-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="Optional" data-testid="input-create-contact-phone" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-contact">
                  {createMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
