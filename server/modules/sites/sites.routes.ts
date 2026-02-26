import { Router } from "express";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { storage } from "../../storage";
import { insertSiteSchema } from "@shared/schema";
import { validateBody } from "../shared/validate";

export function createSitesRoutes(): Router {
  const router = Router();

  router.get(
    "/",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
          return res.json([]);
        }
        const sitesList = await storage.getSitesByWorkspace(workspaceId);
        res.json(sitesList);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    "/",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(insertSiteSchema.pick({ name: true, slug: true })),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
          return res.status(400).json({ error: { message: "Workspace context required", code: "WORKSPACE_REQUIRED" } });
        }
        const site = await storage.createSite({
          name: req.body.name,
          slug: req.body.slug,
          workspaceId,
        });
        res.status(201).json(site);
      } catch (err: any) {
        if (err?.code === "23505") {
          return res.status(409).json({ error: { message: "A site with that slug already exists", code: "DUPLICATE" } });
        }
        next(err);
      }
    }
  );

  return router;
}
