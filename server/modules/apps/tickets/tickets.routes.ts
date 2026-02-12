import { Router } from "express";
import { ticketsService } from "./tickets.service";
import { requireAuth, requireWorkspaceContext, requireEntitlement, getWorkspaceId } from "../../shared/auth-middleware";

export function ticketsRoutes(): Router {
  const router = Router();

  const gate = [requireAuth(), requireWorkspaceContext(), requireEntitlement("apps.tickets")];

  router.get("/health", ...gate, async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req)!;
      const health = ticketsService.getHealth(workspaceId);
      res.json(health);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
