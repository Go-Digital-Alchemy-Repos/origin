import { crmRepo } from "./crm.repo";
import { NotFoundError, ValidationError } from "../../shared/errors";
import type { InsertCrmLead, InsertCrmContact, InsertCrmNote } from "@shared/schema";

export const crmService = {
  async getLeads(workspaceId: string) {
    return crmRepo.findLeads(workspaceId);
  },

  async getLead(id: string, workspaceId: string) {
    const lead = await crmRepo.findLeadById(id);
    if (!lead || lead.workspaceId !== workspaceId) throw new NotFoundError("Lead");
    return lead;
  },

  async createLead(data: InsertCrmLead) {
    return crmRepo.createLead(data);
  },

  async updateLead(id: string, workspaceId: string, data: Partial<InsertCrmLead>) {
    const lead = await crmRepo.findLeadById(id);
    if (!lead || lead.workspaceId !== workspaceId) throw new NotFoundError("Lead");
    return crmRepo.updateLead(id, data);
  },

  async deleteLead(id: string, workspaceId: string) {
    const lead = await crmRepo.findLeadById(id);
    if (!lead || lead.workspaceId !== workspaceId) throw new NotFoundError("Lead");
    return crmRepo.deleteLead(id);
  },

  async getContacts(workspaceId: string) {
    return crmRepo.findContacts(workspaceId);
  },

  async getContact(id: string, workspaceId: string) {
    const contact = await crmRepo.findContactById(id);
    if (!contact || contact.workspaceId !== workspaceId) throw new NotFoundError("Contact");
    return contact;
  },

  async createContact(data: InsertCrmContact) {
    return crmRepo.createContact(data);
  },

  async updateContact(id: string, workspaceId: string, data: Partial<InsertCrmContact>) {
    const contact = await crmRepo.findContactById(id);
    if (!contact || contact.workspaceId !== workspaceId) throw new NotFoundError("Contact");
    return crmRepo.updateContact(id, data);
  },

  async deleteContact(id: string, workspaceId: string) {
    const contact = await crmRepo.findContactById(id);
    if (!contact || contact.workspaceId !== workspaceId) throw new NotFoundError("Contact");
    return crmRepo.deleteContact(id);
  },

  async convertLeadToContact(leadId: string, workspaceId: string) {
    const lead = await crmRepo.findLeadById(leadId);
    if (!lead || lead.workspaceId !== workspaceId) throw new NotFoundError("Lead");

    const contact = await crmRepo.createContact({
      workspaceId: lead.workspaceId,
      name: lead.name,
      email: lead.email,
    });

    await crmRepo.updateLead(leadId, { status: "converted" });

    return contact;
  },

  async createLeadFromFormSubmission(
    workspaceId: string,
    siteId: string,
    mapping: { nameField: string; emailField: string },
    payload: Record<string, unknown>,
  ) {
    const name = String(payload[mapping.nameField] || "Unknown");
    const email = String(payload[mapping.emailField] || "");
    if (!email) return null;

    return crmRepo.createLead({
      workspaceId,
      siteId,
      name,
      email,
      source: "form",
      status: "new",
    });
  },

  async getNotes(opts: { leadId?: string; contactId?: string }) {
    return crmRepo.findNotes(opts);
  },

  async addNote(data: InsertCrmNote) {
    if (!data.leadId && !data.contactId) {
      throw new ValidationError("Note must be associated with a lead or contact");
    }
    return crmRepo.createNote(data);
  },

  async deleteNote(id: string) {
    const note = await crmRepo.deleteNote(id);
    if (!note) throw new NotFoundError("Note");
    return note;
  },
};
