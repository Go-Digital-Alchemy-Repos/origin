import { Router } from "express";
import { seoService } from "./seo.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { z } from "zod";

const updateSeoSettingsBody = z.object({
  titleSuffix: z.string().nullable().optional(),
  defaultOgImage: z.string().nullable().optional(),
  defaultIndexable: z.boolean().optional(),
  robotsTxt: z.string().nullable().optional(),
});

export function seoRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/seo",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const owns = await seoService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });

        const settings = await seoService.getSeoSettings(req.params.siteId);
        res.json(settings ?? {
          siteId: req.params.siteId,
          titleSuffix: null,
          defaultOgImage: null,
          defaultIndexable: true,
          robotsTxt: null,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    "/sites/:siteId/seo",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(updateSeoSettingsBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const owns = await seoService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });

        const settings = await seoService.upsertSeoSettings(req.params.siteId, req.body);
        res.json(settings);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
