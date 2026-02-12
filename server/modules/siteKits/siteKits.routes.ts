import { Router } from "express";
import { siteKitsService } from "./siteKits.service";
import { validateBody } from "../shared/validate";
import { insertSiteKitSchema, insertSiteKitAssetSchema } from "@shared/schema";
import { requireAuth, requireRole, requireWorkspaceContext } from "../shared/auth-middleware";
import { z } from "zod";

export function siteKitsRoutes(): Router {
  const router = Router();

  router.get("/", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      const kits = await siteKitsService.getAll();
      res.json(kits);
    } catch (err) {
      next(err);
    }
  });

  router.get("/published", async (req, res, next) => {
    try {
      const kits = await siteKitsService.getPublished();
      res.json(kits);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", requireAuth(), async (req, res, next) => {
    try {
      const kit = await siteKitsService.getById(req.params.id);
      res.json(kit);
    } catch (err) {
      next(err);
    }
  });

  router.post("/", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(insertSiteKitSchema), async (req, res, next) => {
    try {
      const kit = await siteKitsService.create(req.body);
      res.status(201).json(kit);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(insertSiteKitSchema.partial()), async (req, res, next) => {
    try {
      const kit = await siteKitsService.update(req.params.id, req.body);
      res.json(kit);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      await siteKitsService.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/publish", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      const kit = await siteKitsService.publish(req.params.id);
      res.json(kit);
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/unpublish", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      const kit = await siteKitsService.unpublish(req.params.id);
      res.json(kit);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id/assets", requireAuth(), async (req, res, next) => {
    try {
      const assets = await siteKitsService.getAssets(req.params.id);
      res.json(assets);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id/manifest", requireAuth(), async (req, res, next) => {
    try {
      const manifest = await siteKitsService.getKitManifest(req.params.id);
      res.json(manifest);
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/assets", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(insertSiteKitAssetSchema), async (req, res, next) => {
    try {
      const asset = await siteKitsService.addAsset({ ...req.body, siteKitId: req.params.id });
      res.status(201).json(asset);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/assets/:assetId", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(insertSiteKitAssetSchema.partial()), async (req, res, next) => {
    try {
      const asset = await siteKitsService.updateAsset(req.params.assetId, req.body);
      res.json(asset);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/assets/:assetId", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      await siteKitsService.removeAsset(req.params.assetId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/install", requireAuth(), requireWorkspaceContext(), validateBody(z.object({ siteId: z.string().min(1) })), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { siteId } = req.body;
      const result = await siteKitsService.installToWorkspace(req.params.id, workspaceId, siteId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
