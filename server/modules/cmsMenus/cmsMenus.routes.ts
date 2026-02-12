import { Router } from "express";
import { cmsMenusService } from "./cmsMenus.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { z } from "zod";

const createMenuBody = z.object({
  name: z.string().min(1),
  slot: z.enum(["header", "footer"]).nullable().optional(),
});

const updateMenuBody = z.object({
  name: z.string().min(1).optional(),
  slot: z.enum(["header", "footer"]).nullable().optional(),
});

const createItemBody = z.object({
  parentId: z.string().nullable().optional(),
  type: z.enum(["page", "collection_list", "collection_item", "external_url"]),
  label: z.string().min(1),
  target: z.string().nullable().optional(),
  openInNewTab: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const updateItemBody = z.object({
  label: z.string().min(1).optional(),
  type: z.enum(["page", "collection_list", "collection_item", "external_url"]).optional(),
  target: z.string().nullable().optional(),
  openInNewTab: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

const reorderBody = z.object({
  tree: z.array(
    z.object({
      id: z.string(),
      parentId: z.string().nullable(),
      sortOrder: z.number(),
    }),
  ),
});

export function cmsMenusRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/menus",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menuList = await cmsMenusService.getMenusBySite(req.params.siteId, workspaceId);
        res.json(menuList);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/menus",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(createMenuBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.createMenu({
          ...req.body,
          slot: req.body.slot ?? null,
          siteId: req.params.siteId,
          workspaceId,
        });
        res.status(201).json(menu);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/menus/:menuId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.getMenuForWorkspace(req.params.menuId, workspaceId);
        if (!menu) return res.status(404).json({ error: { message: "Menu not found", code: "NOT_FOUND" } });
        const withItems = await cmsMenusService.getMenuWithItems(menu.id);
        res.json(withItems);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/menus/:menuId",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(updateMenuBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.getMenuForWorkspace(req.params.menuId, workspaceId);
        if (!menu) return res.status(404).json({ error: { message: "Menu not found", code: "NOT_FOUND" } });
        const updated = await cmsMenusService.updateMenu(req.params.menuId, req.body);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/menus/:menuId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.getMenuForWorkspace(req.params.menuId, workspaceId);
        if (!menu) return res.status(404).json({ error: { message: "Menu not found", code: "NOT_FOUND" } });
        await cmsMenusService.deleteMenu(req.params.menuId);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/menus/:menuId/items",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(createItemBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.getMenuForWorkspace(req.params.menuId, workspaceId);
        if (!menu) return res.status(404).json({ error: { message: "Menu not found", code: "NOT_FOUND" } });
        const item = await cmsMenusService.addMenuItem({
          menuId: req.params.menuId,
          parentId: req.body.parentId ?? null,
          type: req.body.type,
          label: req.body.label,
          target: req.body.target ?? null,
          openInNewTab: req.body.openInNewTab,
          sortOrder: req.body.sortOrder,
        });
        res.status(201).json(item);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/menus/:menuId/items/:itemId",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(updateItemBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.getMenuForWorkspace(req.params.menuId, workspaceId);
        if (!menu) return res.status(404).json({ error: { message: "Menu not found", code: "NOT_FOUND" } });
        const item = await cmsMenusService.updateMenuItem(req.params.itemId, req.body);
        res.json(item);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/menus/:menuId/items/:itemId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.getMenuForWorkspace(req.params.menuId, workspaceId);
        if (!menu) return res.status(404).json({ error: { message: "Menu not found", code: "NOT_FOUND" } });
        await cmsMenusService.deleteMenuItem(req.params.itemId);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    "/menus/:menuId/reorder",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(reorderBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const menu = await cmsMenusService.getMenuForWorkspace(req.params.menuId, workspaceId);
        if (!menu) return res.status(404).json({ error: { message: "Menu not found", code: "NOT_FOUND" } });
        const items = await cmsMenusService.reorderItems(req.params.menuId, req.body.tree);
        res.json(items);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
