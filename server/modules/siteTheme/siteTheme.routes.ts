import { Router } from "express";
import { siteThemeService } from "./siteTheme.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { themeTokensSchema, layoutPresetsSchema } from "@shared/schema";
import type { Request, Response } from "express";
import { z } from "zod";

const updateThemeBody = z.object({
  tokens: themeTokensSchema.optional(),
  layout: layoutPresetsSchema.optional(),
});

export function siteThemeRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/theme",
    requireAuth(),
    requireWorkspaceContext(),
    async (req: Request, res: Response, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const owns = await siteThemeService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });

        const theme = await siteThemeService.getOrCreateTheme(req.params.siteId);
        res.json(theme);
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    "/sites/:siteId/theme",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(updateThemeBody),
    async (req: Request, res: Response, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });

        const owns = await siteThemeService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });

        const { tokens, layout } = req.body;

        if (tokens && layout) {
          const updated = await siteThemeService.updateTheme(req.params.siteId, tokens, layout);
          return res.json(updated);
        }
        if (tokens) {
          const updated = await siteThemeService.updateTokens(req.params.siteId, tokens);
          return res.json(updated);
        }
        if (layout) {
          const updated = await siteThemeService.updateLayout(req.params.siteId, layout);
          return res.json(updated);
        }

        return res.status(400).json({ error: { message: "Provide tokens, layout, or both", code: "VALIDATION_ERROR" } });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
