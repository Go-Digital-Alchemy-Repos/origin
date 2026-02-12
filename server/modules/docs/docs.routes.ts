import { Router } from "express";
import { docsService } from "./docs.service";
import { validateBody } from "../shared/validate";
import { insertDocEntrySchema } from "@shared/schema";

export function docsRoutes(): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const docs = await docsService.getAll();
      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:slug", async (req, res, next) => {
    try {
      const doc = await docsService.getBySlug(req.params.slug);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.post("/", validateBody(insertDocEntrySchema), async (req, res, next) => {
    try {
      const doc = await docsService.create(req.body);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
