import { Router } from "express";
import { seoService } from "./seo.service";
import { requireAuth, requireWorkspaceContext } from "../shared/auth-middleware";
import { z } from "zod";
import type { Request } from "express";

const updateSeoSettingsBody = z.object({
  titleSuffix: z.string().nullable().optional(),
  defaultOgImage: z.string().nullable().optional(),
  defaultIndexable: z.boolean().optional(),
  robotsTxt: z.string().nullable().optional(),
});

function getWorkspaceId(req: Request): string | null {
  return req.workspace?.id || req.session?.activeWorkspaceId || null;
}

export function seoRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/seo",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });
        const owns = await seoService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace" } });

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
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });
        const owns = await seoService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace" } });

        const parsed = updateSeoSettingsBody.parse(req.body);
        const settings = await seoService.upsertSeoSettings(req.params.siteId, parsed);
        res.json(settings);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
