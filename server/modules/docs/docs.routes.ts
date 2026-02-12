import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import { docsService } from "./docs.service";
import { validateBody } from "../shared/validate";
import { insertDocEntrySchema } from "@shared/schema";
import { requireAuth, requireRole } from "../shared/auth-middleware";

const EXPECTED_DOCS: { file: string; label: string; area: string }[] = [
  { file: "ARCHITECTURE.md", label: "Platform Architecture", area: "Core" },
  { file: "AUTH_BETTERAUTH.md", label: "Authentication (BetterAuth)", area: "Core" },
  { file: "TENANCY_AND_RBAC.md", label: "Tenancy & RBAC", area: "Core" },
  { file: "APP_SHELL_NAV.md", label: "App Shell & Navigation", area: "Core" },
  { file: "CODING_STANDARDS.md", label: "Coding Standards", area: "Core" },
  { file: "API_REFERENCE.md", label: "API Reference", area: "Core" },
  { file: "PAGES_REVISIONS_PUBLISHING.md", label: "Pages, Revisions & Publishing", area: "CMS" },
  { file: "COLLECTIONS_SYSTEM.md", label: "Collections System", area: "CMS" },
  { file: "BLOG_SYSTEM.md", label: "Blog System", area: "CMS" },
  { file: "FORMS_SYSTEM.md", label: "Forms System", area: "CMS" },
  { file: "NAVIGATION_MENUS_SYSTEM.md", label: "Navigation Menus", area: "CMS" },
  { file: "REDIRECTS_SYSTEM.md", label: "Redirects System", area: "CMS" },
  { file: "SEO_SYSTEM.md", label: "SEO System", area: "CMS" },
  { file: "THEME_TOKENS_LAYOUT_PRESETS.md", label: "Theme Tokens & Layout Presets", area: "Design" },
  { file: "COMPONENT_REGISTRY.md", label: "Component Registry", area: "Design" },
  { file: "BUILDER_PUCK_INTEGRATION.md", label: "Page Builder (Puck)", area: "Design" },
  { file: "PUBLIC_RENDERING_DOMAINS.md", label: "Public Site Rendering & Domains", area: "Infrastructure" },
  { file: "BILLING_STRIPE.md", label: "Billing & Stripe", area: "Infrastructure" },
  { file: "MARKETPLACE_FRAMEWORK.md", label: "Marketplace Framework", area: "Infrastructure" },
  { file: "MODULE_DEVELOPMENT.md", label: "Module Development Guide", area: "Guides" },
  { file: "DOCS_LIBRARY_SYSTEM.md", label: "Docs Library System", area: "Guides" },
  { file: "RESOURCE_DOCS_SYSTEM.md", label: "Resource Docs System", area: "Guides" },
  { file: "ORIGIN_DOCS_GOVERNANCE.md", label: "Docs Governance", area: "Guides" },
];

export function docsRoutes(): Router {
  const router = Router();

  router.get("/checklist", requireAuth(), requireRole("SUPER_ADMIN"), async (_req, res, next) => {
    try {
      const docsDir = path.resolve(process.cwd(), "docs");
      const items = EXPECTED_DOCS.map((entry) => {
        const filePath = path.join(docsDir, entry.file);
        let exists = false;
        let sizeBytes = 0;
        try {
          const stat = fs.statSync(filePath);
          exists = true;
          sizeBytes = stat.size;
        } catch {}
        return { ...entry, exists, sizeBytes };
      });

      const total = items.length;
      const covered = items.filter((i) => i.exists).length;
      res.json({ items, total, covered });
    } catch (err) {
      next(err);
    }
  });

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
