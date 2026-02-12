import { Router } from "express";
import { requireAuth } from "../shared/auth-middleware";
import { storage } from "../../storage";
import { db } from "../../db";
import { sessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateBody } from "../shared/validate";

const selectWorkspaceBody = z.object({
  workspaceId: z.string().min(1),
});

export function createAuthRoutes(): Router {
  const router = Router();

  router.get("/me", requireAuth(), async (req, res, next) => {
    try {
      const user = req.user!;
      const userWorkspaces = await storage.getWorkspacesByUserId(user.id);

      res.json({
        user,
        activeWorkspaceId: req.session?.activeWorkspaceId || null,
        workspaces: userWorkspaces.map((ws) => ({
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          role: ws.role,
          plan: ws.plan,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/select-workspace",
    requireAuth(),
    validateBody(selectWorkspaceBody),
    async (req, res, next) => {
      try {
        const { workspaceId } = req.body;

        const user = req.user!;

        if (user.role !== "SUPER_ADMIN") {
          const membership = await storage.getMembership(user.id, workspaceId);
          if (!membership) {
            return res.status(403).json({
              error: { message: "Not a member of this workspace", code: "FORBIDDEN" },
            });
          }
        }

        const workspace = await storage.getWorkspace(workspaceId);
        if (!workspace) {
          return res.status(404).json({
            error: { message: "Workspace not found", code: "NOT_FOUND" },
          });
        }

        await db
          .update(sessions)
          .set({ activeWorkspaceId: workspaceId })
          .where(eq(sessions.id, req.session!.id));

        await storage.createAuditLog({
          userId: user.id,
          workspaceId,
          action: "workspace.selected",
          resource: "workspace",
          details: { workspaceName: workspace.name },
          ipAddress: req.ip || null,
          userAgent: req.headers["user-agent"] || null,
        });

        res.json({
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            plan: workspace.plan,
          },
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get("/workspaces", requireAuth(), async (req, res, next) => {
    try {
      const userWorkspaces = await storage.getWorkspacesByUserId(req.user!.id);
      res.json(userWorkspaces);
    } catch (err) {
      next(err);
    }
  });

  router.get("/sites", requireAuth(), async (req, res, next) => {
    try {
      const workspaceId = req.headers["x-workspace-id"] as string || req.session?.activeWorkspaceId;
      if (!workspaceId) {
        return res.json([]);
      }
      const sitesList = await storage.getSitesByWorkspace(workspaceId);
      res.json(sitesList);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
