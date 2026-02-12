import { Router } from "express";
import { cmsCollectionsService } from "./cmsCollections.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { collectionFieldSchema } from "@shared/schema";
import { z } from "zod";

const createCollectionBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  schemaJson: z.array(collectionFieldSchema).optional(),
});

const updateCollectionBody = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  schemaJson: z.array(collectionFieldSchema).optional(),
});

const saveItemBody = z.object({
  dataJson: z.any().optional(),
  note: z.string().optional(),
});

export function cmsCollectionsRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/collections",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const { search } = req.query;
        const list = await cmsCollectionsService.getCollectionsBySite(
          req.params.siteId,
          workspaceId,
          { search: typeof search === "string" ? search : undefined },
        );
        res.json(list);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/collections",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(createCollectionBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.createCollection({
          ...req.body,
          siteId: req.params.siteId,
          workspaceId,
        });
        res.status(201).json(col);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get("/collections/:collectionId", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

      const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
      if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });
      res.json(col);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/collections/:collectionId", requireAuth(), requireWorkspaceContext(), validateBody(updateCollectionBody), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

      const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
      if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

      const updated = await cmsCollectionsService.updateCollection(req.params.collectionId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/collections/:collectionId", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

      const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
      if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

      await cmsCollectionsService.deleteCollection(req.params.collectionId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get(
    "/collections/:collectionId/items",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const { status } = req.query;
        const items = await cmsCollectionsService.getItems(req.params.collectionId, {
          status: typeof status === "string" ? status : undefined,
        });
        res.json(items);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/collections/:collectionId/items",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(z.object({ dataJson: z.any().optional() })),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const { dataJson } = req.body;
        const result = await cmsCollectionsService.createItem(req.params.collectionId, req.user!.id, dataJson);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/collections/:collectionId/items/:itemId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const item = await cmsCollectionsService.getItemForCollection(req.params.itemId, req.params.collectionId);
        if (!item) return res.status(404).json({ error: { message: "Item not found", code: "NOT_FOUND" } });

        const latestRevision = await cmsCollectionsService.getLatestItemRevision(item.id);
        res.json({ ...item, latestRevision });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/collections/:collectionId/items/:itemId",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(saveItemBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const item = await cmsCollectionsService.getItemForCollection(req.params.itemId, req.params.collectionId);
        if (!item) return res.status(404).json({ error: { message: "Item not found", code: "NOT_FOUND" } });

        const result = await cmsCollectionsService.updateItem(req.params.itemId, req.body.dataJson, req.user!.id, req.body.note);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/collections/:collectionId/items/:itemId/publish",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(z.object({ dataJson: z.any().optional() })),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const item = await cmsCollectionsService.getItemForCollection(req.params.itemId, req.params.collectionId);
        if (!item) return res.status(404).json({ error: { message: "Item not found", code: "NOT_FOUND" } });

        const { dataJson } = req.body;
        const result = await cmsCollectionsService.publishItem(req.params.itemId, req.user!.id, dataJson);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/collections/:collectionId/items/:itemId/rollback/:revisionId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const item = await cmsCollectionsService.getItemForCollection(req.params.itemId, req.params.collectionId);
        if (!item) return res.status(404).json({ error: { message: "Item not found", code: "NOT_FOUND" } });

        const result = await cmsCollectionsService.rollbackItem(req.params.itemId, req.params.revisionId, req.user!.id);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/collections/:collectionId/items/:itemId/revisions",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const item = await cmsCollectionsService.getItemForCollection(req.params.itemId, req.params.collectionId);
        if (!item) return res.status(404).json({ error: { message: "Item not found", code: "NOT_FOUND" } });

        const revisions = await cmsCollectionsService.getItemRevisions(req.params.itemId);
        res.json(revisions);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/collections/:collectionId/items/:itemId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const col = await cmsCollectionsService.getCollectionForWorkspace(req.params.collectionId, workspaceId);
        if (!col) return res.status(404).json({ error: { message: "Collection not found", code: "NOT_FOUND" } });

        const item = await cmsCollectionsService.getItemForCollection(req.params.itemId, req.params.collectionId);
        if (!item) return res.status(404).json({ error: { message: "Item not found", code: "NOT_FOUND" } });

        await cmsCollectionsService.deleteItem(req.params.itemId);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
