import { Router } from "express";
import { aiCopilotRoutes } from "./aiCopilot.routes";

export function createAiCopilotModule(): Router {
  const router = Router();
  router.use("/ai-copilot", aiCopilotRoutes());
  return router;
}
