import { Router } from "express";
import { redirectsService } from "./redirects.service";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import { z } from "zod";

const createRedirectBody = z.object({
  fromPath: z.string().min(1),
  toUrl: z.string().min(1),
  code: z.number().int().refine((v) => v === 301 || v === 302, { message: "Code must be 301 or 302" }).optional(),
});

const updateRedirectBody = z.object({
  fromPath: z.string().min(1).optional(),
  toUrl: z.string().min(1).optional(),
  code: z.number().int().refine((v) => v === 301 || v === 302, { message: "Code must be 301 or 302" }).optional(),
});

export function redirectsRoutes(): Router {
  const router = Router();

  router.get(
    "/sites/:siteId/redirects",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const owns = await redirectsService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });
        const list = await redirectsService.getRedirectsBySite(req.params.siteId);
        res.json(list);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/redirects",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const owns = await redirectsService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });
        const parsed = createRedirectBody.parse(req.body);
        const redirect = await redirectsService.createRedirect({
          siteId: req.params.siteId,
          fromPath: parsed.fromPath,
          toUrl: parsed.toUrl,
          code: parsed.code,
        });
        res.status(201).json(redirect);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    "/redirects/:redirectId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const existing = await redirectsService.verifyRedirectOwnership(req.params.redirectId, workspaceId);
        if (!existing) return res.status(404).json({ error: { message: "Redirect not found", code: "NOT_FOUND" } });
        const parsed = updateRedirectBody.parse(req.body);
        const updated = await redirectsService.updateRedirect(req.params.redirectId, parsed);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/redirects/:redirectId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const existing = await redirectsService.verifyRedirectOwnership(req.params.redirectId, workspaceId);
        if (!existing) return res.status(404).json({ error: { message: "Redirect not found", code: "NOT_FOUND" } });
        await redirectsService.deleteRedirect(req.params.redirectId);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/sites/:siteId/redirects/import",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const owns = await redirectsService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });

        const body = z
          .object({
            csv: z.string().min(1),
          })
          .parse(req.body);

        const rows = parseCsv(body.csv);
        if (rows.length === 0) {
          return res.status(400).json({ error: { message: "No valid rows found in CSV", code: "VALIDATION_ERROR" } });
        }
        if (rows.length > 1000) {
          return res.status(400).json({ error: { message: "Maximum 1000 redirects per import", code: "VALIDATION_ERROR" } });
        }

        const result = await redirectsService.bulkCreateRedirects(req.params.siteId, rows);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    "/sites/:siteId/redirect-suggestions",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const owns = await redirectsService.verifySiteOwnership(req.params.siteId, workspaceId);
        if (!owns) return res.status(404).json({ error: { message: "Site not found in this workspace", code: "NOT_FOUND" } });
        const suggestions = await redirectsService.getSuggestionsBySite(req.params.siteId);
        res.json(suggestions);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/redirect-suggestions/:suggestionId/accept",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const suggestion = await redirectsService.verifySuggestionOwnership(req.params.suggestionId, workspaceId);
        if (!suggestion) return res.status(404).json({ error: { message: "Suggestion not found", code: "NOT_FOUND" } });
        const redirect = await redirectsService.acceptSuggestion(req.params.suggestionId);
        if (!redirect) return res.status(404).json({ error: { message: "Suggestion not found", code: "NOT_FOUND" } });
        res.json(redirect);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/redirect-suggestions/:suggestionId",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) return res.status(400).json({ error: { message: "Workspace required", code: "VALIDATION_ERROR" } });
        const suggestion = await redirectsService.verifySuggestionOwnership(req.params.suggestionId, workspaceId);
        if (!suggestion) return res.status(404).json({ error: { message: "Suggestion not found", code: "NOT_FOUND" } });
        await redirectsService.dismissSuggestion(req.params.suggestionId);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

function parseCsv(csv: string): Array<{ fromPath: string; toUrl: string; code?: number }> {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: Array<{ fromPath: string; toUrl: string; code?: number }> = [];

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 2) continue;

    const fromPath = parts[0];
    const toUrl = parts[1];

    if (!fromPath || !toUrl) continue;
    if (fromPath.toLowerCase() === "from" || fromPath.toLowerCase() === "from_path") continue;

    let code: number | undefined;
    if (parts[2]) {
      const parsed = parseInt(parts[2], 10);
      if (parsed === 301 || parsed === 302) code = parsed;
    }

    rows.push({ fromPath, toUrl, code });
  }

  return rows;
}
