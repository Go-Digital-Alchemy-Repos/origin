import { Router } from "express";
import { migrationService } from "./migration.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { z } from "zod";

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

const wpImportBody = z.object({
  xmlContent: z.string().min(1, "XML content is required"),
  fileName: z.string().min(1, "File name is required"),
});

export function migrationRoutes(): Router {
  const router = Router();

  router.get(
    "/migration/jobs",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const jobs = await migrationService.getJobsByWorkspace(workspaceId);
        res.json(jobs);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/migration/jobs/:jobId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const job = await migrationService.getJob(req.params.jobId);
        if (!job || job.workspaceId !== workspaceId) return res.status(404).json({ error: { message: "Job not found", code: "NOT_FOUND" } });
        res.json(job);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/migration/jobs/:jobId/logs",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const job = await migrationService.getJob(req.params.jobId);
        if (!job || job.workspaceId !== workspaceId) return res.status(404).json({ error: { message: "Job not found", code: "NOT_FOUND" } });
        const logs = await migrationService.getJobLogs(req.params.jobId);
        res.json(logs);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/migration/wp-import",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(wpImportBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const owns = await migrationService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });

        if (req.body.xmlContent.length > MAX_UPLOAD_SIZE) {
          return res.status(400).json({ error: { message: "File too large (max 50MB)", code: "VALIDATION_ERROR" } });
        }

        const job = await migrationService.startImport(
          workspaceId,
          req.params.siteId,
          req.user!.id,
          req.body.xmlContent,
          req.body.fileName,
        );

        res.status(201).json(job);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
