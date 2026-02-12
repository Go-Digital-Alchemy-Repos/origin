import { db } from "../../db";
import { pages, pageRevisions } from "@shared/schema";
import type { InsertPage, Page, PageRevision } from "@shared/schema";
import { eq, and, desc, asc, ilike, sql, inArray } from "drizzle-orm";

const MAX_REVISIONS = 10;

async function getNextVersion(pageId: string): Promise<number> {
  const [result] = await db
    .select({ maxVersion: sql<number>`COALESCE(MAX(${pageRevisions.version}), 0)` })
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, pageId));
  return (result?.maxVersion ?? 0) + 1;
}

async function pruneRevisions(pageId: string): Promise<void> {
  const revs = await db
    .select({ id: pageRevisions.id })
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, pageId))
    .orderBy(desc(pageRevisions.version));

  if (revs.length > MAX_REVISIONS) {
    const idsToDelete = revs.slice(MAX_REVISIONS).map((r) => r.id);
    await db.delete(pageRevisions).where(inArray(pageRevisions.id, idsToDelete));
  }
}

async function createRevision(
  pageId: string,
  contentJson: unknown,
  userId: string | null,
  note?: string,
): Promise<PageRevision> {
  const version = await getNextVersion(pageId);
  const [rev] = await db
    .insert(pageRevisions)
    .values({
      pageId,
      version,
      contentJson: contentJson ?? {},
      createdByUserId: userId,
      note: note ?? null,
    })
    .returning();
  await pruneRevisions(pageId);
  return rev;
}

export const cmsPagesService = {
  async getPagesBySite(
    siteId: string,
    workspaceId: string,
    opts?: { search?: string; status?: string },
  ): Promise<Page[]> {
    const conditions = [eq(pages.siteId, siteId), eq(pages.workspaceId, workspaceId)];
    if (opts?.status) conditions.push(eq(pages.status, opts.status));
    if (opts?.search) conditions.push(ilike(pages.title, `%${opts.search}%`));
    return db
      .select()
      .from(pages)
      .where(and(...conditions))
      .orderBy(desc(pages.updatedAt));
  },

  async getPage(pageId: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
    return page ?? undefined;
  },

  async getPageForWorkspace(pageId: string, workspaceId: string): Promise<Page | undefined> {
    const [page] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)));
    return page ?? undefined;
  },

  async createPage(
    data: { title: string; slug: string; siteId: string; workspaceId: string; seoTitle?: string; seoDescription?: string; seoImage?: string },
    userId: string,
    initialContent?: unknown,
  ): Promise<{ page: Page; revision: PageRevision }> {
    const [page] = await db
      .insert(pages)
      .values({
        title: data.title,
        slug: data.slug,
        siteId: data.siteId,
        workspaceId: data.workspaceId,
        status: "DRAFT",
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        seoImage: data.seoImage ?? null,
      })
      .returning();

    const revision = await createRevision(page.id, initialContent ?? {}, userId, "Initial creation");
    return { page, revision };
  },

  async updatePage(
    pageId: string,
    data: { title?: string; slug?: string; contentJson?: unknown; seoTitle?: string; seoDescription?: string; seoImage?: string },
    userId: string,
    note?: string,
  ): Promise<{ page: Page; revision: PageRevision }> {
    const existing = await cmsPagesService.getPage(pageId);
    if (!existing) throw new Error("Page not found");

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.slug !== undefined) updateFields.slug = data.slug;
    if (data.seoTitle !== undefined) updateFields.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) updateFields.seoDescription = data.seoDescription;
    if (data.seoImage !== undefined) updateFields.seoImage = data.seoImage;

    const [page] = await db.update(pages).set(updateFields).where(eq(pages.id, pageId)).returning();

    const revision = await createRevision(pageId, data.contentJson ?? {}, userId, note ?? "Draft save");
    return { page, revision };
  },

  async publishPage(
    pageId: string,
    userId: string,
    contentJson?: unknown,
  ): Promise<{ page: Page; revision: PageRevision }> {
    const existing = await cmsPagesService.getPage(pageId);
    if (!existing) throw new Error("Page not found");

    const latestContent = contentJson ?? (await cmsPagesService.getLatestRevision(pageId))?.contentJson ?? {};

    const [page] = await db
      .update(pages)
      .set({ status: "PUBLISHED", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(pages.id, pageId))
      .returning();

    const revision = await createRevision(pageId, latestContent, userId, "Published");
    return { page, revision };
  },

  async rollbackToRevision(
    pageId: string,
    revisionId: string,
    userId: string,
  ): Promise<{ page: Page; revision: PageRevision }> {
    const [sourceRev] = await db
      .select()
      .from(pageRevisions)
      .where(and(eq(pageRevisions.id, revisionId), eq(pageRevisions.pageId, pageId)));

    if (!sourceRev) throw new Error("Revision not found");

    const [page] = await db
      .update(pages)
      .set({ updatedAt: new Date() })
      .where(eq(pages.id, pageId))
      .returning();

    const revision = await createRevision(
      pageId,
      sourceRev.contentJson,
      userId,
      `Rollback to v${sourceRev.version}`,
    );

    return { page, revision };
  },

  async getRevisions(pageId: string): Promise<PageRevision[]> {
    return db
      .select()
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, pageId))
      .orderBy(desc(pageRevisions.version));
  },

  async getLatestRevision(pageId: string): Promise<PageRevision | undefined> {
    const [rev] = await db
      .select()
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, pageId))
      .orderBy(desc(pageRevisions.version))
      .limit(1);
    return rev ?? undefined;
  },

  async deletePage(pageId: string): Promise<void> {
    await db.delete(pages).where(eq(pages.id, pageId));
  },
};
