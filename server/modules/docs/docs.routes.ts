import { Router } from "express";
import { docsService } from "./docs.service";
import { validateBody } from "../shared/validate";
import { insertDocEntrySchema } from "@shared/schema";
import { requireAuth, requireRole } from "../shared/auth-middleware";

export function docsRoutes(): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const { type, category, q } = req.query;

      if (q && typeof q === "string") {
        const docs = await docsService.search(q);
        return res.json(docs);
      }
      if (type && typeof type === "string") {
        const docs = await docsService.getByType(type);
        return res.json(docs);
      }
      if (category && typeof category === "string") {
        const docs = await docsService.getByCategory(category);
        return res.json(docs);
      }

      const docs = await docsService.getAll();
      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  router.get("/help", async (_req, res, next) => {
    try {
      const docs = await docsService.getPublishedHelp();
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

  router.post("/", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), validateBody(insertDocEntrySchema), async (req, res, next) => {
    try {
      const doc = await docsService.create(req.body);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      const doc = await docsService.update(req.params.id, req.body);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", requireAuth(), requireRole("SUPER_ADMIN", "AGENCY_ADMIN"), async (req, res, next) => {
    try {
      await docsService.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
