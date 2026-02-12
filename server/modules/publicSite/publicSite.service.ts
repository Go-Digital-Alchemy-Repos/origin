import { db } from "../../db";
import { sites, siteDomains, pages, pageRevisions, siteThemes } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const SUBDOMAIN_SUFFIX = ".originapp.ai";

export interface ResolvedSite {
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
}

export interface PublishedPage {
  id: string;
  title: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImage: string | null;
  contentJson: unknown;
  publishedAt: Date | null;
}

export const publicSiteService = {
  async resolveSiteByHost(hostname: string): Promise<ResolvedSite | null> {
    const customDomain = await db
      .select({
        id: sites.id,
        name: sites.name,
        slug: sites.slug,
        workspaceId: sites.workspaceId,
      })
      .from(siteDomains)
      .innerJoin(sites, eq(siteDomains.siteId, sites.id))
      .where(eq(siteDomains.domain, hostname.toLowerCase()))
      .limit(1);

    if (customDomain.length > 0) {
      return customDomain[0];
    }

    if (hostname.endsWith(SUBDOMAIN_SUFFIX)) {
      const slug = hostname.slice(0, -SUBDOMAIN_SUFFIX.length);
      if (!slug || slug.includes(".")) return null;

      const [site] = await db
        .select({
          id: sites.id,
          name: sites.name,
          slug: sites.slug,
          workspaceId: sites.workspaceId,
        })
        .from(sites)
        .where(eq(sites.slug, slug))
        .limit(1);

      return site ?? null;
    }

    return null;
  },

  async getPublishedPage(siteId: string, pageSlug: string): Promise<PublishedPage | null> {
    const [page] = await db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.siteId, siteId),
          eq(pages.slug, pageSlug),
          eq(pages.status, "PUBLISHED"),
        ),
      )
      .limit(1);

    if (!page) return null;

    const [latestRev] = await db
      .select()
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, page.id))
      .orderBy(desc(pageRevisions.version))
      .limit(1);

    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoImage: page.seoImage,
      contentJson: latestRev?.contentJson ?? {},
      publishedAt: page.publishedAt,
    };
  },

  async getPublishedPages(siteId: string): Promise<Array<{ slug: string; title: string }>> {
    return db
      .select({ slug: pages.slug, title: pages.title })
      .from(pages)
      .where(and(eq(pages.siteId, siteId), eq(pages.status, "PUBLISHED")))
      .orderBy(pages.title);
  },

  async getSiteTheme(siteId: string) {
    const [theme] = await db
      .select()
      .from(siteThemes)
      .where(eq(siteThemes.siteId, siteId))
      .limit(1);
    return theme ?? null;
  },
};
