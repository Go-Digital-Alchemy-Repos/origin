import { Router } from "express";
import { marketplaceService } from "./marketplace.service";
import { validateBody } from "../shared/validate";
import { insertMarketplaceItemSchema } from "@shared/schema";
import { requireAuth, requireRole, requireWorkspaceContext } from "../shared/auth-middleware";

export function marketplaceRoutes(): Router {
  const router = Router();

  router.get("/items", async (req, res, next) => {
    try {
      const { type } = req.query;
      if (type && typeof type === "string") {
        const items = await marketplaceService.getItemsByType(type);
        return res.json(items);
      }
      const items = await marketplaceService.getAllItems();
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get("/items/:slug", async (req, res, next) => {
    try {
      const item = await marketplaceService.getItemBySlug(req.params.slug);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post("/items", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(insertMarketplaceItemSchema), async (req, res, next) => {
    try {
      const item = await marketplaceService.createItem(req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/items/:id", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      const item = await marketplaceService.updateItem(req.params.id, req.body);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/items/:id", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      await marketplaceService.deleteItem(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/installs", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const installs = await marketplaceService.getInstallsByWorkspace(workspaceId);
      res.json(installs);
    } catch (err) {
      next(err);
    }
  });

  router.post("/install", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      const install = await marketplaceService.installItem(workspaceId, itemId);
      res.status(201).json(install);
    } catch (err) {
      next(err);
    }
  });

  router.post("/uninstall", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      const result = await marketplaceService.uninstallItem(workspaceId, itemId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/preview/start", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      const session = await marketplaceService.startPreview(workspaceId, itemId);
      res.json(session);
    } catch (err) {
      next(err);
    }
  });

  router.post("/preview/end", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      await marketplaceService.endPreview(workspaceId, itemId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
