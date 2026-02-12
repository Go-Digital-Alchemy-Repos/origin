import { Router } from "express";
import { z } from "zod";
import { crmService } from "./crm.service";
import { requireAuth, requireWorkspaceContext, requireEntitlement } from "../../shared/auth-middleware";
import { getWorkspaceId } from "../../shared/auth-middleware";
import { validateBody } from "../../shared/validate";

const createLeadBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  siteId: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  assignedUserId: z.string().optional(),
});

const updateLeadBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: z.string().optional(),
  assignedUserId: z.string().nullable().optional(),
});

const createContactBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const updateContactBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
});

const createNoteBody = z.object({
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  content: z.string().min(1),
});

export function crmRoutes(): Router {
  const router = Router();

  const gate = [requireAuth(), requireWorkspaceContext(), requireEntitlement("crm")];

  router.get("/leads", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const leads = await crmService.getLeads(workspaceId);
      res.json(leads);
    } catch (err) {
      next(err);
    }
  });

  router.get("/leads/:id", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const lead = await crmService.getLead(req.params.id, workspaceId);
      res.json(lead);
    } catch (err) {
      next(err);
    }
  });

  router.post("/leads", ...gate, validateBody(createLeadBody), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const lead = await crmService.createLead({ ...req.body, workspaceId });
      res.status(201).json(lead);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/leads/:id", ...gate, validateBody(updateLeadBody), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const lead = await crmService.updateLead(req.params.id, workspaceId, req.body);
      res.json(lead);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/leads/:id", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      await crmService.deleteLead(req.params.id, workspaceId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/leads/:id/convert", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const contact = await crmService.convertLeadToContact(req.params.id, workspaceId);
      res.status(201).json(contact);
    } catch (err) {
      next(err);
    }
  });

  router.get("/contacts", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const contacts = await crmService.getContacts(workspaceId);
      res.json(contacts);
    } catch (err) {
      next(err);
    }
  });

  router.get("/contacts/:id", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const contact = await crmService.getContact(req.params.id, workspaceId);
      res.json(contact);
    } catch (err) {
      next(err);
    }
  });

  router.post("/contacts", ...gate, validateBody(createContactBody), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const contact = await crmService.createContact({ ...req.body, workspaceId });
      res.status(201).json(contact);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/contacts/:id", ...gate, validateBody(updateContactBody), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const contact = await crmService.updateContact(req.params.id, workspaceId, req.body);
      res.json(contact);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/contacts/:id", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      await crmService.deleteContact(req.params.id, workspaceId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/notes", ...gate, async (req, res, next) => {
    try {
      const { leadId, contactId } = req.query;
      const notes = await crmService.getNotes({
        leadId: leadId as string | undefined,
        contactId: contactId as string | undefined,
      });
      res.json(notes);
    } catch (err) {
      next(err);
    }
  });

  router.post("/notes", ...gate, validateBody(createNoteBody), async (req, res, next) => {
    try {
      const note = await crmService.addNote(req.body);
      res.status(201).json(note);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/notes/:id", ...gate, async (req, res, next) => {
    try {
      await crmService.deleteNote(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
