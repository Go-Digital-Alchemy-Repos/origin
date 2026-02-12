import { Router, Request, Response } from "express";
import { marketplaceService } from "./marketplace.service";
import { validateBody } from "../shared/validate";
import { insertMarketplaceItemSchema } from "@shared/schema";
import { requireAuth, requireRole, requireWorkspaceContext } from "../shared/auth-middleware";
import { createMarketplaceCheckoutSession } from "../billing/billing.service";
import { z } from "zod";

const updateItemBody = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  isFree: z.boolean().optional(),
  billingType: z.string().optional(),
  priceId: z.string().optional(),
  minPlatformVersion: z.string().optional(),
}).partial();

const itemIdBody = z.object({ itemId: z.string().min(1) });

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

  router.patch("/items/:id", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(updateItemBody), async (req, res, next) => {
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

  router.get("/purchases", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const purchases = await marketplaceService.getPurchasesByWorkspace(workspaceId);
      res.json(purchases);
    } catch (err) {
      next(err);
    }
  });

  router.post("/install", requireAuth(), requireWorkspaceContext(), validateBody(itemIdBody), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      const install = await marketplaceService.installItem(workspaceId, itemId);
      res.status(201).json(install);
    } catch (err) {
      next(err);
    }
  });

  router.post("/uninstall", requireAuth(), requireWorkspaceContext(), validateBody(itemIdBody), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      const result = await marketplaceService.uninstallItem(workspaceId, itemId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/checkout", requireAuth(), requireWorkspaceContext(), validateBody(itemIdBody), async (req: Request, res: Response, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const user = req.user!;
      const { itemId } = req.body;

      const item = await marketplaceService.getItemById(itemId);

      if (item.billingType === "free" || item.isFree) {
        return res.status(400).json({ error: { message: "This item is free and does not require checkout", code: "VALIDATION_ERROR" } });
      }

      if (!item.priceId) {
        return res.status(400).json({ error: { message: "This item does not have a Stripe price configured", code: "VALIDATION_ERROR" } });
      }

      const existingPurchase = await marketplaceService.getPurchase(workspaceId, itemId);
      if (existingPurchase) {
        return res.status(409).json({ error: { message: "Item already purchased", code: "CONFLICT" } });
      }

      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const session = await createMarketplaceCheckoutSession(
        workspaceId,
        user.email,
        user.name || "Workspace User",
        item,
        `${baseUrl}/app/marketplace?purchased=${item.slug}`,
        `${baseUrl}/app/marketplace?canceled=${item.slug}`,
      );

      res.json({ url: session.url });
    } catch (err) {
      next(err);
    }
  });

  router.post("/preview/start", requireAuth(), requireWorkspaceContext(), validateBody(itemIdBody), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      const session = await marketplaceService.startPreview(workspaceId, itemId);
      res.json(session);
    } catch (err) {
      next(err);
    }
  });

  router.post("/preview/end", requireAuth(), requireWorkspaceContext(), validateBody(itemIdBody), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const { itemId } = req.body;
      await marketplaceService.endPreview(workspaceId, itemId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/installed-items", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const items = await marketplaceService.getInstalledItemDetails(workspaceId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get("/admin/items", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      const items = await marketplaceService.getAllItemsAdmin();
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get("/items/:id/changelogs", requireAuth(), async (req, res, next) => {
    try {
      const logs = await marketplaceService.getChangelogs(req.params.id);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  const bumpVersionBody = z.object({
    bumpType: z.enum(["major", "minor", "patch"]),
    notes: z.string().min(1, "Changelog notes are required"),
  });

  router.post("/items/:id/bump-version", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(bumpVersionBody), async (req, res, next) => {
    try {
      const result = await marketplaceService.bumpItemVersion(req.params.id, req.body.bumpType, req.body.notes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  const setVersionBody = z.object({
    version: z.string().min(1),
    notes: z.string().min(1, "Changelog notes are required"),
  });

  router.post("/items/:id/set-version", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(setVersionBody), async (req, res, next) => {
    try {
      const result = await marketplaceService.setItemVersion(req.params.id, req.body.version, req.body.notes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  const deprecateBody = z.object({
    message: z.string().optional(),
  });

  router.post("/items/:id/deprecate", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(deprecateBody), async (req, res, next) => {
    try {
      const item = await marketplaceService.deprecateItem(req.params.id, req.body.message);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post("/items/:id/undeprecate", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      const item = await marketplaceService.undeprecateItem(req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.get("/items/:id/compatibility", requireAuth(), async (req, res, next) => {
    try {
      const result = await marketplaceService.checkItemCompatibility(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
