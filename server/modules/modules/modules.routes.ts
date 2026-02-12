import { Router } from "express";
import { modulesService } from "./modules.service";

export function modulesRoutes(): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const modules = await modulesService.getAll();
      res.json(modules);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:slug", async (req, res, next) => {
    try {
      const mod = await modulesService.getBySlug(req.params.slug);
      res.json(mod);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
