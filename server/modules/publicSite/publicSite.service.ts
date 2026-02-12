import { db } from "../../db";
import { sites, siteDomains, pages, pageRevisions, siteThemes, menus, menuItems } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

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
  canonicalUrl: string | null;
  indexable: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
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
      canonicalUrl: page.canonicalUrl,
      indexable: page.indexable,
      ogTitle: page.ogTitle,
      ogDescription: page.ogDescription,
      ogImage: page.ogImage,
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

  async getMenuBySlot(siteId: string, slot: string): Promise<{ name: string; items: Array<{ id: string; parentId: string | null; label: string; type: string; target: string | null; openInNewTab: boolean; sortOrder: number }> } | null> {
    const [menu] = await db
      .select()
      .from(menus)
      .where(and(eq(menus.siteId, siteId), eq(menus.slot, slot)))
      .limit(1);

    if (!menu) return null;

    const items = await db
      .select({
        id: menuItems.id,
        parentId: menuItems.parentId,
        label: menuItems.label,
        type: menuItems.type,
        target: menuItems.target,
        openInNewTab: menuItems.openInNewTab,
        sortOrder: menuItems.sortOrder,
      })
      .from(menuItems)
      .where(eq(menuItems.menuId, menu.id))
      .orderBy(asc(menuItems.sortOrder));

    return { name: menu.name, items };
  },
};
