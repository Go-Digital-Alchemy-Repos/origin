import { Router } from "express";
import { componentRegistry } from "@shared/component-registry";

export function createComponentRegistryRoutes(): Router {
  const router = Router();

  router.get("/component-registry", (_req, res) => {
    const summary = componentRegistry.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      category: c.category,
      icon: c.icon,
      version: c.version,
      status: c.status,
      tags: c.tags,
      propCount: c.propSchema.length,
      presetCount: 1 + (c.additionalPresets?.length || 0),
    }));
    res.json(summary);
  });

  router.get("/component-registry/:slug", (req, res) => {
    const component = componentRegistry.find((c) => c.slug === req.params.slug);
    if (!component) {
      return res.status(404).json({ error: { message: "Component not found", code: "NOT_FOUND" } });
    }
    res.json(component);
  });

  return router;
}
