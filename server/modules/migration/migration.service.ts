import { db } from "../../db";
import {
  migrationJobs,
  migrationLogs,
  pages,
  pageRevisions,
  collections,
  collectionItems,
  collectionItemRevisions,
  redirectSuggestions,
  sites,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { parseWpExport, generateRedirectSuggestions, type WpExportData, type WpItem } from "./wpParser";
import { BLOG_COLLECTION_SLUG, BLOG_POST_SCHEMA } from "../blog/blog.service";
import type { MigrationJob, MigrationLog } from "@shared/schema";

async function addLog(jobId: string, level: string, message: string, meta?: unknown) {
  await db.insert(migrationLogs).values({
    jobId,
    level,
    message,
    meta: meta ?? {},
  });
}

function wpContentToPageBuilderJson(htmlContent: string, title: string): unknown {
  return {
    schemaVersion: 1,
    data: {
      content: [
        {
          type: "richtext",
          props: {
            content: htmlContent || `<p>${title}</p>`,
          },
        },
      ],
    },
  };
}

export const migrationService = {
  async verifySiteOwnership(siteId: string, workspaceId: string): Promise<boolean> {
    const [site] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.workspaceId, workspaceId)));
    return !!site;
  },

  async getJob(jobId: string): Promise<MigrationJob | null> {
    const [job] = await db.select().from(migrationJobs).where(eq(migrationJobs.id, jobId));
    return job || null;
  },

  async getJobsByWorkspace(workspaceId: string): Promise<MigrationJob[]> {
    return db
      .select()
      .from(migrationJobs)
      .where(eq(migrationJobs.workspaceId, workspaceId))
      .orderBy(desc(migrationJobs.createdAt));
  },

  async getJobLogs(jobId: string): Promise<MigrationLog[]> {
    return db
      .select()
      .from(migrationLogs)
      .where(eq(migrationLogs.jobId, jobId))
      .orderBy(migrationLogs.createdAt);
  },

  async startImport(
    workspaceId: string,
    siteId: string,
    userId: string,
    xmlContent: string,
    fileName: string,
  ): Promise<MigrationJob> {
    const [job] = await db
      .insert(migrationJobs)
      .values({
        workspaceId,
        siteId,
        createdByUserId: userId,
        source: "wordpress",
        status: "running",
        fileName,
      })
      .returning();

    try {
      await addLog(job.id, "info", `Starting WordPress import from file: ${fileName}`);

      const wpData = parseWpExport(xmlContent);
      await addLog(job.id, "info", `Parsed WP export: ${wpData.pages.length} pages, ${wpData.posts.length} posts, ${wpData.media.length} media items`);

      const importedPages = await importPages(job.id, siteId, workspaceId, userId, wpData.pages);
      await addLog(job.id, "info", `Imported ${importedPages.length} pages`);

      const importedPosts = await importPosts(job.id, siteId, workspaceId, userId, wpData.posts);
      await addLog(job.id, "info", `Imported ${importedPosts.length} blog posts`);

      const mediaCount = await importMedia(job.id, wpData.media);
      await addLog(job.id, "info", `Processed ${mediaCount} media references`);

      const redirects = generateRedirectSuggestions(wpData, importedPages, importedPosts);
      let redirectCount = 0;
      if (redirects.length > 0) {
        for (const r of redirects) {
          await db.insert(redirectSuggestions).values({
            siteId,
            fromPath: r.fromPath,
            toUrl: r.toUrl,
            source: "wp_import",
          });
          redirectCount++;
        }
        await addLog(job.id, "info", `Created ${redirectCount} redirect suggestions`);
      }

      const summary = {
        pagesImported: importedPages.length,
        postsImported: importedPosts.length,
        mediaProcessed: mediaCount,
        redirectSuggestions: redirectCount,
        wpSiteTitle: wpData.siteTitle,
        wpSiteUrl: wpData.siteUrl,
      };

      const [completed] = await db
        .update(migrationJobs)
        .set({ status: "completed", summary, completedAt: new Date() })
        .where(eq(migrationJobs.id, job.id))
        .returning();

      await addLog(job.id, "info", "Import completed successfully");
      return completed;
    } catch (err: any) {
      await addLog(job.id, "error", `Import failed: ${err.message}`);
      const [failed] = await db
        .update(migrationJobs)
        .set({
          status: "failed",
          summary: { error: err.message },
          completedAt: new Date(),
        })
        .where(eq(migrationJobs.id, job.id))
        .returning();
      return failed;
    }
  },
};

