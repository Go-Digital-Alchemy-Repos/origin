import { Router } from "express";
import { siteThemeService } from "./siteTheme.service";
import { requireAuth, requireWorkspaceContext } from "../shared/auth-middleware";
import { themeTokensSchema, layoutPresetsSchema } from "@shared/schema";
import type { Request, Response } from "express";
import { z } from "zod";

function getWorkspaceId(req: Request): string | null {
  return req.workspace?.id || req.session?.activeWorkspaceId || null;
}

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
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

        const owns = await siteThemeService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace" } });

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
    async (req: Request, res: Response, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required" } });

        const owns = await siteThemeService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace" } });

        const parsed = updateThemeBody.parse(req.body);

        if (parsed.tokens && parsed.layout) {
          const updated = await siteThemeService.updateTheme(req.params.siteId, parsed.tokens, parsed.layout);
          return res.json(updated);
        }
        if (parsed.tokens) {
          const updated = await siteThemeService.updateTokens(req.params.siteId, parsed.tokens);
          return res.json(updated);
        }
        if (parsed.layout) {
          const updated = await siteThemeService.updateLayout(req.params.siteId, parsed.layout);
          return res.json(updated);
        }

        return res.status(400).json({ error: { message: "Provide tokens, layout, or both" } });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: { message: "Invalid theme data", details: err.errors } });
        }
        next(err);
      }
    },
  );

  return router;
}
