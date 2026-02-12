import type { Express } from "express";
import { type Server } from "http";
import { registerAllModules } from "./modules/registry";
import { AppError } from "./modules/shared/errors";
import { publicSiteService } from "./modules/publicSite";
import { renderPublicPage, render404Page } from "./modules/publicSite/publicSite.renderer";
import { setCacheHeaders, setNoCacheHeaders } from "./modules/publicSite/publicSite.cache";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const api = registerAllModules();
  app.use("/api", api);

  app.get("/api/public-preview/:siteSlug", async (req, res) => {
    try {
      const { siteSlug } = req.params;
      const pageSlug = (req.query.page as string) || "";
      const { db } = await import("./db");
      const { sites } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [site] = await db.select().from(sites).where(eq(sites.slug, siteSlug)).limit(1);
      if (!site) return res.status(404).json({ error: "Site not found" });

      const allPages = await publicSiteService.getPublishedPages(site.id);
      let targetSlug = pageSlug;
      if (!targetSlug) {
        const home = allPages.find((p) => p.slug === "home" || p.slug === "index");
        targetSlug = home?.slug || allPages[0]?.slug || "";
      }

      if (!targetSlug) {
        return res.status(404).type("html").send(render404Page(site.name));
      }

      const [page, theme] = await Promise.all([
        publicSiteService.getPublishedPage(site.id, targetSlug),
        publicSiteService.getSiteTheme(site.id),
      ]);

      if (!page) {
        return res.status(404).type("html").send(render404Page(site.name));
      }

      setNoCacheHeaders(res);
      const html = renderPublicPage({ site: { name: site.name, slug: site.slug }, page, theme, pages: allPages });
      res.type("html").send(html);
    } catch (err) {
      res.status(500).json({ error: "Render failed" });
    }
  });

  app.use("/api", (err: any, _req: any, res: any, next: any) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }
    next(err);
  });

  return httpServer;
}