async function importPages(
  jobId: string,
  siteId: string,
  workspaceId: string,
  userId: string,
  wpPages: WpItem[],
): Promise<Array<{ wpSlug: string; newSlug: string }>> {
  const imported: Array<{ wpSlug: string; newSlug: string }> = [];

  for (const wpPage of wpPages) {
    if (wpPage.status === "trash") continue;

    try {
      let slug = wpPage.slug;
      const existing = await db
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.siteId, siteId), eq(pages.slug, slug)))
        .limit(1);

      if (existing.length > 0) {
        slug = `${slug}-imported-${Date.now().toString(36).slice(-4)}`;
      }

      const contentJson = wpContentToPageBuilderJson(wpPage.content, wpPage.title);

      const [page] = await db
        .insert(pages)
        .values({
          title: wpPage.title,
          slug,
          siteId,
          workspaceId,
          status: wpPage.status === "publish" ? "DRAFT" : "DRAFT",
          seoTitle: wpPage.title,
          seoDescription: wpPage.excerpt || null,
        })
        .returning();

      const [maxResult] = await db
        .select({ max: sql<number>`COALESCE(MAX(${pageRevisions.version}), 0)` })
        .from(pageRevisions)
        .where(eq(pageRevisions.pageId, page.id));

      await db.insert(pageRevisions).values({
        pageId: page.id,
        version: (maxResult?.max ?? 0) + 1,
        contentJson,
        createdByUserId: userId,
        note: "Imported from WordPress",
      });

      imported.push({ wpSlug: wpPage.slug, newSlug: slug });
    } catch (err: any) {
      await addLog(jobId, "warn", `Skipped page "${wpPage.title}": ${err.message}`);
    }
  }

  return imported;
}

async function importPosts(
  jobId: string,
  siteId: string,
  workspaceId: string,
  userId: string,
  wpPosts: WpItem[],
): Promise<Array<{ wpSlug: string; newSlug: string }>> {
  const imported: Array<{ wpSlug: string; newSlug: string }> = [];

  let [blogCol] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.siteId, siteId), eq(collections.slug, BLOG_COLLECTION_SLUG)))
    .limit(1);

  if (!blogCol) {
    [blogCol] = await db
      .insert(collections)
      .values({
        name: "Blog Posts",
        slug: BLOG_COLLECTION_SLUG,
        description: "Blog posts for your site. Each item represents one article.",
        schemaJson: BLOG_POST_SCHEMA,
        siteId,
        workspaceId,
      })
      .returning();

    await addLog(jobId, "info", "Created blog collection for imported posts");
  }

  for (const wpPost of wpPosts) {
    if (wpPost.status === "trash") continue;

    try {
      const postData = {
        title: wpPost.title,
        slug: wpPost.slug,
        excerpt: wpPost.excerpt,
        body: wpPost.content,
        featured_image: "",
        author: wpPost.creator,
        category: wpPost.categories[0] || "General",
        tags: wpPost.tags.join(", "),
        published_date: wpPost.pubDate || new Date().toISOString(),
        seo_title: wpPost.title,
        seo_description: wpPost.excerpt,
        og_image: "",
      };

      const [item] = await db
        .insert(collectionItems)
        .values({ collectionId: blogCol.id, status: "DRAFT" })
        .returning();

      const [maxResult] = await db
        .select({ max: sql<number>`COALESCE(MAX(${collectionItemRevisions.version}), 0)` })
        .from(collectionItemRevisions)
        .where(eq(collectionItemRevisions.itemId, item.id));

      await db.insert(collectionItemRevisions).values({
        itemId: item.id,
        version: (maxResult?.max ?? 0) + 1,
        dataJson: postData,
        createdByUserId: userId,
        note: "Imported from WordPress",
      });

      imported.push({ wpSlug: wpPost.slug, newSlug: wpPost.slug });
    } catch (err: any) {
      await addLog(jobId, "warn", `Skipped post "${wpPost.title}": ${err.message}`);
    }
  }

  return imported;
}

async function importMedia(
  jobId: string,
  wpMedia: WpItem[],
): Promise<number> {
  let count = 0;

  for (const item of wpMedia) {
    if (item.attachmentUrl) {
      await addLog(jobId, "info", `Media reference: ${item.title} → ${item.attachmentUrl}`, {
        title: item.title,
        url: item.attachmentUrl,
      });
      count++;
    }
  }

  return count;
}
