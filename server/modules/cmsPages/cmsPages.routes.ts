import { Router } from "express";
import { cmsPagesService } from "./cmsPages.service";
import { requireAuth, requireWorkspaceContext } from "../shared/auth-middleware";
import { z } from "zod";
import type { Request, Response } from "express";
import { purgeCache } from "../publicSite/publicSite.cache";

const createPageBody = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  contentJson: z.any().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  indexable: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

const updatePageBody = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  contentJson: z.any().optional(),
  note: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  indexable: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

function getWorkspaceId(req: Request): string | null {
  return req.workspace?.id || req.session?.activeWorkspaceId || null;
}

export function cmsPagesRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/pages",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

        const { search, status } = req.query;
        const pagesList = await cmsPagesService.getPagesBySite(
          req.params.siteId,
          workspaceId,
          {
            search: typeof search === "string" ? search : undefined,
            status: typeof status === "string" ? status : undefined,
          },
        );
        res.json(pagesList);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/pages",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

        const parsed = createPageBody.parse(req.body);
        const result = await cmsPagesService.createPage(
          { ...parsed, siteId: req.params.siteId, workspaceId },
          req.user!.id,
          parsed.contentJson,
        );
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get("/pages/:pageId", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

      const page = await cmsPagesService.getPageForWorkspace(req.params.pageId, workspaceId);
      if (!page) return res.status(404).json({ error: { message: "Page not found" } });

      const latestRevision = await cmsPagesService.getLatestRevision(page.id);
      res.json({ ...page, latestRevision });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/pages/:pageId", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

      const page = await cmsPagesService.getPageForWorkspace(req.params.pageId, workspaceId);
      if (!page) return res.status(404).json({ error: { message: "Page not found" } });

      const parsed = updatePageBody.parse(req.body);
      const { note, ...data } = parsed;
      const result = await cmsPagesService.updatePage(req.params.pageId, data, req.user!.id, note);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/pages/:pageId/publish",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

        const page = await cmsPagesService.getPageForWorkspace(req.params.pageId, workspaceId);
        if (!page) return res.status(404).json({ error: { message: "Page not found" } });

        const { contentJson } = req.body || {};
        const result = await cmsPagesService.publishPage(req.params.pageId, req.user!.id, contentJson);
        purgeCache(page.siteId, page.slug);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/pages/:pageId/rollback/:revisionId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

        const page = await cmsPagesService.getPageForWorkspace(req.params.pageId, workspaceId);
        if (!page) return res.status(404).json({ error: { message: "Page not found" } });

        const result = await cmsPagesService.rollbackToRevision(
          req.params.pageId,
          req.params.revisionId,
          req.user!.id,
        );
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/pages/:pageId/revisions",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

        const page = await cmsPagesService.getPageForWorkspace(req.params.pageId, workspaceId);
        if (!page) return res.status(404).json({ error: { message: "Page not found" } });

        const revisions = await cmsPagesService.getRevisions(req.params.pageId);
        res.json(revisions);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete("/pages/:pageId", requireAuth(), requireWorkspaceContext(), async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

      const page = await cmsPagesService.getPageForWorkspace(req.params.pageId, workspaceId);
      if (!page) return res.status(404).json({ error: { message: "Page not found" } });

      await cmsPagesService.deletePage(req.params.pageId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
