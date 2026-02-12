import { Router } from "express";
import { blogService } from "./blog.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";

export function blogRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/blog/status",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const owns = await blogService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(403).json({ error: { message: "Access denied", code: "FORBIDDEN" } });

        const status = await blogService.getBlogStatus(req.params.siteId);
        res.json(status);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/blog/setup",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const owns = await blogService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(403).json({ error: { message: "Access denied", code: "FORBIDDEN" } });

        const result = await blogService.setupBlog(req.params.siteId, workspaceId, req.user!.id);
        res.status(201).json(result);
      } catch (err: any) {
        if (err.message?.includes("already exists")) {
          return res.status(409).json({ error: { message: err.message, code: "CONFLICT" } });
        }
        next(err);
      }
    },
  );

  router.get(
    "/public/blog/:siteId/posts",
    async (req, res, next) => {
      try {
        const posts = await blogService.getPublishedPosts(req.params.siteId);
        res.json(posts);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/public/blog/:siteId/posts/:slug",
    async (req, res, next) => {
      try {
        const post = await blogService.getPublishedPost(req.params.siteId, req.params.slug);
        if (!post) return res.status(404).json({ error: { message: "Post not found", code: "NOT_FOUND" } });
        res.json(post);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
