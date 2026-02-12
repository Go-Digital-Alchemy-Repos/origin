import { db } from "../../db";
import { siteSeoSettings, sites, pages } from "@shared/schema";
import type { SiteSeoSettings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export const seoService = {
  async verifySiteOwnership(siteId: string, workspaceId: string): Promise<boolean> {
    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.workspaceId, workspaceId)));
    return !!site;
  },

  async getSeoSettings(siteId: string): Promise<SiteSeoSettings | null> {
    const [settings] = await db
      .select()
      .from(siteSeoSettings)
      .where(eq(siteSeoSettings.siteId, siteId))
      .limit(1);
    return settings ?? null;
  },

  async upsertSeoSettings(
    siteId: string,
    data: {
      titleSuffix?: string | null;
      defaultOgImage?: string | null;
      defaultIndexable?: boolean;
      robotsTxt?: string | null;
    },
  ): Promise<SiteSeoSettings> {
    const existing = await this.getSeoSettings(siteId);

    if (existing) {
      const [updated] = await db
        .update(siteSeoSettings)
        .set({
          titleSuffix: data.titleSuffix !== undefined ? data.titleSuffix : existing.titleSuffix,
          defaultOgImage: data.defaultOgImage !== undefined ? data.defaultOgImage : existing.defaultOgImage,
          defaultIndexable: data.defaultIndexable !== undefined ? data.defaultIndexable : existing.defaultIndexable,
          robotsTxt: data.robotsTxt !== undefined ? data.robotsTxt : existing.robotsTxt,
          updatedAt: new Date(),
        })
        .where(eq(siteSeoSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(siteSeoSettings)
      .values({
        siteId,
        titleSuffix: data.titleSuffix ?? null,
        defaultOgImage: data.defaultOgImage ?? null,
        defaultIndexable: data.defaultIndexable ?? true,
        robotsTxt: data.robotsTxt ?? null,
      })
      .returning();
    return created;
  },

  async getSitemapPages(siteId: string): Promise<Array<{
    slug: string;
    updatedAt: Date | null;
    publishedAt: Date | null;
  }>> {
    return db
      .select({
        slug: pages.slug,
        updatedAt: pages.updatedAt,
        publishedAt: pages.publishedAt,
      })
      .from(pages)
      .where(and(eq(pages.siteId, siteId), eq(pages.status, "PUBLISHED")))
      .orderBy(pages.slug);
  },

  async getRobotsTxt(siteId: string): Promise<string> {
    const settings = await this.getSeoSettings(siteId);
    if (settings?.robotsTxt) {
      return settings.robotsTxt;
    }
    return `User-agent: *\nAllow: /\n`;
  },

  generateSitemapXml(
    baseUrl: string,
    sitePages: Array<{ slug: string; updatedAt: Date | null; publishedAt: Date | null }>,
  ): string {
    const urls = sitePages.map((p) => {
      const loc = p.slug === "home" || p.slug === "index" || p.slug === "/"
        ? baseUrl + "/"
        : `${baseUrl}/${p.slug}`;
      const lastmod = p.updatedAt || p.publishedAt;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
  </url>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  },
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
