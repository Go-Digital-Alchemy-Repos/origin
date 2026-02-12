import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireWorkspaceContext, getWorkspaceId } from "../shared/auth-middleware";
import { validateBody } from "../shared/validate";
import {
  getOnboardingState,
  ensureOnboardingState,
  advanceWizardStep,
  completeWizard,
  dismissChecklist,
  recomputeChecklist,
} from "./onboarding.service";

const advanceBody = z.object({
  step: z.string().min(1),
  firstSiteId: z.string().optional(),
});

export function onboardingRoutes(): Router {
  const router = Router();

  router.get(
    "/state",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
          return res.status(400).json({ error: { message: "Workspace context required", code: "WORKSPACE_REQUIRED" } });
        }
        const state = await ensureOnboardingState(workspaceId);
        res.json(state);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/advance",
    requireAuth(),
    requireWorkspaceContext(),
    validateBody(advanceBody),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
          return res.status(400).json({ error: { message: "Workspace context required", code: "WORKSPACE_REQUIRED" } });
        }
        const { step, firstSiteId } = req.body;
        const state = await advanceWizardStep(workspaceId, step, { firstSiteId });
        res.json(state);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/complete-wizard",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
          return res.status(400).json({ error: { message: "Workspace context required", code: "WORKSPACE_REQUIRED" } });
        }
        const state = await completeWizard(workspaceId);
        res.json(state);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/recompute",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
          return res.status(400).json({ error: { message: "Workspace context required", code: "WORKSPACE_REQUIRED" } });
        }
        const checklist = await recomputeChecklist(workspaceId);
        res.json({ checklist });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/dismiss",
    requireAuth(),
    requireWorkspaceContext(),
    async (req, res, next) => {
      try {
        const workspaceId = getWorkspaceId(req);
        if (!workspaceId) {
          return res.status(400).json({ error: { message: "Workspace context required", code: "WORKSPACE_REQUIRED" } });
        }
        const state = await dismissChecklist(workspaceId);
        res.json(state);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
