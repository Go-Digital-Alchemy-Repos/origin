import { Router } from "express";
import { formsService } from "./forms.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { z } from "zod";
import { formFieldSchema, formSettingsSchema } from "@shared/schema";
import { crmService } from "../apps/crm/crm.service";
import crypto from "crypto";

const createFormBody = z.object({
  name: z.string().min(1),
  fieldsJson: z.array(formFieldSchema).optional(),
  settingsJson: formSettingsSchema.optional(),
});

const updateFormBody = z.object({
  name: z.string().min(1).optional(),
  fieldsJson: z.array(formFieldSchema).optional(),
  settingsJson: formSettingsSchema.optional(),
  isActive: z.boolean().optional(),
});

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function formsRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/forms",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const formsList = await formsService.getFormsBySite(req.params.siteId, workspaceId);
        res.json(formsList);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/forms",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(createFormBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const form = await formsService.createForm({
          name: req.body.name,
          siteId: req.params.siteId,
          workspaceId,
          fieldsJson: req.body.fieldsJson ?? [],
          settingsJson: req.body.settingsJson ?? {},
        });
        res.status(201).json(form);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/forms/:formId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const form = await formsService.getFormForWorkspace(req.params.formId, workspaceId);
        if (!form) return res.status(404).json({ error: { message: "Form not found", code: "NOT_FOUND" } });
        res.json(form);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/forms/:formId",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(updateFormBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const form = await formsService.getFormForWorkspace(req.params.formId, workspaceId);
        if (!form) return res.status(404).json({ error: { message: "Form not found", code: "NOT_FOUND" } });
        const updated = await formsService.updateForm(req.params.formId, req.body);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/forms/:formId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const form = await formsService.getFormForWorkspace(req.params.formId, workspaceId);
        if (!form) return res.status(404).json({ error: { message: "Form not found", code: "NOT_FOUND" } });
        await formsService.deleteForm(req.params.formId);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/forms/:formId/submissions",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const form = await formsService.getFormForWorkspace(req.params.formId, workspaceId);
        if (!form) return res.status(404).json({ error: { message: "Form not found", code: "NOT_FOUND" } });

        const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
        const offset = parseInt(req.query.offset as string) || 0;
        const result = await formsService.getSubmissions(req.params.formId, limit, offset);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/forms/:formId/submissions/:submissionId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const form = await formsService.getFormForWorkspace(req.params.formId, workspaceId);
        if (!form) return res.status(404).json({ error: { message: "Form not found", code: "NOT_FOUND" } });
        await formsService.deleteSubmission(req.params.submissionId);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post("/public/forms/:formId/submit", async (req, res, next) => {
    try {
      const form = await formsService.getForm(req.params.formId);
      if (!form || !form.isActive) {
        return res.status(404).json({ error: { message: "Form not found or inactive", code: "NOT_FOUND" } });
      }

      const settings = (form.settingsJson || {}) as Record<string, unknown>;

      if (settings.honeypotEnabled && req.body._hp_field) {
        return res.json({ success: true, message: settings.successMessage || "Thank you!" });
      }

      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
      const ipHashed = hashIp(clientIp);

      const rateLimit = (settings.rateLimitPerMinute as number) || 10;
      const allowed = await formsService.checkRateLimit(req.params.formId, ipHashed, rateLimit);
      if (!allowed) {
        return res.status(429).json({ error: { message: "Too many submissions. Please try again later.", code: "RATE_LIMITED" } });
      }

      const { _hp_field, ...rawPayload } = req.body;

      const formFields = (form.fieldsJson as Array<{ id: string }>) || [];
      const validFieldIds = new Set(formFields.map((f) => f.id));
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rawPayload)) {
        if (validFieldIds.has(key)) {
          payload[key] = typeof value === "string" ? value.slice(0, 10000) : String(value).slice(0, 10000);
        }
      }

      const userAgent = (req.headers["user-agent"] || "").toString();

      const submission = await formsService.submitForm(
        req.params.formId,
        payload,
        clientIp,
        userAgent,
      );

      if (settings.webhookUrl && typeof settings.webhookUrl === "string" && settings.webhookUrl.length > 0) {
        fetch(settings.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: form.id,
            formName: form.name,
            submissionId: submission.id,
            payload,
            submittedAt: submission.createdAt,
          }),
        }).catch(() => {});
      }

      const mapping = form.crmLeadMapping as { nameField?: string; emailField?: string } | null;
      if (mapping && mapping.nameField && mapping.emailField) {
        crmService.createLeadFromFormSubmission(
          form.workspaceId,
          form.siteId,
          { nameField: mapping.nameField, emailField: mapping.emailField },
          payload,
        ).catch(() => {});
      }

      res.json({
        success: true,
        submissionId: submission.id,
        message: (settings.successMessage as string) || "Thank you for your submission!",
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/public/forms/:formId/definition", async (req, res, next) => {
    try {
      const form = await formsService.getForm(req.params.formId);
      if (!form || !form.isActive) {
        return res.status(404).json({ error: { message: "Form not found", code: "NOT_FOUND" } });
      }
      res.json({
        id: form.id,
        name: form.name,
        fields: form.fieldsJson,
        settings: {
          submitLabel: (form.settingsJson as any)?.submitLabel || "Submit",
          successMessage: (form.settingsJson as any)?.successMessage || "Thank you!",
          honeypotEnabled: (form.settingsJson as any)?.honeypotEnabled ?? true,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
