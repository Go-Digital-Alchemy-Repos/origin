import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { publicSiteService, type ResolvedSite } from "./publicSite.service";
import { renderPublicPage, render404Page } from "./publicSite.renderer";
import { setCacheHeaders, setNoCacheHeaders } from "./publicSite.cache";
import { redirectsService } from "../redirects/redirects.service";
import { seoService } from "../seo/seo.service";
import { log } from "../../index";

declare global {
  namespace Express {
    interface Request {
      publicSite?: ResolvedSite;
    }
  }
}

const SUBDOMAIN_SUFFIX = ".originapp.ai";

export function isPublicSiteRequest(hostname: string): boolean {
  if (hostname.endsWith(SUBDOMAIN_SUFFIX)) return true;
  if (hostname === "localhost" || hostname === "127.0.0.1") return false;
  if (hostname.endsWith(".replit.dev") || hostname.endsWith(".replit.app")) return false;
  return true;
}

export function resolvePublicSiteMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const hostname = (req.hostname || req.headers.host || "").split(":")[0].toLowerCase();

    if (!isPublicSiteRequest(hostname)) {
      return next();
    }

    try {
      const site = await publicSiteService.resolveSiteByHost(hostname);
      if (!site) {
        return res.status(404).send(render404Page("ORIGIN"));
      }
      req.publicSite = site;
      next();
    } catch (err) {
      log(`Public site resolution error: ${err}`, "public");
      next();
    }
  };
}

function buildBaseUrl(req: Request, site: ResolvedSite): string {
  const protocol = req.protocol || "https";
  const host = req.get("host") || `${site.slug}.originapp.ai`;
  return `${protocol}://${host}`;
}

export function publicSiteRoutes(): Router {
  const router = Router();

  router.get("/sitemap.xml", async (req: Request, res: Response) => {
    const site = req.publicSite;
    if (!site) return res.status(404).send("Not found");

    try {
      const baseUrl = buildBaseUrl(req, site);
      const sitePages = await seoService.getSitemapPages(site.id);
      const xml = seoService.generateSitemapXml(baseUrl, sitePages);
      setCacheHeaders(res, { maxAge: 3600 });
      res.type("application/xml").send(xml);
    } catch (err) {
      log(`Sitemap generation error: ${err}`, "public");
      res.status(500).send("Error generating sitemap");
    }
  });

  router.get("/robots.txt", async (req: Request, res: Response) => {
    const site = req.publicSite;
    if (!site) return res.status(404).send("Not found");

    try {
      const robotsTxt = await seoService.getRobotsTxt(site.id);
      const baseUrl = buildBaseUrl(req, site);
      const content = robotsTxt.includes("Sitemap:")
        ? robotsTxt
        : `${robotsTxt}\nSitemap: ${baseUrl}/sitemap.xml\n`;
      setCacheHeaders(res, { maxAge: 3600 });
      res.type("text/plain").send(content);
    } catch (err) {
      log(`Robots.txt error: ${err}`, "public");
      res.status(500).send("Error generating robots.txt");
    }
  });

  router.get("/*", async (req: Request, res: Response) => {
    const site = req.publicSite;
    if (!site) {
      return res.status(404).send(render404Page("ORIGIN"));
    }

    try {
      const requestPath = req.path || "/";
      const redirect = await redirectsService.findRedirectByPath(site.id, requestPath);
      if (redirect) {
        return res.redirect(redirect.code, redirect.toUrl);
      }
    } catch (err) {
      log(`Redirect lookup error: ${err}`, "public");
    }

    let pageSlug = req.params[0] || req.path.replace(/^\/+/, "") || "";
    pageSlug = pageSlug.replace(/\/+$/, "");

    if (!pageSlug || pageSlug === "/") {
      const allPages = await publicSiteService.getPublishedPages(site.id);
      const homePage = allPages.find((p) => p.slug === "home" || p.slug === "index" || p.slug === "/");
      if (homePage) {
        pageSlug = homePage.slug;
      } else if (allPages.length > 0) {
        pageSlug = allPages[0].slug;
      } else {
        setNoCacheHeaders(res);
        return res.status(404).send(render404Page(site.name));
      }
    }

    try {
      const [page, sitePages, theme, headerMenu, footerMenu, seoSettings] = await Promise.all([
        publicSiteService.getPublishedPage(site.id, pageSlug),
        publicSiteService.getPublishedPages(site.id),
        publicSiteService.getSiteTheme(site.id),
        publicSiteService.getMenuBySlot(site.id, "header"),
        publicSiteService.getMenuBySlot(site.id, "footer"),
        seoService.getSeoSettings(site.id),
      ]);

      if (!page) {
        setNoCacheHeaders(res);
        return res.status(404).send(render404Page(site.name));
      }

      setCacheHeaders(res, { maxAge: 60 });
      const baseUrl = buildBaseUrl(req, site);

      const html = renderPublicPage({
        site: { name: site.name, slug: site.slug },
        page,
        theme,
        pages: sitePages,
        headerMenu: headerMenu ?? undefined,
        footerMenu: footerMenu ?? undefined,
        seoDefaults: seoSettings ? {
          titleSuffix: seoSettings.titleSuffix,
          defaultOgImage: seoSettings.defaultOgImage,
          defaultIndexable: seoSettings.defaultIndexable ?? true,
        } : undefined,
        baseUrl,
      });

      res.type("html").send(html);
    } catch (err) {
      log(`Public page render error: ${err}`, "public");
      setNoCacheHeaders(res);
      res.status(500).send(render404Page(site.name));
    }
  });

  return router;
}
