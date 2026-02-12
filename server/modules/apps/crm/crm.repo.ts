import { db } from "../../../db";
import { crmLeads, crmContacts, crmNotes } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertCrmLead, InsertCrmContact, InsertCrmNote } from "@shared/schema";

export const crmRepo = {
  async findLeads(workspaceId: string) {
    return db.select().from(crmLeads).where(eq(crmLeads.workspaceId, workspaceId)).orderBy(desc(crmLeads.createdAt));
  },

  async findLeadById(id: string) {
    const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
    return lead ?? null;
  },

  async createLead(data: InsertCrmLead) {
    const [lead] = await db.insert(crmLeads).values(data).returning();
    return lead;
  },

  async updateLead(id: string, data: Partial<InsertCrmLead>) {
    const [lead] = await db.update(crmLeads).set(data).where(eq(crmLeads.id, id)).returning();
    return lead ?? null;
  },

  async deleteLead(id: string) {
    const [lead] = await db.delete(crmLeads).where(eq(crmLeads.id, id)).returning();
    return lead ?? null;
  },

  async findContacts(workspaceId: string) {
    return db.select().from(crmContacts).where(eq(crmContacts.workspaceId, workspaceId)).orderBy(desc(crmContacts.createdAt));
  },

  async findContactById(id: string) {
    const [contact] = await db.select().from(crmContacts).where(eq(crmContacts.id, id));
    return contact ?? null;
  },

  async createContact(data: InsertCrmContact) {
    const [contact] = await db.insert(crmContacts).values(data).returning();
    return contact;
  },

  async updateContact(id: string, data: Partial<InsertCrmContact>) {
    const [contact] = await db.update(crmContacts).set(data).where(eq(crmContacts.id, id)).returning();
    return contact ?? null;
  },

  async deleteContact(id: string) {
    const [contact] = await db.delete(crmContacts).where(eq(crmContacts.id, id)).returning();
    return contact ?? null;
  },

  async findNotes(opts: { leadId?: string; contactId?: string }) {
    if (opts.leadId) {
      return db.select().from(crmNotes).where(eq(crmNotes.leadId, opts.leadId)).orderBy(desc(crmNotes.createdAt));
    }
    if (opts.contactId) {
      return db.select().from(crmNotes).where(eq(crmNotes.contactId, opts.contactId)).orderBy(desc(crmNotes.createdAt));
    }
    return [];
  },

  async createNote(data: InsertCrmNote) {
    const [note] = await db.insert(crmNotes).values(data).returning();
    return note;
  },

  async deleteNote(id: string) {
    const [note] = await db.delete(crmNotes).where(eq(crmNotes.id, id)).returning();
    return note ?? null;
  },
};
